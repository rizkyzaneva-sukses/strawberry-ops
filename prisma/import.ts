/**
 * Memuat hasil `scripts/extract_cashflow.py` ke database.
 *
 * Jalankan setelah `npm run db:seed`:
 *     npm run db:import
 *
 * Aman dijalankan berulang - seluruh data transaksional dari spreadsheet
 * dihapus dulu, master data (kebun, pekerjaan, kategori) tidak disentuh.
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()
const DATA_DIR = join(__dirname, 'import-data')

type Json = Record<string, any>

function load<T = Json>(filename: string): T[] {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf-8'))
}

function date(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null
}

/** "BCA 1393927074 (M Rizky Maulana)" -> bank, nomor, pemilik */
const ACCOUNT_RE = /^([A-Za-z]+)\s+(\S+)\s*\((.+)\)\s*$/

function parseAccount(raw: string | null) {
  if (!raw) return null
  const match = ACCOUNT_RE.exec(raw.trim())
  if (!match) return { bankName: null, accountNumber: null, holder: raw.trim() }
  return { bankName: match[1].toUpperCase(), accountNumber: match[2], holder: match[3].trim() }
}

/** Vendor yang catatannya menyebut temuan masalah ditandai untuk ditinjau. */
const FLAGGED_VENDORS = ['Tatang Hermawan']

async function main() {
  console.log('📥 Memuat data spreadsheet...')

  const admin = await prisma.user.findFirst({ where: { username: 'admin' } })
  if (!admin) throw new Error('User admin belum ada - jalankan `npm run db:seed` dulu')
  const adminId = admin.id

  const gardens = new Map(
    (await prisma.garden.findMany()).map((garden) => [garden.code, garden.id])
  )
  const categories = new Map(
    (await prisma.expenseCategory.findMany()).map((category) => [category.code, category.id])
  )
  const jobTypes = new Map(
    (await prisma.jobType.findMany()).map((job) => [job.name.toLowerCase(), job.id])
  )
  const accounts = new Map(
    (await prisma.bankAccount.findMany()).map((account) => [account.accountNumber, account.id])
  )
  const investors = new Map(
    (await prisma.investor.findMany()).map((investor) => [investor.name.toLowerCase(), investor.id])
  )

  const gardenId = (code: string) => {
    const id = gardens.get(code)
    if (!id) throw new Error(`Kebun ${code} tidak ada di master`)
    return id
  }

  // ---------------------------------------------------------- bersihkan dulu
  await prisma.expenseAllocation.deleteMany()
  await prisma.expenseItem.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.payrollRecord.deleteMany()
  await prisma.payrollPayment.deleteMany()
  await prisma.employeeAdvance.deleteMany()
  await prisma.payrollPeriod.deleteMany()
  await prisma.harvestRevenue.deleteMany()
  await prisma.capitalInjection.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.budgetItem.deleteMany()
  console.log('🧹 Data transaksional lama dibersihkan')

  // -------------------------------------------------------------- karyawan
  const employees = new Map<string, number>()
  for (const row of load('employees.json')) {
    const existing = await prisma.employee.findFirst({ where: { fullName: row.fullName } })
    const data = {
      fullName: row.fullName,
      gender: row.gender ?? null,
      employmentType: row.employmentType,
      wageNgabedug: row.wageNgabedug,
      wageNyore: row.wageNyore,
      wageLemburPerHour: row.wageLemburPerHour,
      monthlySalary: row.monthlySalary,
      isGroup: row.isGroup,
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      notes: row.defaultJobs ? `Tugas utama: ${row.defaultJobs}` : null,
    }
    const employee = existing
      ? await prisma.employee.update({ where: { id: existing.id }, data })
      : await prisma.employee.create({ data })
    employees.set(row.fullName, employee.id)
  }
  console.log(`✅ ${employees.size} karyawan`)

  // ---------------------------------------------------------------- vendor
  const vendors = new Map<string, number>()
  async function vendorFor(raw: string | null) {
    const parsed = parseAccount(raw)
    if (!parsed?.holder) return null
    const key = parsed.holder.toLowerCase()
    if (vendors.has(key)) return vendors.get(key)!

    const existing = await prisma.vendor.findFirst({ where: { name: parsed.holder } })
    const vendor =
      existing ??
      (await prisma.vendor.create({
        data: {
          name: parsed.holder,
          bankName: parsed.bankName,
          accountNumber: parsed.accountNumber,
          accountHolder: parsed.holder,
          isFlagged: FLAGGED_VENDORS.some((name) => parsed.holder.includes(name)),
        },
      }))
    vendors.set(key, vendor.id)
    return vendor.id
  }

  // ----------------------------------------------------------- modal masuk
  for (const row of load('capitalInjections.json')) {
    const source = parseAccount(row.sourceAccount)
    const destination = parseAccount(row.destinationAccount)
    await prisma.capitalInjection.create({
      data: {
        gardenId: gardenId(row.garden),
        entryDate: date(row.entryDate)!,
        description: row.description,
        investorId: source?.holder
          ? investors.get(source.holder.toLowerCase()) ?? null
          : null,
        fundingType: row.fundingType,
        amount: row.amount,
        sourceAccount: row.sourceAccount,
        destinationAccountId: destination?.accountNumber
          ? accounts.get(destination.accountNumber) ?? null
          : null,
        proofRef: row.proofRef,
        notes: row.notes,
        inputBy: adminId,
      },
    })
  }
  console.log(`✅ ${load('capitalInjections.json').length} catatan dana masuk`)

  // -------------------------------------------------------------- anggaran
  const budgets = new Map<string, number>()
  for (const row of load('budgetItems.json')) {
    const item = await prisma.budgetItem.create({
      data: {
        gardenId: gardenId(row.garden),
        name: row.name,
        plannedQty: row.plannedQty,
        plannedUnitPrice: row.plannedUnitPrice,
        plannedTotal: row.plannedTotal,
        actualUnitPrice: row.actualUnitPrice,
        actualTotal: row.actualTotal,
        variance: row.variance,
        paymentStatus: row.paymentStatus,
        sortOrder: row.sortOrder,
      },
    })
    budgets.set(row.name, item.id)
  }
  console.log(`✅ ${budgets.size} pos anggaran`)

  // ------------------------------------------------------------------ aset
  for (const row of load('assets.json')) {
    await prisma.asset.create({
      data: {
        gardenId: row.garden ? gardenId(row.garden) : null,
        name: row.name,
        category: row.category,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        ownershipShare: row.ownershipShare,
        totalCost: row.totalCost,
        paymentStatus: row.paymentStatus,
        notes: row.notes,
      },
    })
  }
  console.log(`✅ ${load('assets.json').length} aset`)

  // ------------------------------------------------------------ pengeluaran
  async function createExpense(row: Json, options: { daily: boolean }) {
    const categoryId = categories.get(row.category) ?? categories.get('LAIN_LAIN')!
    const source = parseAccount(row.sourceAccount)
    const shared = row.garden === 'SEMUA'
    const primaryGarden = shared ? null : gardenId(row.garden)

    const expense = await prisma.expense.create({
      data: {
        transactionDate: date(row.transactionDate)!,
        gardenId: primaryGarden,
        categoryId,
        vendorId: options.daily ? null : await vendorFor(row.recipientAccount),
        description: row.description,
        amount: row.amount,
        quantity: row.quantity ?? null,
        unit: row.unit ?? null,
        unitPrice: row.unitPrice ?? null,
        paymentStatus: row.paymentStatus ?? 'LUNAS',
        installmentLabel: row.installmentLabel ?? null,
        budgetItemId: null,
        isShared: shared,
        sourceAccountId: source?.accountNumber
          ? accounts.get(source.accountNumber) ?? null
          : null,
        recipientAccount: row.recipientAccount ?? null,
        proofRef: row.proofRef ?? null,
        isFlagged: Boolean(row.isFlagged),
        flagNote: row.flagNote ?? null,
        notes: row.notes ?? null,
        inputBy: adminId,
      },
    })

    // Porsi per kebun selalu ditulis supaya laporan cukup membaca satu tabel.
    const split: Array<{ code: string; amount: number }> = []
    if (shared && row.allocations) {
      for (const [code, amount] of Object.entries(row.allocations as Record<string, number>)) {
        if (amount) split.push({ code, amount })
      }
    } else if (shared) {
      const half = Math.floor(row.amount / 2)
      split.push({ code: 'KEBUN_LAMA', amount: half })
      split.push({ code: 'KEBUN_BARU', amount: row.amount - half })
    } else {
      split.push({ code: row.garden, amount: row.amount })
    }

    for (const part of split) {
      await prisma.expenseAllocation.create({
        data: { expenseId: expense.id, gardenId: gardenId(part.code), amount: part.amount },
      })
    }

    for (const item of row.items ?? []) {
      await prisma.expenseItem.create({
        data: {
          expenseId: expense.id,
          description: item.description,
          amount: item.amount,
          proofRef: item.proofRef ?? null,
        },
      })
    }
  }

  const operational = load('operationalExpenses.json')
  for (const row of operational) await createExpense(row, { daily: false })
  console.log(`✅ ${operational.length} pengeluaran arus kas`)

  const daily = load('dailyExpenses.json')
  for (const row of daily) await createExpense(row, { daily: true })
  console.log(`✅ ${daily.length} pengeluaran harian`)

  // ----------------------------------------------------------------- panen
  const harvests = load('harvests.json')
  for (const row of harvests) {
    await prisma.harvestRevenue.create({
      data: {
        gardenId: gardenId(row.garden),
        harvestDate: date(row.harvestDate)!,
        normalPricePerKg: row.normalPricePerKg,
        bsPricePerKg: row.bsPricePerKg,
        totalHarvestKg: row.totalHarvestKg,
        bsKg: row.bsKg,
        normalKg: row.normalKg,
        normalRevenue: row.normalRevenue,
        bsRevenue: row.bsRevenue,
        totalRevenue: row.totalRevenue,
        bsPercentage: row.bsPercentage,
        inputBy: adminId,
      },
    })
  }
  console.log(`✅ ${harvests.length} catatan panen`)

  // -------------------------------------------------------- periode gaji
  const periods = load('payrollPeriods.json')
  const periodRanges: Array<{ id: number; start: Date; end: Date }> = []
  for (const row of periods) {
    const start = date(row.startDate)!
    const end = date(row.endDate)!
    const period = await prisma.payrollPeriod.upsert({
      where: { startDate_endDate: { startDate: start, endDate: end } },
      update: {},
      create: { startDate: start, endDate: end, status: row.payments?.length ? 'PAID' : 'OPEN' },
    })
    periodRanges.push({ id: period.id, start, end })

    for (const payment of row.payments ?? []) {
      await prisma.payrollPayment.create({
        data: {
          periodId: period.id,
          batchNo: payment.batchNo,
          paidDate: end,
          amount: payment.amount,
          notes: payment.label,
          inputBy: adminId,
        },
      })
    }
  }
  console.log(`✅ ${periods.length} periode gaji`)

  // ------------------------------------------------------------------ gaji
  const payroll = load('payrollRecords.json')
  let unmatchedJob = 0
  for (const row of payroll) {
    const employeeId = employees.get(row.employee)
    if (!employeeId) {
      console.warn(`  ⚠️  Karyawan tidak dikenal, dilewati: ${row.employee}`)
      continue
    }
    const workDate = date(row.workDate)!
    const period = periodRanges.find((range) => workDate >= range.start && workDate <= range.end)
    const jobTypeId = row.jobType ? jobTypes.get(String(row.jobType).toLowerCase()) ?? null : null
    if (row.jobType && !jobTypeId) unmatchedJob += 1

    await prisma.payrollRecord.create({
      data: {
        employeeId,
        gardenId: gardenId(row.garden),
        jobTypeId,
        workDate,
        shift: row.shift,
        startTime: row.startTime,
        endTime: row.endTime,
        lemburHours: row.lemburHours,
        headcount: row.headcount,
        wageAmount: row.wageAmount,
        isManualWage: row.isManualWage,
        periodId: period?.id ?? null,
        notes: row.notes,
        inputBy: adminId,
      },
    })
  }
  console.log(`✅ ${payroll.length} catatan gaji harian`)
  if (unmatchedJob) {
    console.log(`  ℹ️  ${unmatchedJob} baris pekerjaannya belum ada di master, disimpan tanpa jenis pekerjaan`)
  }

  // -------------------------------------------------------------- ringkasan
  const warnings = load('warnings.json')
  console.log('')
  console.log(`📋 ${warnings.length} peringatan dari ekstraksi - lihat prisma/import-data/warnings.json`)
  console.log('🎉 Import selesai.')
}

main()
  .catch((e) => {
    console.error('❌ Import gagal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
