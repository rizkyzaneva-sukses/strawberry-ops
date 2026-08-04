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
    const { name, notes, sortOrder, isActive } = await request.json()
    const existing = await prisma.block.findUnique({ where: { id: parseInt(id) } })
    if (!existing) return errorResponse('Blok tidak ditemukan', 404)

    if (name && name !== existing.name) {
      const duplicate = await prisma.block.findFirst({
        where: { gardenId: existing.gardenId, name },
      })
      if (duplicate) return errorResponse('Nama blok sudah ada di kebun ini')
    }

    const block = await prisma.block.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      include: { garden: true },
    })

    logAudit(user!.id, 'UPDATE', 'Block', block.id)
    return jsonResponse(block)
  } catch (err) {
    console.error('Update block error:', err)
    return errorResponse('Gagal mengupdate blok')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const blockId = parseInt(id)
  const existing = await prisma.block.findUnique({ where: { id: blockId } })
  if (!existing) return errorResponse('Blok tidak ditemukan', 404)

  // Blok yang sudah dipakai hanya dinonaktifkan supaya riwayatnya tetap utuh.
  const [payrollCount, harvestCount] = await Promise.all([
    prisma.payrollRecord.count({ where: { blockId } }),
    prisma.harvestRevenue.count({ where: { blockId } }),
  ])

  if (payrollCount + harvestCount > 0) {
    await prisma.block.update({ where: { id: blockId }, data: { isActive: false } })
    logAudit(user!.id, 'UPDATE', 'Block', blockId, 'Dinonaktifkan (masih terpakai)')
    return jsonResponse({
      message: `Blok dinonaktifkan karena masih dipakai ${payrollCount + harvestCount} catatan`,
    })
  }

  await prisma.block.delete({ where: { id: blockId } })
  logAudit(user!.id, 'DELETE', 'Block', blockId)
  return jsonResponse({ message: 'Blok berhasil dihapus' })
}
