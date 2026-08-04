import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, parseSearchParams, jsonResponse, errorResponse } from '@/lib/api-utils'
import { parseGardenParam } from '@/lib/garden'
import { logAudit } from '@/lib/audit'
import { createAssetSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { page, limit, search } = parseSearchParams(request.url)
  const gardenId = parseGardenParam(request.url)

  const where: any = { deletedAt: null }
  // Aset patungan (gardenId null) ikut tampil di kedua kebun.
  if (gardenId) where.OR = [{ gardenId }, { gardenId: null }]
  if (search) where.name = { contains: search }

  const [items, total, totals] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: { garden: true, vendor: true },
      orderBy: { acquiredDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.asset.count({ where }),
    prisma.asset.aggregate({ where, _sum: { totalCost: true } }),
  ])

  return jsonResponse({
    items,
    total,
    page,
    limit,
    totals: { totalCost: totals._sum.totalCost || 0 },
  })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createAssetSchema.safeParse(body)
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message)

    const { gardenId, quantity, unitPrice, ownershipShare } = parsed.data
    // Alat patungan hanya dibebankan sebesar porsi kepemilikannya.
    const totalCost = Math.round(quantity * unitPrice * ownershipShare)

    const asset = await prisma.asset.create({
      data: {
        gardenId: gardenId || null,
        name: parsed.data.name,
        category: parsed.data.category || null,
        acquiredDate: parsed.data.acquiredDate ? new Date(parsed.data.acquiredDate) : null,
        quantity,
        unitPrice,
        ownershipShare,
        totalCost,
        paymentStatus: parsed.data.paymentStatus,
        vendorId: parsed.data.vendorId || null,
        notes: parsed.data.notes || null,
      },
      include: { garden: true, vendor: true },
    })

    logAudit(user!.id, 'CREATE', 'Asset', asset.id)
    return jsonResponse(asset, 201)
  } catch (err) {
    console.error('Create asset error:', err)
    return errorResponse('Gagal membuat data aset')
  }
}
