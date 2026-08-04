import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'
import { createGardenSchema } from '@/lib/validations'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const items = await prisma.garden.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: {
      blocks: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
    },
  })

  return jsonResponse({ items, total: items.length })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireRole('OWNER')
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createGardenSchema.safeParse(body)
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message)

    const code = parsed.data.code.toUpperCase().replace(/[^A-Z0-9]+/g, '_')
    const duplicate = await prisma.garden.findFirst({
      where: { OR: [{ code }, { name: parsed.data.name }] },
    })
    if (duplicate) return errorResponse('Nama atau kode kebun sudah dipakai')

    const garden = await prisma.garden.create({
      data: {
        name: parsed.data.name,
        code,
        hasInvestor: Boolean(parsed.data.hasInvestor),
        notes: parsed.data.notes || null,
      },
    })

    logAudit(user!.id, 'CREATE', 'Garden', garden.id)
    return jsonResponse(garden, 201)
  } catch (err) {
    console.error('Create garden error:', err)
    return errorResponse('Gagal membuat kebun')
  }
}
