import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse } from '@/lib/api-utils'
import { parseGardenParam } from '@/lib/garden'

/**
 * Transfer talangan operasional hanya perpindahan kas ke lapangan - rinciannya
 * sudah tercatat sebagai upah harian dan pengeluaran harian. Kategori ini
 * dihitung di arus kas, tapi tidak di laporan biaya, supaya tidak dobel.
 */
const ADVANCE_CATEGORY = 'OPERASIONAL_HARIAN'

function monthRange(offset: number, now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'month'
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''
  const gardenId = parseGardenParam(request.url)

  const now = new Date()
  let dateFilter: { gte?: Date; lte?: Date }

  if (startDate && endDate) {
    dateFilter = { gte: new Date(startDate), lte: new Date(endDate) }
  } else if (period === 'week') {
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    dateFilter = { gte: weekAgo }
  } else if (period === 'year') {
    dateFilter = { gte: new Date(now.getFullYear(), 0, 1) }
  } else if (period === 'all') {
    dateFilter = {}
  } else {
    dateFilter = { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
  }

  const advanceCategory = await prisma.expenseCategory.findUnique({
    where: { code: ADVANCE_CATEGORY },
  })
  const advanceCategoryId = advanceCategory?.id ?? -1

  const gardenScope = gardenId ? { gardenId } : {}
  const allocationScope = gardenId ? { gardenId } : {}

  const [
    gardens,
    payrollTotal,
    harvestTotal,
    employeeCount,
    costAllocations,
    cashOutAllocations,
    capitalEquity,
    capitalLoan,
    recentHarvests,
    recentExpenses,
    openAdvances,
    flaggedCount,
    budgetItems,
  ] = await Promise.all([
    prisma.garden.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.payrollRecord.aggregate({
      where: { deletedAt: null, workDate: dateFilter, ...gardenScope },
      _sum: { wageAmount: true },
      _count: true,
    }),
    prisma.harvestRevenue.aggregate({
      where: { deletedAt: null, harvestDate: dateFilter, ...gardenScope },
      _sum: { totalRevenue: true, totalHarvestKg: true, bsKg: true },
      _count: true,
    }),
    prisma.employee.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
    prisma.expenseAllocation.aggregate({
      where: {
        ...allocationScope,
        expense: {
          deletedAt: null,
          transactionDate: dateFilter,
          categoryId: { not: advanceCategoryId },
        },
      },
      _sum: { amount: true },
    }),
    prisma.expenseAllocation.aggregate({
      where: {
        ...allocationScope,
        expense: { deletedAt: null, transactionDate: dateFilter },
      },
      _sum: { amount: true },
    }),
    prisma.capitalInjection.aggregate({
      where: { deletedAt: null, fundingType: 'EQUITY', ...gardenScope },
      _sum: { amount: true },
    }),
    prisma.capitalInjection.aggregate({
      where: { deletedAt: null, fundingType: 'LOAN', ...gardenScope },
      _sum: { amount: true, repaidAmount: true },
    }),
    prisma.harvestRevenue.findMany({
      where: { deletedAt: null, ...gardenScope },
      include: { garden: true },
      orderBy: { harvestDate: 'desc' },
      take: 5,
    }),
    prisma.expense.findMany({
      where: { deletedAt: null, ...(gardenId ? { allocations: { some: { gardenId } } } : {}) },
      include: { category: true, garden: true, vendor: true },
      orderBy: { transactionDate: 'desc' },
      take: 5,
    }),
    prisma.employeeAdvance.aggregate({
      where: { deletedAt: null, status: 'OPEN' },
      _sum: { amount: true, settledAmount: true },
    }),
    prisma.expense.count({ where: { deletedAt: null, isFlagged: true } }),
    prisma.budgetItem.findMany({ where: gardenScope }),
  ])

  // ------------------------------------------------------- rekap bulanan
  const monthlyTrend = []
  for (let offset = 5; offset >= 0; offset -= 1) {
    const { start, end } = monthRange(offset, now)
    const [payroll, cost, harvest] = await Promise.all([
      prisma.payrollRecord.aggregate({
        where: { deletedAt: null, workDate: { gte: start, lte: end }, ...gardenScope },
        _sum: { wageAmount: true },
      }),
      prisma.expenseAllocation.aggregate({
        where: {
          ...allocationScope,
          expense: {
            deletedAt: null,
            transactionDate: { gte: start, lte: end },
            categoryId: { not: advanceCategoryId },
          },
        },
        _sum: { amount: true },
      }),
      prisma.harvestRevenue.aggregate({
        where: { deletedAt: null, harvestDate: { gte: start, lte: end }, ...gardenScope },
        _sum: { totalRevenue: true },
      }),
    ])

    const income = harvest._sum.totalRevenue || 0
    const expenses = (payroll._sum.wageAmount || 0) + (cost._sum.amount || 0)
    monthlyTrend.push({
      month: start.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      income,
      expenses,
      profit: income - expenses,
    })
  }

  // ------------------------------------------------- perbandingan antar kebun
  const perGarden = await Promise.all(
    gardens.map(async (garden) => {
      const [payroll, cost, harvest] = await Promise.all([
        prisma.payrollRecord.aggregate({
          where: { deletedAt: null, workDate: dateFilter, gardenId: garden.id },
          _sum: { wageAmount: true },
        }),
        prisma.expenseAllocation.aggregate({
          where: {
            gardenId: garden.id,
            expense: {
              deletedAt: null,
              transactionDate: dateFilter,
              categoryId: { not: advanceCategoryId },
            },
          },
          _sum: { amount: true },
        }),
        prisma.harvestRevenue.aggregate({
          where: { deletedAt: null, harvestDate: dateFilter, gardenId: garden.id },
          _sum: { totalRevenue: true, totalHarvestKg: true },
        }),
      ])

      const income = harvest._sum.totalRevenue || 0
      const expenses = (payroll._sum.wageAmount || 0) + (cost._sum.amount || 0)
      return {
        gardenId: garden.id,
        gardenName: garden.name,
        hasInvestor: garden.hasInvestor,
        income,
        expenses,
        profit: income - expenses,
        harvestKg: harvest._sum.totalHarvestKg || 0,
      }
    })
  )

  const totalIncome = harvestTotal._sum.totalRevenue || 0
  const totalPayroll = payrollTotal._sum.wageAmount || 0
  const totalCost = totalPayroll + (costAllocations._sum.amount || 0)

  const equity = capitalEquity._sum.amount || 0
  const loan = capitalLoan._sum.amount || 0
  const loanRepaid = capitalLoan._sum.repaidAmount || 0
  const cashIn = equity + loan
  const cashOut = cashOutAllocations._sum.amount || 0

  const budgetPlanned = budgetItems.reduce((total, item) => total + item.plannedTotal, 0)
  const budgetActual = budgetItems.reduce(
    (total, item) => total + (item.actualTotal ?? item.plannedTotal),
    0
  )

  const showCapital = gardenId
    ? gardens.find((garden) => garden.id === gardenId)?.hasInvestor ?? false
    : gardens.some((garden) => garden.hasInvestor)

  return jsonResponse({
    gardens,
    summary: {
      totalIncome,
      totalExpenses: totalCost,
      profit: totalIncome - totalCost,
      employeeCount,
      harvestCount: harvestTotal._count,
      harvestKg: harvestTotal._sum.totalHarvestKg || 0,
      bsPercentage:
        (harvestTotal._sum.totalHarvestKg || 0) > 0
          ? Math.round(
              ((harvestTotal._sum.bsKg || 0) / (harvestTotal._sum.totalHarvestKg || 1)) * 10000
            ) / 100
          : 0,
      flaggedExpenses: flaggedCount,
      openAdvances: (openAdvances._sum.amount || 0) - (openAdvances._sum.settledAmount || 0),
    },
    cashflow: showCapital
      ? {
          equity,
          loan,
          loanRepaid,
          loanOutstanding: loan - loanRepaid,
          cashIn,
          cashOut,
          balance: cashIn - cashOut + totalIncome,
        }
      : null,
    budget: budgetItems.length
      ? { planned: budgetPlanned, actual: budgetActual, variance: budgetPlanned - budgetActual }
      : null,
    totals: {
      payroll: totalPayroll,
      expenses: costAllocations._sum.amount || 0,
      harvestRevenue: totalIncome,
      harvestKg: harvestTotal._sum.totalHarvestKg || 0,
    },
    perGarden,
    recentHarvests,
    recentExpenses,
    monthlyTrend,
  })
}
