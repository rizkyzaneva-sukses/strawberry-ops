import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, parseSearchParams, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'
import { createVendorSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { page, limit, search } = parseSearchParams(request.url)
  const flaggedOnly = new URL(request.url).searchParams.get('flagged') === '1'

  const where: any = { isActive: true }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { accountNumber: { contains: search } },
      { accountHolder: { contains: search } },
    ]
  }
  if (flaggedOnly) where.isFlagged = true

  const [items, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { expenses: true } } },
    }),
    prisma.vendor.count({ where }),
  ])

  return jsonResponse({ items, total, page, limit })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createVendorSchema.safeParse(body)
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message)

    const duplicate = await prisma.vendor.findFirst({ where: { name: parsed.data.name } })
    if (duplicate) return errorResponse('Nama penerima sudah terdaftar')

    const vendor = await prisma.vendor.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        bankName: parsed.data.bankName || null,
        accountNumber: parsed.data.accountNumber || null,
        accountHolder: parsed.data.accountHolder || parsed.data.name,
        phone: parsed.data.phone || null,
        isFlagged: Boolean(parsed.data.isFlagged),
        notes: parsed.data.notes || null,
      },
    })

    logAudit(user!.id, 'CREATE', 'Vendor', vendor.id)
    return jsonResponse(vendor, 201)
  } catch (err) {
    console.error('Create vendor error:', err)
    return errorResponse('Gagal membuat data penerima')
  }
}
