import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'

/**
 * Gaji bulanan dibayar bersama batch mingguan terakhir di bulan itu.
 * Periode disebut terakhir kalau periode berikutnya sudah masuk bulan lain.
 */
function isLastPeriodOfMonth(endDate: Date) {
  const next = new Date(endDate)
  next.setDate(next.getDate() + 7)
  return next.getMonth() !== endDate.getMonth()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: parseInt(id) },
    include: {
      payments: { include: { sourceAccount: true }, orderBy: { batchNo: 'asc' } },
    },
  })
  if (!period) return errorResponse('Periode gaji tidak ditemukan', 404)

  const [records, advances, gardens, monthlyEmployees] = await Promise.all([
    prisma.payrollRecord.findMany({
      where: { periodId: period.id, deletedAt: null },
      include: { employee: true, garden: true },
    }),
    prisma.employeeAdvance.findMany({
      where: { periodId: period.id, deletedAt: null },
      include: { employee: true, beneficiary: true },
    }),
    prisma.garden.findMany({ orderBy: { sortOrder: 'asc' } }),
    isLastPeriodOfMonth(period.endDate)
      ? prisma.employee.findMany({
          where: { employmentType: 'BULANAN', status: 'ACTIVE', deletedAt: null },
        })
      : Promise.resolve([]),
  ])

  // -------------------------------------------------- rekap per pekerja
  type Line = {
    employeeId: number
    employeeName: string
    gender: string | null
    employmentType: string
    perGarden: Record<number, number>
    wage: number
    advance: number
    net: number
    days: number
  }

  const lines = new Map<number, Line>()

  const lineFor = (employee: {
    id: number
    fullName: string
    gender: string | null
    employmentType: string
  }) => {
    if (!lines.has(employee.id)) {
      lines.set(employee.id, {
        employeeId: employee.id,
        employeeName: employee.fullName,
        gender: employee.gender,
        employmentType: employee.employmentType,
        perGarden: Object.fromEntries(gardens.map((garden) => [garden.id, 0])),
        wage: 0,
        advance: 0,
        net: 0,
        days: 0,
      })
    }
    return lines.get(employee.id)!
  }

  const workDays = new Map<number, Set<string>>()
  for (const record of records) {
    const line = lineFor(record.employee)
    line.wage += record.wageAmount
    line.perGarden[record.gardenId] = (line.perGarden[record.gardenId] || 0) + record.wageAmount

    if (!workDays.has(record.employeeId)) workDays.set(record.employeeId, new Set())
    workDays.get(record.employeeId)!.add(record.workDate.toISOString().slice(0, 10))
  }

  for (const employee of monthlyEmployees) {
    const line = lineFor(employee)
    line.wage += employee.monthlySalary
  }

  // Kasbon jadi pengurang bayaran orang yang meminjam.
  for (const advance of advances) {
    const line = lineFor(advance.employee)
    line.advance += advance.amount - advance.settledAmount
  }

  for (const [employeeId, line] of lines) {
    line.days = workDays.get(employeeId)?.size ?? 0
    line.net = line.wage - line.advance
  }

  const sorted = [...lines.values()].sort((a, b) => {
    if (a.gender !== b.gender) return (a.gender || 'Z').localeCompare(b.gender || 'Z')
    return a.employeeName.localeCompare(b.employeeName)
  })

  const sum = (predicate: (line: Line) => boolean) =>
    sorted.filter(predicate).reduce((total, line) => total + line.net, 0)

  const totalWage = sorted.reduce((total, line) => total + line.wage, 0)
  const totalAdvance = sorted.reduce((total, line) => total + line.advance, 0)
  const totalPaid = period.payments.reduce((total, payment) => total + payment.amount, 0)

  const perGarden = gardens.map((garden) => ({
    gardenId: garden.id,
    gardenName: garden.name,
    amount: sorted.reduce((total, line) => total + (line.perGarden[garden.id] || 0), 0),
  }))

  return jsonResponse({
    period,
    lines: sorted,
    gardens: gardens.map((garden) => ({ id: garden.id, name: garden.name })),
    summary: {
      totalWage,
      totalAdvance,
      totalNet: totalWage - totalAdvance,
      totalPaid,
      outstanding: totalWage - totalAdvance - totalPaid,
      perempuan: sum((line) => line.gender === 'P'),
      lakiLaki: sum((line) => line.gender === 'L'),
      perGarden,
      recordCount: records.length,
      includesMonthlySalary: monthlyEmployees.length > 0,
    },
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  try {
    const { status, notes } = await request.json()
    const existing = await prisma.payrollPeriod.findUnique({ where: { id: parseInt(id) } })
    if (!existing) return errorResponse('Periode gaji tidak ditemukan', 404)

    if (status && !['OPEN', 'LOCKED', 'PAID'].includes(status)) {
      return errorResponse('Status periode tidak valid')
    }

    const period = await prisma.payrollPeriod.update({
      where: { id: parseInt(id) },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    })

    logAudit(user!.id, 'UPDATE', 'PayrollPeriod', period.id, status ? `status: ${status}` : undefined)
    return jsonResponse(period)
  } catch (err) {
    console.error('Update payroll period error:', err)
    return errorResponse('Gagal mengupdate periode gaji')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const periodId = parseInt(id)
  const existing = await prisma.payrollPeriod.findUnique({ where: { id: periodId } })
  if (!existing) return errorResponse('Periode gaji tidak ditemukan', 404)

  const payments = await prisma.payrollPayment.count({ where: { periodId } })
  if (payments > 0) {
    return errorResponse('Periode yang sudah ada pembayarannya tidak bisa dihapus')
  }

  await prisma.payrollRecord.updateMany({ where: { periodId }, data: { periodId: null } })
  await prisma.employeeAdvance.updateMany({ where: { periodId }, data: { periodId: null } })
  await prisma.payrollPeriod.delete({ where: { id: periodId } })

  logAudit(user!.id, 'DELETE', 'PayrollPeriod', periodId)
  return jsonResponse({ message: 'Periode gaji berhasil dihapus' })
}
