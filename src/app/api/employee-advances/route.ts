import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, parseSearchParams, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'
import { createAdvanceSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { page, limit, search, startDate, endDate } = parseSearchParams(request.url)
  const params = new URL(request.url).searchParams
  const employeeId = params.get('employeeId') || ''
  const status = params.get('status') || ''

  const where: any = { deletedAt: null }
  if (search) {
    where.OR = [
      { employee: { fullName: { contains: search } } },
      { description: { contains: search } },
    ]
  }
  if (employeeId) where.employeeId = parseInt(employeeId)
  if (status) where.status = status
  if (startDate) where.advanceDate = { ...where.advanceDate, gte: new Date(startDate) }
  if (endDate) where.advanceDate = { ...where.advanceDate, lte: new Date(endDate) }

  const [items, total, totals] = await Promise.all([
    prisma.employeeAdvance.findMany({
      where,
      include: { employee: true, beneficiary: true, garden: true, period: true },
      orderBy: { advanceDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.employeeAdvance.count({ where }),
    prisma.employeeAdvance.aggregate({ where, _sum: { amount: true, settledAmount: true } }),
  ])

  const amount = totals._sum.amount || 0
  const settled = totals._sum.settledAmount || 0

  return jsonResponse({
    items,
    total,
    page,
    limit,
    totals: { amount, settled, outstanding: amount - settled },
  })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createAdvanceSchema.safeParse(body)
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message)

    const employee = await prisma.employee.findFirst({
      where: { id: parsed.data.employeeId, deletedAt: null },
    })
    if (!employee) return errorResponse('Karyawan tidak ditemukan')

    if (parsed.data.type === 'TALANGAN' && !parsed.data.beneficiaryId) {
      return errorResponse('Dana talangan harus menyebut siapa yang ditalangi')
    }
    if (parsed.data.beneficiaryId === parsed.data.employeeId) {
      return errorResponse('Penerima talangan tidak boleh orang yang sama')
    }

    const advance = await prisma.employeeAdvance.create({
      data: {
        employeeId: parsed.data.employeeId,
        gardenId: parsed.data.gardenId || null,
        advanceDate: new Date(parsed.data.advanceDate),
        amount: parsed.data.amount,
        type: parsed.data.type,
        beneficiaryId: parsed.data.beneficiaryId || null,
        description: parsed.data.description || null,
        inputBy: user!.id,
      },
      include: { employee: true, beneficiary: true, garden: true },
    })

    logAudit(user!.id, 'CREATE', 'EmployeeAdvance', advance.id)
    return jsonResponse(advance, 201)
  } catch (err) {
    console.error('Create advance error:', err)
    return errorResponse('Gagal mencatat kasbon')
  }
}
