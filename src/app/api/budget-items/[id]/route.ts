import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  try {
    const body = await request.json()
    const existing = await prisma.budgetItem.findUnique({ where: { id: parseInt(id) } })
    if (!existing) return errorResponse('Pos anggaran tidak ditemukan', 404)

    const plannedQty =
      body.plannedQty !== undefined ? parseFloat(body.plannedQty) : existing.plannedQty
    const plannedUnitPrice =
      body.plannedUnitPrice !== undefined
        ? parseInt(body.plannedUnitPrice)
        : existing.plannedUnitPrice
    const actualUnitPrice =
      body.actualUnitPrice !== undefined
        ? body.actualUnitPrice === null || body.actualUnitPrice === ''
          ? null
          : parseInt(body.actualUnitPrice)
        : existing.actualUnitPrice

    const item = await prisma.budgetItem.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.categoryId !== undefined && {
          categoryId: body.categoryId ? parseInt(body.categoryId) : null,
        }),
        plannedQty,
        ...(body.unit !== undefined && { unit: body.unit || null }),
        plannedUnitPrice,
        plannedTotal: Math.round(plannedQty * plannedUnitPrice),
        actualUnitPrice,
        actualTotal: actualUnitPrice === null ? null : Math.round(plannedQty * actualUnitPrice),
        variance:
          actualUnitPrice === null
            ? null
            : Math.round(plannedQty * (plannedUnitPrice - actualUnitPrice)),
        ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
      include: { garden: true, category: true },
    })

    logAudit(user!.id, 'UPDATE', 'BudgetItem', item.id)
    return jsonResponse(item)
  } catch (err) {
    console.error('Update budget item error:', err)
    return errorResponse('Gagal mengupdate pos anggaran')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const existing = await prisma.budgetItem.findUnique({ where: { id: parseInt(id) } })
  if (!existing) return errorResponse('Pos anggaran tidak ditemukan', 404)

  await prisma.expense.updateMany({
    where: { budgetItemId: parseInt(id) },
    data: { budgetItemId: null },
  })
  await prisma.budgetItem.delete({ where: { id: parseInt(id) } })

  logAudit(user!.id, 'DELETE', 'BudgetItem', parseInt(id))
  return jsonResponse({ message: 'Pos anggaran berhasil dihapus' })
}
