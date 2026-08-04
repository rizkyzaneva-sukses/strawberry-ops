import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, parseSearchParams, jsonResponse, errorResponse } from '@/lib/api-utils'
import { expenseGardenWhere, parseGardenParam } from '@/lib/garden'
import { logAudit } from '@/lib/audit'
import { createExpenseSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { page, limit, search, sortBy, sortOrder, startDate, endDate } = parseSearchParams(request.url)
  const params = new URL(request.url).searchParams
  const categoryId = params.get('categoryId') || ''
  const vendorId = params.get('vendorId') || ''
  const paymentStatus = params.get('paymentStatus') || ''
  const flaggedOnly = params.get('flagged') === '1'
  const gardenId = parseGardenParam(request.url)

  const where: any = { deletedAt: null, ...expenseGardenWhere(request.url) }
  if (search) {
    where.OR = [
      { description: { contains: search } },
      { recipientAccount: { contains: search } },
      { category: { name: { contains: search } } },
      { vendor: { name: { contains: search } } },
    ]
  }
  if (categoryId) where.categoryId = parseInt(categoryId)
  if (vendorId) where.vendorId = parseInt(vendorId)
  if (paymentStatus) where.paymentStatus = paymentStatus
  if (flaggedOnly) where.isFlagged = true
  if (startDate) where.transactionDate = { ...where.transactionDate, gte: new Date(startDate) }
  if (endDate) where.transactionDate = { ...where.transactionDate, lte: new Date(endDate) }

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        category: true,
        garden: true,
        vendor: true,
        sourceAccount: true,
        allocations: { include: { garden: true } },
        items: true,
        user: { select: { id: true, fullName: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ])

  // Untuk satu kebun yang dihitung adalah porsinya, bukan nominal transaksi.
  const allocationTotal = await prisma.expenseAllocation.aggregate({
    where: { expense: where, ...(gardenId ? { gardenId } : {}) },
    _sum: { amount: true },
  })

  return jsonResponse({
    items: items.map((item) => ({
      ...item,
      gardenAmount: gardenId
        ? item.allocations.find((allocation) => allocation.gardenId === gardenId)?.amount ?? 0
        : item.amount,
    })),
    total,
    page,
    limit,
    totals: { totalAmount: allocationTotal._sum.amount || 0 },
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
      transactionDate, gardenId, categoryId, vendorId, description, amount,
      quantity, unit, unitPrice, paymentStatus, installmentLabel, budgetItemId,
      isShared, allocations, sourceAccountId, recipientAccount, isFlagged, flagNote, notes,
    } = parsed.data

    const { transferProofPath, receiptProofPath } = body

    const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } })
    if (!category) return errorResponse('Kategori tidak ditemukan')

    // Biaya bersama wajib punya rincian porsi yang jumlahnya pas.
    let split: Array<{ gardenId: number; amount: number }>
    if (isShared) {
      if (!allocations?.length) {
        return errorResponse('Biaya bersama harus punya porsi tiap kebun')
      }
      const sum = allocations.reduce((total, item) => total + item.amount, 0)
      if (sum !== amount) {
        return errorResponse(
          `Jumlah porsi (${sum}) harus sama dengan nominal transaksi (${amount})`
        )
      }
      split = allocations
    } else {
      if (!gardenId) return errorResponse('Kebun wajib dipilih')
      split = [{ gardenId, amount }]
    }

    const gardenCount = await prisma.garden.count({
      where: { id: { in: split.map((item) => item.gardenId) } },
    })
    if (gardenCount !== new Set(split.map((item) => item.gardenId)).size) {
      return errorResponse('Ada kebun yang tidak ditemukan')
    }

    const expense = await prisma.expense.create({
      data: {
        transactionDate: new Date(transactionDate),
        gardenId: isShared ? null : gardenId!,
        categoryId,
        vendorId: vendorId || null,
        description: description || null,
        amount,
        quantity: quantity ?? null,
        unit: unit || null,
        unitPrice: unitPrice ?? null,
        paymentStatus,
        installmentLabel: installmentLabel || null,
        budgetItemId: budgetItemId || null,
        isShared: Boolean(isShared),
        sourceAccountId: sourceAccountId || null,
        recipientAccount: recipientAccount || null,
        transferProofPath: transferProofPath || null,
        receiptProofPath: receiptProofPath || null,
        isFlagged: Boolean(isFlagged),
        flagNote: flagNote || null,
        notes: notes || null,
        inputBy: user!.id,
        allocations: { create: split },
      },
      include: {
        category: true,
        garden: true,
        vendor: true,
        sourceAccount: true,
        allocations: { include: { garden: true } },
      },
    })

    logAudit(user!.id, 'CREATE', 'Expense', expense.id)
    return jsonResponse(expense, 201)
  } catch (err) {
    console.error('Create expense error:', err)
    return errorResponse('Gagal membuat pengeluaran')
  }
}
