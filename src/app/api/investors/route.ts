import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const items = await prisma.investor.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  return jsonResponse({ items, total: items.length })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    if (!name) return errorResponse('Nama investor wajib diisi')

    const duplicate = await prisma.investor.findFirst({ where: { name } })
    if (duplicate) return errorResponse('Investor sudah terdaftar')

    const investor = await prisma.investor.create({
      data: {
        name,
        phone: body.phone || null,
        bankName: body.bankName || null,
        accountNumber: body.accountNumber || null,
        notes: body.notes || null,
      },
    })

    logAudit(user!.id, 'CREATE', 'Investor', investor.id)
    return jsonResponse(investor, 201)
  } catch (err) {
    console.error('Create investor error:', err)
    return errorResponse('Gagal membuat data investor')
  }
}
