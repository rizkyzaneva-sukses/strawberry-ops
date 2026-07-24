import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { changePasswordSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }

    const { currentPassword, newPassword } = parsed.data

    const dbUser = await prisma.user.findUnique({ where: { id: user!.id } })
    if (!dbUser) {
      return errorResponse('User tidak ditemukan', 404)
    }

    const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash)
    if (!valid) {
      return errorResponse('Password saat ini salah')
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: user!.id },
      data: { passwordHash },
    })

    return jsonResponse({ message: 'Password berhasil diubah' })
  } catch (err) {
    console.error('Change password error:', err)
    return errorResponse('Gagal mengubah password')
  }
}
