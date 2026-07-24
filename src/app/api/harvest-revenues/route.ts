import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, parseSearchParams, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'
import { createHarvestSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { page, limit, search, sortBy, sortOrder, startDate, endDate } = parseSearchParams(request.url)
  const workArea = new URL(request.url).searchParams.get('workArea') || ''

  const where: any = { deletedAt: null }
  if (search) {
    where.OR = [
      { workArea: { contains: search } },
      { notes: { contains: search } },
    ]
  }
  if (workArea) where.workArea = workArea
  if (startDate) where.harvestDate = { ...where.harvestDate, gte: new Date(startDate) }
  if (endDate) where.harvestDate = { ...where.harvestDate, lte: new Date(endDate) }

  const [items, total] = await Promise.all([
    prisma.harvestRevenue.findMany({
      where,
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.harvestRevenue.count({ where }),
  ])

  const totals = await prisma.harvestRevenue.aggregate({
    where,
    _sum: {
      totalRevenue: true,
      normalRevenue: true,
      bsRevenue: true,
      totalHarvestKg: true,
      bsKg: true,
      normalKg: true,
    },
  })

  return jsonResponse({
    items,
    total,
    page,
    limit,
    totals: {
      totalRevenue: totals._sum.totalRevenue || 0,
      normalRevenue: totals._sum.normalRevenue || 0,
      bsRevenue: totals._sum.bsRevenue || 0,
      totalHarvestKg: totals._sum.totalHarvestKg || 0,
      bsKg: totals._sum.bsKg || 0,
      normalKg: totals._sum.normalKg || 0,
    },
  })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createHarvestSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }
    const {
      harvestDate, workArea,
      normalPricePerKg, bsPricePerKg,
      totalHarvestKg, bsKg,
      notes,
    } = parsed.data

    const normalKg = totalHarvestKg - bsKg
    const normalRevenue = Math.round(normalKg * normalPricePerKg)
    const bsRevenue = Math.round(bsKg * bsPricePerKg)
    const totalRevenue = normalRevenue + bsRevenue
    const bsPercentage = totalHarvestKg > 0
      ? (bsKg / totalHarvestKg) * 100
      : 0

    const record = await prisma.harvestRevenue.create({
      data: {
        harvestDate: new Date(harvestDate),
        workArea: workArea || null,
        normalPricePerKg,
        bsPricePerKg,
        totalHarvestKg,
        bsKg,
        normalKg,
        normalRevenue,
        bsRevenue,
        totalRevenue,
        bsPercentage: Math.round(bsPercentage * 100) / 100,
        inputBy: user!.id,
        notes: notes || null,
      },
    })

    logAudit(user!.id, 'CREATE', 'HarvestRevenue', record.id)
    return jsonResponse(record, 201)
  } catch (err) {
    console.error('Create harvest revenue error:', err)
    return errorResponse('Gagal membuat data pendapatan panen')
  }
}
