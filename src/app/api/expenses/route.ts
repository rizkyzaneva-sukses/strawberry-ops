import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, parseSearchParams, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'
import { createExpenseSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { page, limit, search, sortBy, sortOrder, startDate, endDate } = parseSearchParams(request.url)
  const categoryId = new URL(request.url).searchParams.get('categoryId') || ''

  const where: any = { deletedAt: null }
  if (search) {
    where.OR = [
      { description: { contains: search } },
      { recipientAccount: { contains: search } },
      { category: { name: { contains: search } } },
    ]
  }
  if (categoryId) where.categoryId = parseInt(categoryId)
  if (startDate) where.transactionDate = { ...where.transactionDate, gte: new Date(startDate) }
  if (endDate) where.transactionDate = { ...where.transactionDate, lte: new Date(endDate) }

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        category: true,
        sourceAccount: true,
        user: { select: { id: true, fullName: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ])

  const totals = await prisma.expense.aggregate({
    where,
    _sum: { amount: true },
  })

  return jsonResponse({
    items,
    total,
    page,
    limit,
    totals: { totalAmount: totals._sum.amount || 0 },
  })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createExpenseSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }
    const {
      transactionDate, categoryId, description, amount,
      sourceAccountId, recipientAccount,
    } = parsed.data

    const { transferProofPath, receiptProofPath } = body

    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryId },
    })
    if (!category) {
      return errorResponse('Kategori tidak ditemukan')
    }

    const expense = await prisma.expense.create({
      data: {
        transactionDate: new Date(transactionDate),
        categoryId,
        description: description || null,
        amount,
        sourceAccountId: sourceAccountId || null,
        recipientAccount: recipientAccount || null,
        transferProofPath: transferProofPath || null,
        receiptProofPath: receiptProofPath || null,
        inputBy: user!.id,
      },
      include: { category: true, sourceAccount: true },
    })

    logAudit(user!.id, 'CREATE', 'Expense', expense.id)
    return jsonResponse(expense, 201)
  } catch (err) {
    console.error('Create expense error:', err)
    return errorResponse('Gagal membuat pengeluaran')
  }
}
