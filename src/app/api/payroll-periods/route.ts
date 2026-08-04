import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'
import { createPayrollPeriodSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const status = new URL(request.url).searchParams.get('status') || ''
  const where = status ? { status } : {}

  const periods = await prisma.payrollPeriod.findMany({
    where,
    orderBy: { startDate: 'desc' },
    include: {
      payments: true,
      _count: { select: { records: true } },
    },
  })

  const items = await Promise.all(
    periods.map(async (period) => {
      const wages = await prisma.payrollRecord.aggregate({
        where: { periodId: period.id, deletedAt: null },
        _sum: { wageAmount: true },
      })
      const paid = period.payments.reduce((total, payment) => total + payment.amount, 0)
      const totalWage = wages._sum.wageAmount || 0
      return {
        ...period,
        totalWage,
        totalPaid: paid,
        outstanding: totalWage - paid,
      }
    })
  )

  return jsonResponse({ items, total: items.length })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createPayrollPeriodSchema.safeParse(body)
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message)

    const startDate = new Date(parsed.data.startDate)
    const endDate = new Date(parsed.data.endDate)
    if (endDate < startDate) return errorResponse('Tanggal akhir harus setelah tanggal mulai')

    const overlap = await prisma.payrollPeriod.findFirst({
      where: { startDate: { lte: endDate }, endDate: { gte: startDate } },
    })
    if (overlap) return errorResponse('Periode ini bertumpang tindih dengan periode lain')

    const period = await prisma.payrollPeriod.create({
      data: { startDate, endDate, notes: parsed.data.notes || null },
    })

    // Catatan gaji yang tanggalnya masuk periode ini langsung dikaitkan.
    const linked = await prisma.payrollRecord.updateMany({
      where: { workDate: { gte: startDate, lte: endDate }, periodId: null, deletedAt: null },
      data: { periodId: period.id },
    })

    logAudit(user!.id, 'CREATE', 'PayrollPeriod', period.id)
    return jsonResponse({ ...period, linkedRecords: linked.count }, 201)
  } catch (err) {
    console.error('Create payroll period error:', err)
    return errorResponse('Gagal membuat periode gaji')
  }
}
