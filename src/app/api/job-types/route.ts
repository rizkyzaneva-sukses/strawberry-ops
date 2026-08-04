import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'
import { createJobTypeSchema } from '@/lib/validations'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const items = await prisma.jobType.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  return jsonResponse({ items, total: items.length })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createJobTypeSchema.safeParse(body)
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message)

    const code = parsed.data.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')
    const duplicate = await prisma.jobType.findFirst({
      where: { OR: [{ code }, { name: parsed.data.name }] },
    })
    if (duplicate) return errorResponse('Jenis pekerjaan sudah ada')

    const jobType = await prisma.jobType.create({
      data: { name: parsed.data.name, code, sortOrder: parsed.data.sortOrder ?? 99 },
    })

    logAudit(user!.id, 'CREATE', 'JobType', jobType.id)
    return jsonResponse(jobType, 201)
  } catch (err) {
    console.error('Create job type error:', err)
    return errorResponse('Gagal membuat jenis pekerjaan')
  }
}
