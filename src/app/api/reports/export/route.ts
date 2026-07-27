import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'

type ReportType = 'payroll' | 'expenses' | 'harvest'

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function generatePayrollCSV(startDate: string, endDate: string): Promise<string> {
  const where: Record<string, unknown> = { deletedAt: null }
  if (startDate || endDate) {
    where.workDate = {}
    if (startDate) (where.workDate as Record<string, Date>).gte = new Date(startDate)
    if (endDate) (where.workDate as Record<string, Date>).lte = new Date(endDate + 'T23:59:59')
  }

  const records = await prisma.payrollRecord.findMany({
    where,
    include: { employee: true },
    orderBy: { workDate: 'asc' },
  })

  const header = 'Tanggal,Karyawan,Area Kerja,Ngabedug,Nyore,Lembur (jam),Upah (Rp)'
  const rows = records.map((r: any) =>
    [
      escapeCSV(formatDateISO(r.workDate)),
      escapeCSV(r.employee.fullName),
      escapeCSV(r.workArea || ''),
      escapeCSV(r.shiftNgabedug ? 'Ya' : 'Tidak'),
      escapeCSV(r.shiftNyore ? 'Ya' : 'Tidak'),
      escapeCSV(r.lemburHours || 0),
      escapeCSV(r.wageAmount),
    ].join(',')
  )

  return [header, ...rows].join('\n')
}

async function generateExpensesCSV(startDate: string, endDate: string): Promise<string> {
  const where: Record<string, unknown> = { deletedAt: null }
  if (startDate || endDate) {
    where.transactionDate = {}
    if (startDate) (where.transactionDate as Record<string, Date>).gte = new Date(startDate)
    if (endDate) (where.transactionDate as Record<string, Date>).lte = new Date(endDate + 'T23:59:59')
  }

  const records = await prisma.expense.findMany({
    where,
    include: { category: true, sourceAccount: true },
    orderBy: { transactionDate: 'asc' },
  })

  const header = 'Tanggal,Kategori,Deskripsi,Jumlah (Rp),Sumber Dana'
  const rows = records.map((r: any) =>
    [
      escapeCSV(formatDateISO(r.transactionDate)),
      escapeCSV(r.category.name),
      escapeCSV(r.description || ''),
      escapeCSV(r.amount),
      escapeCSV(r.sourceAccount?.accountName || ''),
    ].join(',')
  )

  return [header, ...rows].join('\n')
}

async function generateHarvestCSV(startDate: string, endDate: string): Promise<string> {
  const where: Record<string, unknown> = { deletedAt: null }
  if (startDate || endDate) {
    where.harvestDate = {}
    if (startDate) (where.harvestDate as Record<string, Date>).gte = new Date(startDate)
    if (endDate) (where.harvestDate as Record<string, Date>).lte = new Date(endDate + 'T23:59:59')
  }

  const records = await prisma.harvestRevenue.findMany({
    where,
    orderBy: { harvestDate: 'asc' },
  })

  const header = 'Tanggal,Area,Total Kg,Normal Kg,BS Kg,Pendapatan Normal,Pendapatan BS,Total Pendapatan,BS%'
  const rows = records.map((r: any) =>
    [
      escapeCSV(formatDateISO(r.harvestDate)),
      escapeCSV(r.workArea || ''),
      escapeCSV(r.totalHarvestKg),
      escapeCSV(r.normalKg),
      escapeCSV(r.bsKg),
      escapeCSV(r.normalRevenue),
      escapeCSV(r.bsRevenue),
      escapeCSV(r.totalRevenue),
      escapeCSV(r.bsPercentage),
    ].join(',')
  )

  return [header, ...rows].join('\n')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as ReportType
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  if (!type || !['payroll', 'expenses', 'harvest'].includes(type)) {
    return errorResponse('Parameter type tidak valid. Gunakan: payroll, expenses, harvest')
  }

  try {
    let csv: string
    let filename: string

    switch (type) {
      case 'payroll':
        csv = await generatePayrollCSV(startDate, endDate)
        filename = 'laporan-gaji'
        break
      case 'expenses':
        csv = await generateExpensesCSV(startDate, endDate)
        filename = 'laporan-pengeluaran'
        break
      case 'harvest':
        csv = await generateHarvestCSV(startDate, endDate)
        filename = 'laporan-panen'
        break
      default:
        return errorResponse('Tipe laporan tidak valid')
    }

    const dateSuffix = new Date().toISOString().split('T')[0]
    const bom = '\uFEFF'

    return new Response(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}-${dateSuffix}.csv"`,
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return errorResponse('Gagal membuat laporan', 500)
  }
}
