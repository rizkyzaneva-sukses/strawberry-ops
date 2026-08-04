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
    const existing = await prisma.capitalInjection.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })
    if (!existing) return errorResponse('Catatan dana masuk tidak ditemukan', 404)

    const nextAmount = body.amount !== undefined ? parseInt(body.amount) : existing.amount
    const nextRepaid =
      body.repaidAmount !== undefined ? parseInt(body.repaidAmount) : existing.repaidAmount
    const nextType = body.fundingType ?? existing.fundingType

    if (nextType === 'LOAN' && nextRepaid > nextAmount) {
      return errorResponse('Pengembalian tidak boleh melebihi nominal utang')
    }
    if (nextType === 'EQUITY' && nextRepaid) {
      return errorResponse('Modal penyertaan tidak punya pengembalian')
    }

    const record = await prisma.capitalInjection.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.entryDate !== undefined && { entryDate: new Date(body.entryDate) }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.investorId !== undefined && {
          investorId: body.investorId ? parseInt(body.investorId) : null,
        }),
        ...(body.fundingType !== undefined && { fundingType: nextType }),
        ...(body.amount !== undefined && { amount: nextAmount }),
        ...(body.repaidAmount !== undefined && { repaidAmount: nextRepaid }),
        ...(body.sourceAccount !== undefined && { sourceAccount: body.sourceAccount || null }),
        ...(body.destinationAccountId !== undefined && {
          destinationAccountId: body.destinationAccountId ? parseInt(body.destinationAccountId) : null,
        }),
        ...(body.proofPath !== undefined && { proofPath: body.proofPath || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
      include: { garden: true, investor: true, destinationAccount: true },
    })

    logAudit(user!.id, 'UPDATE', 'CapitalInjection', record.id)
    return jsonResponse(record)
  } catch (err) {
    console.error('Update capital injection error:', err)
    return errorResponse('Gagal mengupdate catatan dana masuk')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const existing = await prisma.capitalInjection.findFirst({
    where: { id: parseInt(id), deletedAt: null },
  })
  if (!existing) return errorResponse('Catatan dana masuk tidak ditemukan', 404)

  await prisma.capitalInjection.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() },
  })

  logAudit(user!.id, 'DELETE', 'CapitalInjection', parseInt(id), 'Soft deleted')
  return jsonResponse({ message: 'Catatan dana masuk berhasil dihapus' })
}
