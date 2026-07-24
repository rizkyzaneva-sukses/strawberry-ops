import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  const showAll = request.nextUrl.searchParams.get('all') === 'true'
  const accounts = await prisma.bankAccount.findMany({
    where: showAll ? {} : { isActive: true },
    orderBy: { accountName: 'asc' },
  })

  return jsonResponse(accounts)
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const { accountName, bankName, accountNumber } = body

    if (!accountName || !bankName || !accountNumber) {
      return errorResponse('Nama akun, nama bank, dan nomor rekening wajib diisi')
    }

    const account = await prisma.bankAccount.create({
      data: { accountName, bankName, accountNumber },
    })

    logAudit(user!.id, 'CREATE', 'BankAccount', account.id)
    return jsonResponse(account, 201)
  } catch (err) {
    console.error('Create bank account error:', err)
    return errorResponse('Gagal membuat rekening bank')
  }
}
