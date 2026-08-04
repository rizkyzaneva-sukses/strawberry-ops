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
    const existing = await prisma.asset.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })
    if (!existing) return errorResponse('Aset tidak ditemukan', 404)

    const quantity = body.quantity !== undefined ? parseFloat(body.quantity) : existing.quantity
    const unitPrice = body.unitPrice !== undefined ? parseInt(body.unitPrice) : existing.unitPrice
    const ownershipShare =
      body.ownershipShare !== undefined ? parseFloat(body.ownershipShare) : existing.ownershipShare

    if (ownershipShare <= 0 || ownershipShare > 1) {
      return errorResponse('Porsi kepemilikan harus antara 0 dan 1')
    }

    const asset = await prisma.asset.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.gardenId !== undefined && {
          gardenId: body.gardenId ? parseInt(body.gardenId) : null,
        }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.category !== undefined && { category: body.category || null }),
        ...(body.acquiredDate !== undefined && {
          acquiredDate: body.acquiredDate ? new Date(body.acquiredDate) : null,
        }),
        quantity,
        unitPrice,
        ownershipShare,
        totalCost: Math.round(quantity * unitPrice * ownershipShare),
        ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
        ...(body.vendorId !== undefined && {
          vendorId: body.vendorId ? parseInt(body.vendorId) : null,
        }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
      include: { garden: true, vendor: true },
    })

    logAudit(user!.id, 'UPDATE', 'Asset', asset.id)
    return jsonResponse(asset)
  } catch (err) {
    console.error('Update asset error:', err)
    return errorResponse('Gagal mengupdate data aset')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const existing = await prisma.asset.findFirst({
    where: { id: parseInt(id), deletedAt: null },
  })
  if (!existing) return errorResponse('Aset tidak ditemukan', 404)

  await prisma.asset.update({ where: { id: parseInt(id) }, data: { deletedAt: new Date() } })
  logAudit(user!.id, 'DELETE', 'Asset', parseInt(id), 'Soft deleted')
  return jsonResponse({ message: 'Aset berhasil dihapus' })
}
