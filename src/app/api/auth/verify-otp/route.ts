import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const { username, code, newPassword } = await request.json()

    if (!username || !code || !newPassword) {
      return errorResponse('Username, kode OTP, dan password baru wajib diisi')
    }

    if (newPassword.length < 6) {
      return errorResponse('Password minimal 6 karakter')
    }

    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user || !user.isActive) {
      return errorResponse('Kode OTP tidak valid atau sudah kedaluwarsa')
    }

    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!resetRecord) {
      return errorResponse('Kode OTP tidak valid atau sudah kedaluwarsa')
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
    ])

    return jsonResponse({ message: 'Password berhasil diubah. Silakan login dengan password baru.' })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return errorResponse('Terjadi kesalahan server', 500)
  }
}
