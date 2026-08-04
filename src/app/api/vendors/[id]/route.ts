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
    const existing = await prisma.vendor.findUnique({ where: { id: parseInt(id) } })
    if (!existing) return errorResponse('Penerima tidak ditemukan', 404)

    const vendor = await prisma.vendor.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.bankName !== undefined && { bankName: body.bankName || null }),
        ...(body.accountNumber !== undefined && { accountNumber: body.accountNumber || null }),
        ...(body.accountHolder !== undefined && { accountHolder: body.accountHolder || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.isFlagged !== undefined && { isFlagged: Boolean(body.isFlagged) }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      },
    })

    logAudit(user!.id, 'UPDATE', 'Vendor', vendor.id)
    return jsonResponse(vendor)
  } catch (err) {
    console.error('Update vendor error:', err)
    return errorResponse('Gagal mengupdate data penerima')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const existing = await prisma.vendor.findUnique({ where: { id: parseInt(id) } })
  if (!existing) return errorResponse('Penerima tidak ditemukan', 404)

  // Riwayat transaksi tetap dipertahankan, jadi cukup dinonaktifkan.
  await prisma.vendor.update({ where: { id: parseInt(id) }, data: { isActive: false } })
  logAudit(user!.id, 'DELETE', 'Vendor', parseInt(id), 'Dinonaktifkan')
  return jsonResponse({ message: 'Penerima dinonaktifkan' })
}
