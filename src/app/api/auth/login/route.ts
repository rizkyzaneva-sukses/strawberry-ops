import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { jsonResponse, errorResponse } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return errorResponse('Username dan password wajib diisi')
    }

    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user || !user.isActive) {
      return errorResponse('Username atau password salah', 401)
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return errorResponse('Username atau password salah', 401)
    }

    const session = await getSession()
    session.userId = user.id
    session.username = user.username
    session.role = user.role
    session.fullName = user.fullName
    await session.save()

    return jsonResponse({
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    })
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('Terjadi kesalahan server', 500)
  }
}
