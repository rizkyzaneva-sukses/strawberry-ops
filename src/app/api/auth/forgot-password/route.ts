import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse } from '@/lib/api-utils'
import { sendWhatsApp } from '@/lib/waha'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username) {
      return errorResponse('Username wajib diisi')
    }

    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user || !user.isActive || !user.phone) {
      return jsonResponse({
        message: 'Jika username terdaftar, kode OTP akan dikirim ke WhatsApp Anda.',
      })
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        code,
        phone: user.phone,
        expiresAt,
      },
    })

    const message = `Kode OTP reset password StrawberryOps Anda: ${code}\nBerlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun.`
    const result = await sendWhatsApp(user.phone, message)

    if (!result.success) {
      console.error('Failed to send OTP via WhatsApp:', result.error)
    }

    return jsonResponse({
      message: 'Jika username terdaftar, kode OTP akan dikirim ke WhatsApp Anda.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return errorResponse('Terjadi kesalahan server', 500)
  }
}
