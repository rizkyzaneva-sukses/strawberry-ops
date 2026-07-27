import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { calculateWage } from '@/lib/utils'
import { logAudit } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const record = await prisma.payrollRecord.findFirst({
    where: { id: parseInt(id), deletedAt: null },
    include: { employee: true, user: { select: { id: true, fullName: true } } },
  })

  if (!record) {
    return errorResponse('Catatan gaji tidak ditemukan', 404)
  }

  return jsonResponse(record)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  try {
    const body = await request.json()
    const { employeeId, workDate, workArea, shiftNgabedug, shiftNyore, lemburHours, notes } = body

    const existing = await prisma.payrollRecord.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })
    if (!existing) {
      return errorResponse('Catatan gaji tidak ditemukan', 404)
    }

    const empId = employeeId || existing.employeeId
    const employee = await prisma.employee.findUnique({ where: { id: empId } })
    if (!employee) {
      return errorResponse('Karyawan tidak ditemukan')
    }

    const newShiftNgabedug = shiftNgabedug !== undefined ? shiftNgabedug : existing.shiftNgabedug
    const newShiftNyore = shiftNyore !== undefined ? shiftNyore : existing.shiftNyore
    const newLemburHours = lemburHours !== undefined ? parseFloat(lemburHours) : existing.lemburHours

    const wageAmount = calculateWage(
      employee.wageNgabedug,
      employee.wageNyore,
      newShiftNgabedug,
      newShiftNyore,
      newLemburHours
    )

    const record = await prisma.payrollRecord.update({
      where: { id: parseInt(id) },
      data: {
        ...(employeeId !== undefined && { employeeId: parseInt(employeeId) }),
        ...(workDate !== undefined && { workDate: new Date(workDate) }),
        ...(workArea !== undefined && { workArea: workArea || null }),
        ...(shiftNgabedug !== undefined && { shiftNgabedug: shiftNgabedug }),
        ...(shiftNyore !== undefined && { shiftNyore: shiftNyore }),
        ...(lemburHours !== undefined && { lemburHours: parseFloat(lemburHours) }),
        wageAmount,
        ...(notes !== undefined && { notes: notes || null }),
      },
      include: { employee: true },
    })

    const changes: string[] = []
    if (wageAmount !== existing.wageAmount) changes.push(`wageAmount: ${existing.wageAmount} -> ${wageAmount}`)
    if (workArea !== undefined && workArea !== existing.workArea) changes.push(`workArea: ${existing.workArea} -> ${workArea}`)
    logAudit(user!.id, 'UPDATE', 'PayrollRecord', record.id, changes.length > 0 ? JSON.stringify(changes) : undefined)

    return jsonResponse(record)
  } catch (err) {
    console.error('Update payroll error:', err)
    return errorResponse('Gagal mengupdate catatan gaji')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const existing = await prisma.payrollRecord.findFirst({
    where: { id: parseInt(id), deletedAt: null },
  })
  if (!existing) {
    return errorResponse('Catatan gaji tidak ditemukan', 404)
  }

  await prisma.payrollRecord.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() },
  })

  logAudit(user!.id, 'DELETE', 'PayrollRecord', parseInt(id), 'Soft deleted')
  return jsonResponse({ message: 'Catatan gaji berhasil dihapus' })
}
