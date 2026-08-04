import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const record = await prisma.harvestRevenue.findFirst({
    where: { id: parseInt(id), deletedAt: null },
    include: { user: { select: { id: true, fullName: true } } },
  })

  if (!record) {
    return errorResponse('Data pendapatan panen tidak ditemukan', 404)
  }

  return jsonResponse(record)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  try {
    const body = await request.json()
    const {
      harvestDate, gardenId, blockId,
      normalPricePerKg, bsPricePerKg,
      totalHarvestKg, bsKg,
      notes,
    } = body

    const existing = await prisma.harvestRevenue.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })
    if (!existing) {
      return errorResponse('Data pendapatan panen tidak ditemukan', 404)
    }

    const nhk = totalHarvestKg !== undefined ? parseFloat(totalHarvestKg) : existing.totalHarvestKg
    const bk = bsKg !== undefined ? parseFloat(bsKg) : existing.bsKg
    const npk = normalPricePerKg !== undefined ? parseInt(normalPricePerKg) : existing.normalPricePerKg
    const bpk = bsPricePerKg !== undefined ? parseInt(bsPricePerKg) : existing.bsPricePerKg

    if (bk > nhk) return errorResponse('Berat BS tidak boleh melebihi total panen')

    const nextGardenId = gardenId !== undefined ? parseInt(gardenId) : existing.gardenId
    if (blockId) {
      const block = await prisma.block.findFirst({
        where: { id: parseInt(blockId), gardenId: nextGardenId },
      })
      if (!block) return errorResponse('Blok tidak ada di kebun yang dipilih')
    }

    const normalKg = nhk - bk
    const normalRevenue = Math.round(normalKg * npk)
    const bsRevenue = Math.round(bk * bpk)
    const totalRevenue = normalRevenue + bsRevenue
    const bsPercentage = nhk > 0 ? (bk / nhk) * 100 : 0

    const record = await prisma.harvestRevenue.update({
      where: { id: parseInt(id) },
      data: {
        ...(harvestDate !== undefined && { harvestDate: new Date(harvestDate) }),
        ...(gardenId !== undefined && { gardenId: nextGardenId }),
        ...(blockId !== undefined && { blockId: blockId ? parseInt(blockId) : null }),
        normalPricePerKg: npk,
        bsPricePerKg: bpk,
        totalHarvestKg: nhk,
        bsKg: bk,
        normalKg,
        normalRevenue,
        bsRevenue,
        totalRevenue,
        bsPercentage: Math.round(bsPercentage * 100) / 100,
        ...(notes !== undefined && { notes: notes || null }),
      },
    })

    logAudit(user!.id, 'UPDATE', 'HarvestRevenue', record.id, `totalRevenue: ${existing.totalRevenue} -> ${totalRevenue}`)
    return jsonResponse(record)
  } catch (err) {
    console.error('Update harvest revenue error:', err)
    return errorResponse('Gagal mengupdate data pendapatan panen')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const existing = await prisma.harvestRevenue.findFirst({
    where: { id: parseInt(id), deletedAt: null },
  })
  if (!existing) {
    return errorResponse('Data pendapatan panen tidak ditemukan', 404)
  }

  await prisma.harvestRevenue.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() },
  })

  logAudit(user!.id, 'DELETE', 'HarvestRevenue', parseInt(id), 'Soft deleted')
  return jsonResponse({ message: 'Data pendapatan panen berhasil dihapus' })
}
