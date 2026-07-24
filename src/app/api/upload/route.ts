import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return errorResponse('File tidak ditemukan')
    }

    if (file.size > MAX_SIZE) {
      return errorResponse('Ukuran file maksimal 5MB')
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse('Tipe file harus JPG, PNG, atau PDF')
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split('.').pop()
    const timestamp = Date.now()
    const filename = `${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)

    return jsonResponse({ path: `/uploads/${filename}`, filename })
  } catch (err) {
    console.error('Upload error:', err)
    return errorResponse('Gagal mengupload file')
  }
}
