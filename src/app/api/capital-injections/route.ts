import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, parseSearchParams, jsonResponse, errorResponse } from '@/lib/api-utils'
import { gardenWhere } from '@/lib/garden'
import { logAudit } from '@/lib/audit'
import { createCapitalSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { page, limit, search, sortOrder, startDate, endDate } = parseSearchParams(request.url)
  const fundingType = new URL(request.url).searchParams.get('fundingType') || ''

  const where: any = { deletedAt: null, ...gardenWhere(request.url) }
  if (search) {
    where.OR = [
      { description: { contains: search } },
      { sourceAccount: { contains: search } },
      { investor: { name: { contains: search } } },
    ]
  }
  if (fundingType) where.fundingType = fundingType
  if (startDate) where.entryDate = { ...where.entryDate, gte: new Date(startDate) }
  if (endDate) where.entryDate = { ...where.entryDate, lte: new Date(endDate) }

  const [items, total, equity, loan] = await Promise.all([
    prisma.capitalInjection.findMany({
      where,
      include: { garden: true, investor: true, destinationAccount: true },
      orderBy: { entryDate: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.capitalInjection.count({ where }),
    prisma.capitalInjection.aggregate({
      where: { ...where, fundingType: 'EQUITY' },
      _sum: { amount: true },
    }),
    prisma.capitalInjection.aggregate({
      where: { ...where, fundingType: 'LOAN' },
      _sum: { amount: true, repaidAmount: true },
    }),
  ])

  const loanTotal = loan._sum.amount || 0
  const loanRepaid = loan._sum.repaidAmount || 0

  return jsonResponse({
    items,
    total,
    page,
    limit,
    totals: {
      equity: equity._sum.amount || 0,
      loan: loanTotal,
      loanRepaid,
      loanOutstanding: loanTotal - loanRepaid,
      grandTotal: (equity._sum.amount || 0) + loanTotal,
    },
  })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createCapitalSchema.safeParse(body)
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message)

    const garden = await prisma.garden.findFirst({
      where: { id: parsed.data.gardenId, isActive: true },
    })
    if (!garden) return errorResponse('Kebun tidak ditemukan')
    if (!garden.hasInvestor) {
      return errorResponse(`${garden.name} tidak memakai pencatatan modal investor`)
    }

    if (parsed.data.fundingType === 'EQUITY' && parsed.data.repaidAmount) {
      return errorResponse('Modal penyertaan tidak punya pengembalian')
    }

    const record = await prisma.capitalInjection.create({
      data: {
        gardenId: parsed.data.gardenId,
        entryDate: new Date(parsed.data.entryDate),
        description: parsed.data.description,
        investorId: parsed.data.investorId || null,
        fundingType: parsed.data.fundingType,
        amount: parsed.data.amount,
        sourceAccount: parsed.data.sourceAccount || null,
        destinationAccountId: parsed.data.destinationAccountId || null,
        repaidAmount: parsed.data.repaidAmount ?? 0,
        proofPath: body.proofPath || null,
        notes: parsed.data.notes || null,
        inputBy: user!.id,
      },
      include: { garden: true, investor: true, destinationAccount: true },
    })

    logAudit(user!.id, 'CREATE', 'CapitalInjection', record.id)
    return jsonResponse(record, 201)
  } catch (err) {
    console.error('Create capital injection error:', err)
    return errorResponse('Gagal mencatat dana masuk')
  }
}
