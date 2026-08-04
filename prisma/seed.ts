import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/** Kebun Baru punya investor, Kebun Lama tidak. */
const GARDENS = [
  { code: 'KEBUN_BARU', name: 'Kebun Baru', hasInvestor: true, sortOrder: 1 },
  { code: 'KEBUN_LAMA', name: 'Kebun Lama', hasInvestor: false, sortOrder: 2 },
]

const JOB_TYPES = [
  'Pruning',
  'Cabut Gulma',
  'Semprot Gulma Jalur',
  'Tanam Bibit',
  'Panen',
  'Kirim Panen',
  'Penyiraman',
  'Asisten Penyiraman',
  'Semprot Obat',
  'Cor Obat',
  'Pemupukan (Berak)',
  'Bekong Bibit',
  'Pencatatan Laporan Kerja',
  'Ngangkut Berak',
  'Tunggu Kebun',
  'Babad Lahan',
]

const EXPENSE_CATEGORIES = [
  { code: 'LAHAN', name: 'Lahan' },
  { code: 'BIBIT', name: 'Bibit' },
  { code: 'KARUNG', name: 'Karung & Media Tanam' },
  { code: 'JASA_NGARUNG', name: 'Jasa Ngarung' },
  { code: 'PUPUK_OBAT', name: 'Pupuk & Obat' },
  { code: 'SAUNG', name: 'Saung & Bangunan' },
  { code: 'ALAT', name: 'Alat & Perlengkapan' },
  { code: 'UPAH_HARIAN', name: 'Upah Borongan & Harian' },
  { code: 'BENSIN', name: 'Bensin' },
  { code: 'GAJI', name: 'Gaji Karyawan' },
  { code: 'OPERASIONAL_HARIAN', name: 'Talangan Operasional Harian' },
  { code: 'LAIN_LAIN', name: 'Lain-lain' },
]

const BANK_ACCOUNTS = [
  { accountName: 'M Rizky Maulana', bankName: 'BCA', accountNumber: '1393927074' },
  { accountName: 'Asfiyani Nur A', bankName: 'BCA', accountNumber: '1393387622' },
  { accountName: 'Windi Krisdayani', bankName: 'BCA', accountNumber: '7751284792' },
  { accountName: 'Ilham Firmansyah', bankName: 'BCA', accountNumber: '2330029458' },
  { accountName: 'Kas Tunai', bankName: 'Tunai', accountNumber: 'CASH' },
]

const INVESTORS = [
  { name: 'M Rizky Maulana', bankName: 'BCA', accountNumber: '1393927074' },
  { name: 'Asfiyani Nur A', bankName: 'BCA', accountNumber: '1393387622' },
  { name: 'Windi Krisdayani', bankName: 'BCA', accountNumber: '7751284792' },
]

function slug(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

async function main() {
  console.log('🌱 Seeding master data...')

  const passwordHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      fullName: 'Administrator',
      role: 'OWNER',
      isActive: true,
    },
  })
  console.log('✅ User admin siap')

  for (const garden of GARDENS) {
    await prisma.garden.upsert({
      where: { code: garden.code },
      update: { name: garden.name, hasInvestor: garden.hasInvestor },
      create: garden,
    })
  }
  console.log(`✅ ${GARDENS.length} kebun siap`)

  for (const [index, name] of JOB_TYPES.entries()) {
    await prisma.jobType.upsert({
      where: { code: slug(name) },
      update: { name },
      create: { name, code: slug(name), sortOrder: index + 1 },
    })
  }
  console.log(`✅ ${JOB_TYPES.length} jenis pekerjaan siap`)

  for (const [index, category] of EXPENSE_CATEGORIES.entries()) {
    await prisma.expenseCategory.upsert({
      where: { code: category.code },
      update: { name: category.name },
      create: { ...category, sortOrder: index + 1 },
    })
  }
  console.log(`✅ ${EXPENSE_CATEGORIES.length} kategori pengeluaran siap`)

  for (const account of BANK_ACCOUNTS) {
    const existing = await prisma.bankAccount.findFirst({
      where: { accountNumber: account.accountNumber },
    })
    if (!existing) await prisma.bankAccount.create({ data: account })
  }
  console.log(`✅ ${BANK_ACCOUNTS.length} rekening siap`)

  for (const investor of INVESTORS) {
    await prisma.investor.upsert({
      where: { name: investor.name },
      update: {},
      create: investor,
    })
  }
  console.log(`✅ ${INVESTORS.length} investor siap`)

  const existingPrice = await prisma.commodityPrice.findFirst()
  if (!existingPrice) {
    await prisma.commodityPrice.create({
      data: {
        effectiveDate: new Date('2026-07-08'),
        normalPricePerKg: 22000,
        bsPricePerKg: 4000,
        updatedBy: admin.id,
      },
    })
  }
  console.log('✅ Harga komoditas siap')

  console.log('🎉 Seed master selesai. Jalankan `npm run db:import` untuk memuat data spreadsheet.')
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
