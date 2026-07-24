import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const revisions = await prisma.revision.findMany({
    include: { user: { select: { id: true, fullName: true, username: true } } },
    orderBy: [
      { status: 'asc' },
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  return jsonResponse(revisions)
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const { title, description, images, priority } = await request.json()

    if (!title || !title.trim()) {
      return errorResponse('Judul wajib diisi')
    }

    const revision = await prisma.revision.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        images: images || '[]',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        createdBy: user!.id,
      },
      include: { user: { select: { id: true, fullName: true, username: true } } },
    })

    return jsonResponse(revision, 201)
  } catch (err) {
    console.error('Create revision error:', err)
    return errorResponse('Gagal membuat revisi')
  }
}
