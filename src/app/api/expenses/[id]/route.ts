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
      sourceAccount: true,
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
      transactionDate, categoryId, description, amount,
      sourceAccountId, recipientAccount,
      transferProofPath, receiptProofPath,
    } = body

    const existing = await prisma.expense.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })
    if (!existing) {
      return errorResponse('Pengeluaran tidak ditemukan', 404)
    }

    const expense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        ...(transactionDate !== undefined && { transactionDate: new Date(transactionDate) }),
        ...(categoryId !== undefined && { categoryId: parseInt(categoryId) }),
        ...(description !== undefined && { description: description || null }),
        ...(amount !== undefined && { amount: parseInt(amount) }),
        ...(sourceAccountId !== undefined && { sourceAccountId: sourceAccountId ? parseInt(sourceAccountId) : null }),
        ...(recipientAccount !== undefined && { recipientAccount: recipientAccount || null }),
        ...(transferProofPath !== undefined && { transferProofPath: transferProofPath || null }),
        ...(receiptProofPath !== undefined && { receiptProofPath: receiptProofPath || null }),
      },
      include: { category: true, sourceAccount: true },
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
