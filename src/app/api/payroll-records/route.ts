import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, parseSearchParams, jsonResponse, errorResponse } from '@/lib/api-utils'
import { calculateShiftWage } from '@/lib/utils'
import { gardenWhere } from '@/lib/garden'
import { logAudit } from '@/lib/audit'
import { createPayrollSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { page, limit, search, sortBy, sortOrder, startDate, endDate } = parseSearchParams(request.url)
  const params = new URL(request.url).searchParams
  const employeeId = params.get('employeeId') || ''
  const jobTypeId = params.get('jobTypeId') || ''
  const blockId = params.get('blockId') || ''
  const shift = params.get('shift') || ''

  const where: any = { deletedAt: null, ...gardenWhere(request.url) }
  if (search) {
    where.OR = [
      { employee: { fullName: { contains: search } } },
      { jobType: { name: { contains: search } } },
      { notes: { contains: search } },
    ]
  }
  if (employeeId) where.employeeId = parseInt(employeeId)
  if (jobTypeId) where.jobTypeId = parseInt(jobTypeId)
  if (blockId) where.blockId = parseInt(blockId)
  if (shift) where.shift = shift
  if (startDate) where.workDate = { ...where.workDate, gte: new Date(startDate) }
  if (endDate) where.workDate = { ...where.workDate, lte: new Date(endDate) }

  const [items, total, totals] = await Promise.all([
    prisma.payrollRecord.findMany({
      where,
      include: {
        employee: true,
        garden: true,
        block: true,
        jobType: true,
        user: { select: { id: true, fullName: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payrollRecord.count({ where }),
    prisma.payrollRecord.aggregate({ where, _sum: { wageAmount: true, lemburHours: true } }),
  ])

  return jsonResponse({
    items,
    total,
    page,
    limit,
    totals: {
      totalWage: totals._sum.wageAmount || 0,
      totalLemburHours: totals._sum.lemburHours || 0,
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
    const {
      employeeId, gardenId, blockId, jobTypeId, workDate, shift,
      startTime, endTime, lemburHours, headcount, wageAmount, notes,
    } = parsed.data

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null },
    })
    if (!employee) return errorResponse('Karyawan tidak ditemukan')

    const garden = await prisma.garden.findFirst({ where: { id: gardenId, isActive: true } })
    if (!garden) return errorResponse('Kebun tidak ditemukan')

    if (blockId) {
      const block = await prisma.block.findFirst({ where: { id: blockId, gardenId } })
      if (!block) return errorResponse('Blok tidak ada di kebun yang dipilih')
    }

    // Borongan tidak punya tarif shift, nominalnya harus diisi manual.
    const computed = calculateShiftWage(employee, shift, lemburHours || 0, headcount || 1)
    const isManualWage = wageAmount !== undefined && wageAmount !== computed
    const finalWage = wageAmount !== undefined ? wageAmount : computed

    if (shift === 'BORONGAN' && !finalWage) {
      return errorResponse('Upah borongan wajib diisi manual')
    }

    const workDateValue = new Date(workDate)
    const period = await prisma.payrollPeriod.findFirst({
      where: { startDate: { lte: workDateValue }, endDate: { gte: workDateValue } },
    })

    const record = await prisma.payrollRecord.create({
      data: {
        employeeId,
        gardenId,
        blockId: blockId || null,
        jobTypeId: jobTypeId || null,
        workDate: workDateValue,
        shift,
        startTime: startTime || null,
        endTime: endTime || null,
        lemburHours: lemburHours || 0,
        headcount: headcount || 1,
        wageAmount: finalWage,
        isManualWage,
        periodId: period?.id ?? null,
        inputBy: user!.id,
        notes: notes || null,
      },
      include: { employee: true, garden: true, jobType: true, block: true },
    })

    logAudit(user!.id, 'CREATE', 'PayrollRecord', record.id)
    return jsonResponse(record, 201)
  } catch (err) {
    console.error('Create payroll error:', err)
    return errorResponse('Gagal membuat catatan gaji')
  }
}
