import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, parseSearchParams, jsonResponse, errorResponse } from '@/lib/api-utils'
import { calculateWage } from '@/lib/utils'
import { logAudit } from '@/lib/audit'
import { createPayrollSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { page, limit, search, sortBy, sortOrder, startDate, endDate } = parseSearchParams(request.url)
  const employeeId = new URL(request.url).searchParams.get('employeeId') || ''
  const workArea = new URL(request.url).searchParams.get('workArea') || ''

  const where: any = { deletedAt: null }
  if (search) {
    where.OR = [
      { employee: { fullName: { contains: search } } },
      { workArea: { contains: search } },
      { notes: { contains: search } },
    ]
  }
  if (employeeId) where.employeeId = parseInt(employeeId)
  if (workArea) where.workArea = workArea
  if (startDate) where.workDate = { ...where.workDate, gte: new Date(startDate) }
  if (endDate) where.workDate = { ...where.workDate, lte: new Date(endDate) }

  const [items, total] = await Promise.all([
    prisma.payrollRecord.findMany({
      where,
      include: { employee: true, user: { select: { id: true, fullName: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payrollRecord.count({ where }),
  ])

  // Calculate totals
  const totals = await prisma.payrollRecord.aggregate({
    where,
    _sum: { wageAmount: true },
  })

  return jsonResponse({
    items,
    total,
    page,
    limit,
    totals: {
      totalWage: totals._sum.wageAmount || 0,
    },
  })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createPayrollSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }
    const { employeeId, workDate, workArea, shiftNgabedug, shiftNyore, lemburHours, notes } = parsed.data

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null },
    })
    if (!employee) {
      return errorResponse('Karyawan tidak ditemukan')
    }

    const wageAmount = calculateWage(
      employee.wageNgabedug,
      employee.wageNyore,
      shiftNgabedug || false,
      shiftNyore || false,
      lemburHours || 0
    )

    const record = await prisma.payrollRecord.create({
      data: {
        employeeId: employee.id,
        workDate: new Date(workDate),
        workArea: workArea || null,
        shiftNgabedug: shiftNgabedug || false,
        shiftNyore: shiftNyore || false,
        lemburHours: lemburHours || 0,
        wageAmount,
        inputBy: user!.id,
        notes: notes || null,
      },
      include: { employee: true },
    })

    logAudit(user!.id, 'CREATE', 'PayrollRecord', record.id)
    return jsonResponse(record, 201)
  } catch (err) {
    console.error('Create payroll error:', err)
    return errorResponse('Gagal membuat catatan gaji')
  }
}
