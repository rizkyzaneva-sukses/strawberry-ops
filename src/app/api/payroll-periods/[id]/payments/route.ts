import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'

/** Mencatat satu batch transfer gaji ("Sudah di TF batch 1", "batch 2", dst). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const periodId = parseInt(id)

  try {
    const body = await request.json()
    const amount = parseInt(body.amount)
    if (!amount || amount <= 0) return errorResponse('Nominal harus lebih dari 0')

    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: { payments: true },
    })
    if (!period) return errorResponse('Periode gaji tidak ditemukan', 404)

    const nextBatch = body.batchNo
      ? parseInt(body.batchNo)
      : Math.max(0, ...period.payments.map((payment) => payment.batchNo)) + 1

    const payment = await prisma.payrollPayment.create({
      data: {
        periodId,
        batchNo: nextBatch,
        paidDate: body.paidDate ? new Date(body.paidDate) : new Date(),
        amount,
        sourceAccountId: body.sourceAccountId ? parseInt(body.sourceAccountId) : null,
        proofPath: body.proofPath || null,
        notes: body.notes || null,
        inputBy: user!.id,
      },
      include: { sourceAccount: true },
    })

    // Periode ditandai lunas begitu seluruh upah bersih tertutup.
    const [wages, advances, allPayments] = await Promise.all([
      prisma.payrollRecord.aggregate({
        where: { periodId, deletedAt: null },
        _sum: { wageAmount: true },
      }),
      prisma.employeeAdvance.aggregate({
        where: { periodId, deletedAt: null },
        _sum: { amount: true, settledAmount: true },
      }),
      prisma.payrollPayment.aggregate({ where: { periodId }, _sum: { amount: true } }),
    ])

    const net =
      (wages._sum.wageAmount || 0) -
      ((advances._sum.amount || 0) - (advances._sum.settledAmount || 0))
    const paid = allPayments._sum.amount || 0

    if (paid >= net && net > 0) {
      await prisma.payrollPeriod.update({ where: { id: periodId }, data: { status: 'PAID' } })
    }

    logAudit(user!.id, 'CREATE', 'PayrollPayment', payment.id, `batch ${nextBatch}`)
    return jsonResponse({ payment, totalPaid: paid, netPayable: net }, 201)
  } catch (err) {
    console.error('Create payroll payment error:', err)
    return errorResponse('Gagal mencatat pembayaran gaji')
  }
}
