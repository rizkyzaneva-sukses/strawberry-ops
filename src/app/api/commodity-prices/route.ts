import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  const prices = await prisma.commodityPrice.findMany({
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: { effectiveDate: 'desc' },
    take: 12,
  })

  // Get latest price
  const latest = prices[0] || null

  return jsonResponse({ prices, latest })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const { effectiveDate, normalPricePerKg, bsPricePerKg } = body

    if (!normalPricePerKg || !bsPricePerKg) {
      return errorResponse('Harga normal dan harga BS wajib diisi')
    }

    const price = await prisma.commodityPrice.create({
      data: {
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        normalPricePerKg: parseInt(normalPricePerKg),
        bsPricePerKg: parseInt(bsPricePerKg),
        updatedBy: user!.id,
      },
    })

    logAudit(user!.id, 'CREATE', 'CommodityPrice', price.id)
    return jsonResponse(price, 201)
  } catch (err) {
    console.error('Create commodity price error:', err)
    return errorResponse('Gagal membuat harga komoditas')
  }
}
