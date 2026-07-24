import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  try {
    const body = await request.json()
    const { title, description, images, priority, status } = body

    const existing = await prisma.revision.findUnique({ where: { id: parseInt(id) } })
    if (!existing) {
      return errorResponse('Revisi tidak ditemukan', 404)
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (images !== undefined) updateData.images = images
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) updateData.status = status

    const updated = await prisma.revision.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { user: { select: { id: true, fullName: true, username: true } } },
    })

    return jsonResponse(updated)
  } catch (err) {
    console.error('Update revision error:', err)
    return errorResponse('Gagal mengupdate revisi')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  try {
    await prisma.revision.delete({ where: { id: parseInt(id) } })
    return jsonResponse({ success: true })
  } catch (err) {
    console.error('Delete revision error:', err)
    return errorResponse('Gagal menghapus revisi')
  }
}
