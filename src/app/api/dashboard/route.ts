import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'month' // week, month, year
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  const now = new Date()
  let dateFilter: any = {}

  if (startDate && endDate) {
    dateFilter = { gte: new Date(startDate), lte: new Date(endDate) }
  } else {
    switch (period) {
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter = { gte: weekAgo }
        break
      case 'year':
        dateFilter = { gte: new Date(now.getFullYear(), 0, 1) }
        break
      case 'month':
      default:
        const monthAgo = new Date(now)
        monthAgo.setDate(monthAgo.getDate() - 30)
        dateFilter = { gte: monthAgo }
        break
    }
  }

  const [payrollTotal, expenseTotal, harvestTotal, employeeCount, recentHarvests, recentExpenses] = await Promise.all([
    prisma.payrollRecord.aggregate({
      where: { deletedAt: null, workDate: dateFilter },
      _sum: { wageAmount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { deletedAt: null, transactionDate: dateFilter },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.harvestRevenue.aggregate({
      where: { deletedAt: null, harvestDate: dateFilter },
      _sum: { totalRevenue: true, totalHarvestKg: true },
      _count: true,
    }),
    prisma.employee.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
    prisma.harvestRevenue.findMany({
      where: { deletedAt: null },
      orderBy: { harvestDate: 'desc' },
      take: 5,
    }),
    prisma.expense.findMany({
      where: { deletedAt: null },
      include: { category: true },
      orderBy: { transactionDate: 'desc' },
      take: 5,
    }),
  ])

  // Monthly trend data (last 6 months)
  const monthlyTrend = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

    const [payroll, expense, harvest] = await Promise.all([
      prisma.payrollRecord.aggregate({
        where: { deletedAt: null, workDate: { gte: monthStart, lte: monthEnd } },
        _sum: { wageAmount: true },
      }),
      prisma.expense.aggregate({
        where: { deletedAt: null, transactionDate: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.harvestRevenue.aggregate({
        where: { deletedAt: null, harvestDate: { gte: monthStart, lte: monthEnd } },
        _sum: { totalRevenue: true },
      }),
    ])

    monthlyTrend.push({
      month: monthStart.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      income: harvest._sum.totalRevenue || 0,
      expenses: (payroll._sum.wageAmount || 0) + (expense._sum.amount || 0),
    })
  }

  const totalIncome = harvestTotal._sum.totalRevenue || 0
  const totalExpenses = (payrollTotal._sum.wageAmount || 0) + (expenseTotal._sum.amount || 0)

  return jsonResponse({
    summary: {
      totalIncome,
      totalExpenses,
      profit: totalIncome - totalExpenses,
      employeeCount,
      harvestCount: harvestTotal._count,
      expenseCount: expenseTotal._count + payrollTotal._count,
    },
    totals: {
      payroll: payrollTotal._sum.wageAmount || 0,
      expenses: expenseTotal._sum.amount || 0,
      harvestRevenue: harvestTotal._sum.totalRevenue || 0,
      harvestKg: harvestTotal._sum.totalHarvestKg || 0,
    },
    recentHarvests,
    recentExpenses,
    monthlyTrend,
  })
}
