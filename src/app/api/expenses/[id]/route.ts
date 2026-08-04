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
  const expense = await prisma.expense.findFirst({
    where: { id: parseInt(id), deletedAt: null },
    include: {
      category: true,
      garden: true,
      vendor: true,
      sourceAccount: true,
      allocations: { include: { garden: true } },
      items: true,
      user: { select: { id: true, fullName: true } },
    },
  })

  if (!expense) {
    return errorResponse('Pengeluaran tidak ditemukan', 404)
  }

  return jsonResponse(expense)
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
      transactionDate, gardenId, categoryId, vendorId, description, amount,
      quantity, unit, unitPrice, paymentStatus, installmentLabel,
      isShared, allocations, sourceAccountId, recipientAccount,
      transferProofPath, receiptProofPath, isFlagged, flagNote, notes,
    } = body

    const existing = await prisma.expense.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })
    if (!existing) {
      return errorResponse('Pengeluaran tidak ditemukan', 404)
    }

    const nextAmount = amount !== undefined ? parseInt(amount) : existing.amount
    const nextShared = isShared !== undefined ? Boolean(isShared) : existing.isShared
    const nextGardenId =
      gardenId !== undefined ? (gardenId ? parseInt(gardenId) : null) : existing.gardenId

    // Porsi kebun ditulis ulang setiap kali nominal atau pembagiannya berubah.
    let split: Array<{ gardenId: number; amount: number }> | null = null
    if (allocations !== undefined || amount !== undefined || isShared !== undefined || gardenId !== undefined) {
      if (nextShared) {
        if (!allocations?.length) {
          return errorResponse('Biaya bersama harus punya porsi tiap kebun')
        }
        const sum = allocations.reduce(
          (total: number, item: { amount: number }) => total + item.amount,
          0
        )
        if (sum !== nextAmount) {
          return errorResponse(
            `Jumlah porsi (${sum}) harus sama dengan nominal transaksi (${nextAmount})`
          )
        }
        split = allocations
      } else {
        if (!nextGardenId) return errorResponse('Kebun wajib dipilih')
        split = [{ gardenId: nextGardenId, amount: nextAmount }]
      }
    }

    const expense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        ...(transactionDate !== undefined && { transactionDate: new Date(transactionDate) }),
        ...(gardenId !== undefined && { gardenId: nextShared ? null : nextGardenId }),
        ...(categoryId !== undefined && { categoryId: parseInt(categoryId) }),
        ...(vendorId !== undefined && { vendorId: vendorId ? parseInt(vendorId) : null }),
        ...(description !== undefined && { description: description || null }),
        ...(amount !== undefined && { amount: nextAmount }),
        ...(quantity !== undefined && { quantity: quantity ? parseFloat(quantity) : null }),
        ...(unit !== undefined && { unit: unit || null }),
        ...(unitPrice !== undefined && { unitPrice: unitPrice ? parseInt(unitPrice) : null }),
        ...(paymentStatus !== undefined && { paymentStatus }),
        ...(installmentLabel !== undefined && { installmentLabel: installmentLabel || null }),
        ...(isShared !== undefined && { isShared: nextShared }),
        ...(sourceAccountId !== undefined && { sourceAccountId: sourceAccountId ? parseInt(sourceAccountId) : null }),
        ...(recipientAccount !== undefined && { recipientAccount: recipientAccount || null }),
        ...(transferProofPath !== undefined && { transferProofPath: transferProofPath || null }),
        ...(receiptProofPath !== undefined && { receiptProofPath: receiptProofPath || null }),
        ...(isFlagged !== undefined && { isFlagged: Boolean(isFlagged) }),
        ...(flagNote !== undefined && { flagNote: flagNote || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(split && {
          allocations: { deleteMany: {}, create: split },
        }),
      },
      include: {
        category: true,
        garden: true,
        vendor: true,
        sourceAccount: true,
        allocations: { include: { garden: true } },
      },
    })

    const changes: string[] = []
    if (amount !== undefined && parseInt(amount) !== existing.amount) changes.push(`amount: ${existing.amount} -> ${amount}`)
    if (categoryId !== undefined && parseInt(categoryId) !== existing.categoryId) changes.push(`categoryId: ${existing.categoryId} -> ${categoryId}`)
    if (description !== undefined && description !== existing.description) changes.push(`description updated`)
    logAudit(user!.id, 'UPDATE', 'Expense', expense.id, changes.length > 0 ? JSON.stringify(changes) : undefined)

    return jsonResponse(expense)
  } catch (err) {
    console.error('Update expense error:', err)
    return errorResponse('Gagal mengupdate pengeluaran')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const existing = await prisma.expense.findFirst({
    where: { id: parseInt(id), deletedAt: null },
  })
  if (!existing) {
    return errorResponse('Pengeluaran tidak ditemukan', 404)
  }

  await prisma.expense.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() },
  })

  logAudit(user!.id, 'DELETE', 'Expense', parseInt(id), 'Soft deleted')
  return jsonResponse({ message: 'Pengeluaran berhasil dihapus' })
}
