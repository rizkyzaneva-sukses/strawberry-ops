import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireRole, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'
import { createUserSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { user, error } = await requireRole('OWNER', 'MANAGER')
  if (error) return error

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { fullName: 'asc' },
  })

  return jsonResponse(users)
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireRole('OWNER')
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }
    const { username, password, fullName, role } = parsed.data

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return errorResponse('Username sudah digunakan')
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: { username, passwordHash, fullName, role, isActive: true },
      select: { id: true, username: true, fullName: true, role: true, isActive: true },
    })

    logAudit(user!.id, 'CREATE', 'User', newUser.id)
    return jsonResponse(newUser, 201)
  } catch (err) {
    console.error('Create user error:', err)
    return errorResponse('Gagal membuat user')
  }
}
