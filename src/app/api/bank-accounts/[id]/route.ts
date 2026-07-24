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
    const { accountName, bankName, accountNumber, isActive } = body

    const account = await prisma.bankAccount.update({
      where: { id: parseInt(id) },
      data: {
        ...(accountName !== undefined && { accountName }),
        ...(bankName !== undefined && { bankName }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    const changes: string[] = []
    if (accountName !== undefined) changes.push(`accountName: ${accountName}`)
    if (bankName !== undefined) changes.push(`bankName: ${bankName}`)
    if (isActive !== undefined) changes.push(`isActive: ${isActive}`)
    logAudit(user!.id, 'UPDATE', 'BankAccount', account.id, changes.length > 0 ? JSON.stringify(changes) : undefined)

    return jsonResponse(account)
  } catch (err) {
    console.error('Update bank account error:', err)
    return errorResponse('Gagal mengupdate rekening bank')
  }
}
