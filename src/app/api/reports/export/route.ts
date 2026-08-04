import { NextRequest } from 'next/server'
import { errorResponse, requireAuth } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'
import { SHIFT_LABELS, type Shift } from '@/lib/utils'

type ReportType = 'payroll' | 'expenses' | 'harvest' | 'capital' | 'budget'

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

function dateWhere(field: string, startDate: string, endDate: string) {
  if (!startDate && !endDate) return {}
  const range: Record<string, Date> = {}
  if (startDate) range.gte = new Date(startDate)
  if (endDate) range.lte = new Date(`${endDate}T23:59:59`)
  return { [field]: range }
}

type Options = { startDate: string; endDate: string; gardenId: number | null }

async function generatePayrollCSV({ startDate, endDate, gardenId }: Options) {
  const records = await prisma.payrollRecord.findMany({
    where: {
      deletedAt: null,
      ...dateWhere('workDate', startDate, endDate),
      ...(gardenId ? { gardenId } : {}),
    },
    include: { employee: true, garden: true, block: true, jobType: true },
    orderBy: [{ workDate: 'asc' }, { employeeId: 'asc' }],
  })

  const header =
    'Tanggal,Karyawan,Kebun,Blok,Pekerjaan,Shift,Jam Mulai,Jam Selesai,Lembur (jam),Jumlah Orang,Upah (Rp)'
  const rows = records.map((record) =>
    [
      escapeCSV(formatDateISO(record.workDate)),
      escapeCSV(record.employee.fullName),
      escapeCSV(record.garden.name),
      escapeCSV(record.block?.name || ''),
      escapeCSV(record.jobType?.name || ''),
      escapeCSV(SHIFT_LABELS[record.shift as Shift] || record.shift),
      escapeCSV(record.startTime || ''),
      escapeCSV(record.endTime || ''),
      escapeCSV(record.lemburHours || 0),
      escapeCSV(record.headcount),
      escapeCSV(record.wageAmount),
    ].join(',')
  )

  return [header, ...rows].join('\n')
}

async function generateExpensesCSV({ startDate, endDate, gardenId }: Options) {
  const records = await prisma.expense.findMany({
    where: {
      deletedAt: null,
      ...dateWhere('transactionDate', startDate, endDate),
      ...(gardenId ? { allocations: { some: { gardenId } } } : {}),
    },
    include: {
      category: true,
      garden: true,
      vendor: true,
      sourceAccount: true,
      allocations: { include: { garden: true } },
    },
    orderBy: { transactionDate: 'asc' },
  })

  const header =
    'Tanggal,Kategori,Deskripsi,Kebun,Porsi Kebun (Rp),Jumlah Transaksi (Rp),Jumlah,Satuan,Status Bayar,Termin,Penerima,Sumber Dana,Bermasalah,Bukti'
  const rows = records.map((record) => {
    const share = gardenId
      ? record.allocations.find((allocation) => allocation.gardenId === gardenId)?.amount ?? 0
      : record.amount
    const gardenLabel = record.isShared
      ? record.allocations.map((allocation) => allocation.garden.name).join(' + ')
      : record.garden?.name || ''
    return [
      escapeCSV(formatDateISO(record.transactionDate)),
      escapeCSV(record.category.name),
      escapeCSV(record.description || ''),
      escapeCSV(gardenLabel),
      escapeCSV(share),
      escapeCSV(record.amount),
      escapeCSV(record.quantity ?? ''),
      escapeCSV(record.unit || ''),
      escapeCSV(record.paymentStatus),
      escapeCSV(record.installmentLabel || ''),
      escapeCSV(record.vendor?.name || record.recipientAccount || ''),
      escapeCSV(record.sourceAccount?.accountName || ''),
      escapeCSV(record.isFlagged ? 'Ya' : ''),
      escapeCSV(record.transferProofPath || record.proofRef || ''),
    ].join(',')
  })

  return [header, ...rows].join('\n')
}

async function generateHarvestCSV({ startDate, endDate, gardenId }: Options) {
  const records = await prisma.harvestRevenue.findMany({
    where: {
      deletedAt: null,
      ...dateWhere('harvestDate', startDate, endDate),
      ...(gardenId ? { gardenId } : {}),
    },
    include: { garden: true, block: true },
    orderBy: { harvestDate: 'asc' },
  })

  const header =
    'Tanggal,Kebun,Blok,Total Kg,Normal Kg,BS Kg,Harga Normal,Harga BS,Pendapatan Normal,Pendapatan BS,Total Pendapatan,BS%'
  const rows = records.map((record) =>
    [
      escapeCSV(formatDateISO(record.harvestDate)),
      escapeCSV(record.garden.name),
      escapeCSV(record.block?.name || ''),
      escapeCSV(record.totalHarvestKg),
      escapeCSV(record.normalKg),
      escapeCSV(record.bsKg),
      escapeCSV(record.normalPricePerKg),
      escapeCSV(record.bsPricePerKg),
      escapeCSV(record.normalRevenue),
      escapeCSV(record.bsRevenue),
      escapeCSV(record.totalRevenue),
      escapeCSV(record.bsPercentage),
    ].join(',')
  )

  return [header, ...rows].join('\n')
}

async function generateCapitalCSV({ startDate, endDate, gardenId }: Options) {
  const records = await prisma.capitalInjection.findMany({
    where: {
      deletedAt: null,
      ...dateWhere('entryDate', startDate, endDate),
      ...(gardenId ? { gardenId } : {}),
    },
    include: { garden: true, investor: true, destinationAccount: true },
    orderBy: { entryDate: 'asc' },
  })

  const header =
    'Tanggal,Kebun,Keterangan,Jenis,Investor,Nominal (Rp),Sudah Dikembalikan (Rp),Sumber Dana,Rekening Tujuan,Bukti'
  const rows = records.map((record) =>
    [
      escapeCSV(formatDateISO(record.entryDate)),
      escapeCSV(record.garden.name),
      escapeCSV(record.description),
      escapeCSV(record.fundingType === 'LOAN' ? 'Modal Kasbon (Utang)' : 'Modal Penyertaan'),
      escapeCSV(record.investor?.name || ''),
      escapeCSV(record.amount),
      escapeCSV(record.repaidAmount),
      escapeCSV(record.sourceAccount || ''),
      escapeCSV(record.destinationAccount?.accountName || ''),
      escapeCSV(record.proofPath || record.proofRef || ''),
    ].join(',')
  )

  return [header, ...rows].join('\n')
}

async function generateBudgetCSV({ gardenId }: Options) {
  const records = await prisma.budgetItem.findMany({
    where: gardenId ? { gardenId } : {},
    include: { garden: true },
    orderBy: [{ gardenId: 'asc' }, { sortOrder: 'asc' }],
  })

  const header =
    'Kebun,Pos Anggaran,Jumlah,Satuan,Harga Anggaran,Total Anggaran,Harga Faktual,Total Faktual,Selisih,Status Bayar'
  const rows = records.map((record) =>
    [
      escapeCSV(record.garden.name),
      escapeCSV(record.name),
      escapeCSV(record.plannedQty),
      escapeCSV(record.unit || ''),
      escapeCSV(record.plannedUnitPrice),
      escapeCSV(record.plannedTotal),
      escapeCSV(record.actualUnitPrice ?? ''),
      escapeCSV(record.actualTotal ?? ''),
      escapeCSV(record.variance ?? ''),
      escapeCSV(record.paymentStatus),
    ].join(',')
  )

  return [header, ...rows].join('\n')
}

const GENERATORS: Record<
  ReportType,
  { run: (options: Options) => Promise<string>; file: string }
> = {
  payroll: { run: generatePayrollCSV, file: 'laporan-gaji' },
  expenses: { run: generateExpensesCSV, file: 'laporan-pengeluaran' },
  harvest: { run: generateHarvestCSV, file: 'laporan-panen' },
  capital: { run: generateCapitalCSV, file: 'laporan-dana-masuk' },
  budget: { run: generateBudgetCSV, file: 'laporan-anggaran' },
}

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as ReportType
  const generator = GENERATORS[type]

  if (!generator) {
    return errorResponse(
      `Parameter type tidak valid. Gunakan: ${Object.keys(GENERATORS).join(', ')}`
    )
  }

  const gardenIdRaw = searchParams.get('gardenId')
  const gardenId =
    gardenIdRaw && gardenIdRaw !== 'all' && parseInt(gardenIdRaw) > 0 ? parseInt(gardenIdRaw) : null

  try {
    const csv = await generator.run({
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      gardenId,
    })

    const dateSuffix = new Date().toISOString().split('T')[0]
    const bom = '﻿'

    return new Response(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${generator.file}-${dateSuffix}.csv"`,
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return errorResponse('Gagal membuat laporan', 500)
  }
}
