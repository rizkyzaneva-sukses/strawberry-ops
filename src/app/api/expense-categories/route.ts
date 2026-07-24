import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const categories = await prisma.expenseCategory.findMany({
    orderBy: { name: 'asc' },
  })

  return jsonResponse(categories)
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { name, code } = await request.json()

    if (!name || !code) {
      return errorResponse('Nama dan kode kategori wajib diisi')
    }

    const existing = await prisma.expenseCategory.findFirst({
      where: { OR: [{ name }, { code }] },
    })
    if (existing) {
      return errorResponse('Kategori dengan nama atau kode tersebut sudah ada')
    }

    const category = await prisma.expenseCategory.create({
      data: { name, code: code.toUpperCase() },
    })

    return jsonResponse(category, 201)
  } catch (err) {
    console.error('Create expense category error:', err)
    return errorResponse('Gagal membuat kategori')
  }
}
