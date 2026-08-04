import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { gardenWhere } from '@/lib/garden'
import { logAudit } from '@/lib/audit'
import { createBlockSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const items = await prisma.block.findMany({
    where: { isActive: true, ...gardenWhere(request.url) },
    include: { garden: true },
    orderBy: [{ gardenId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  })

  return jsonResponse({ items, total: items.length })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createBlockSchema.safeParse(body)
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message)

    const garden = await prisma.garden.findFirst({ where: { id: parsed.data.gardenId } })
    if (!garden) return errorResponse('Kebun tidak ditemukan')

    const duplicate = await prisma.block.findFirst({
      where: { gardenId: parsed.data.gardenId, name: parsed.data.name },
    })
    if (duplicate) return errorResponse('Nama blok sudah ada di kebun ini')

    const block = await prisma.block.create({
      data: {
        gardenId: parsed.data.gardenId,
        name: parsed.data.name,
        notes: parsed.data.notes || null,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
      include: { garden: true },
    })

    logAudit(user!.id, 'CREATE', 'Block', block.id)
    return jsonResponse(block, 201)
  } catch (err) {
    console.error('Create block error:', err)
    return errorResponse('Gagal membuat blok')
  }
}
