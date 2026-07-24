import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireRole, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireRole('OWNER')
  if (error) return error

  const { id } = await params
  try {
    const body = await request.json()
    const { username, password, fullName, role, isActive } = body

    const existing = await prisma.user.findUnique({ where: { id: parseInt(id) } })
    if (!existing) {
      return errorResponse('User tidak ditemukan', 404)
    }

    const updateData: any = {}
    if (username !== undefined) {
      const dup = await prisma.user.findFirst({ where: { username, id: { not: parseInt(id) } } })
      if (dup) return errorResponse('Username sudah digunakan')
      updateData.username = username
    }
    if (password) updateData.passwordHash = await bcrypt.hash(password, 10)
    if (fullName !== undefined) updateData.fullName = fullName
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: { id: true, username: true, fullName: true, role: true, isActive: true },
    })

    const changes: string[] = []
    if (username !== undefined && username !== existing.username) changes.push(`username: ${existing.username} -> ${username}`)
    if (fullName !== undefined && fullName !== existing.fullName) changes.push(`fullName updated`)
    if (role !== undefined && role !== existing.role) changes.push(`role: ${existing.role} -> ${role}`)
    if (isActive !== undefined && isActive !== existing.isActive) changes.push(`isActive: ${existing.isActive} -> ${isActive}`)
    if (password) changes.push('password changed')
    logAudit(user!.id, 'UPDATE', 'User', updated.id, changes.length > 0 ? JSON.stringify(changes) : undefined)

    return jsonResponse(updated)
  } catch (err) {
    console.error('Update user error:', err)
    return errorResponse('Gagal mengupdate user')
  }
}
