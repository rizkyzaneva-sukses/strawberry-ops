import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { gardenWhere } from '@/lib/garden'
import { logAudit } from '@/lib/audit'
import { createBudgetItemSchema } from '@/lib/validations'

/** Selisih positif berarti hemat dari anggaran, negatif berarti boros. */
function computeVariance(
  plannedQty: number,
  plannedUnitPrice: number,
  actualUnitPrice: number | null | undefined
) {
  if (actualUnitPrice === null || actualUnitPrice === undefined) {
    return { actualTotal: null, variance: null }
  }
  return {
    actualTotal: Math.round(plannedQty * actualUnitPrice),
    variance: Math.round(plannedQty * (plannedUnitPrice - actualUnitPrice)),
  }
}

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const items = await prisma.budgetItem.findMany({
    where: gardenWhere(request.url),
    include: { garden: true, category: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  })

  const totals = items.reduce(
    (accumulator, item) => ({
      planned: accumulator.planned + item.plannedTotal,
      actual: accumulator.actual + (item.actualTotal ?? item.plannedTotal),
      variance: accumulator.variance + (item.variance ?? 0),
    }),
    { planned: 0, actual: 0, variance: 0 }
  )

  return jsonResponse({ items, total: items.length, totals })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createBudgetItemSchema.safeParse(body)
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message)

    const { plannedQty, plannedUnitPrice, actualUnitPrice } = parsed.data
    const { actualTotal, variance } = computeVariance(plannedQty, plannedUnitPrice, actualUnitPrice)

    const item = await prisma.budgetItem.create({
      data: {
        gardenId: parsed.data.gardenId,
        name: parsed.data.name,
        categoryId: parsed.data.categoryId || null,
        plannedQty,
        unit: parsed.data.unit || null,
        plannedUnitPrice,
        plannedTotal: Math.round(plannedQty * plannedUnitPrice),
        actualUnitPrice: actualUnitPrice ?? null,
        actualTotal,
        variance,
        paymentStatus: parsed.data.paymentStatus,
        notes: parsed.data.notes || null,
      },
      include: { garden: true, category: true },
    })

    logAudit(user!.id, 'CREATE', 'BudgetItem', item.id)
    return jsonResponse(item, 201)
  } catch (err) {
    console.error('Create budget item error:', err)
    return errorResponse('Gagal membuat pos anggaran')
  }
}
