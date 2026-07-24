import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default admin user
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
  console.log('✅ Admin user created:', admin.username)

  // Seed expense categories
  const categories = [
    { name: 'Gaji', code: 'GAJI' },
    { name: 'Pupuk & Obat', code: 'PUPUK_OBAT' },
    { name: 'Alat & Perlengkapan', code: 'ALAT_PERLENGKAPAN' },
    { name: 'Transportasi', code: 'TRANSPORTASI' },
    { name: 'Sewa', code: 'SEWA' },
    { name: 'Utilitas', code: 'UTILITAS' },
    { name: 'Lainnya', code: 'LAINNYA' },
  ]

  for (const cat of categories) {
    await prisma.expenseCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    })
  }
  console.log('✅ Expense categories seeded')

  // Seed a sample bank account
  await prisma.bankAccount.upsert({
    where: { id: 1 },
    update: {},
    create: {
      accountName: 'Kas Utama',
      bankName: 'Tunai',
      accountNumber: 'CASH',
      isActive: true,
    },
  })
  console.log('✅ Default bank account created')

  // Seed sample employees
  const employees = [
    { fullName: 'Budi Santoso', phone: '081234567890', address: 'Kota Batu', wageType: 'HARIAN', wageRate: 100000, minHours: null, startDate: new Date('2024-01-15'), status: 'ACTIVE' },
    { fullName: 'Siti Aminah', phone: '081234567891', address: 'Kota Batu', wageType: 'PER_JAM', wageRate: 15000, minHours: 4, startDate: new Date('2024-02-01'), status: 'ACTIVE' },
    { fullName: 'Joko Widodo', phone: '081234567892', address: 'Malang', wageType: 'BORONGAN', wageRate: 200000, minHours: null, startDate: new Date('2024-03-01'), status: 'ACTIVE' },
  ]

  for (const emp of employees) {
    const existing = await prisma.employee.findFirst({ where: { fullName: emp.fullName } })
    if (!existing) {
      await prisma.employee.create({ data: emp })
    }
  }
  console.log('✅ Sample employees seeded')

  // Seed default commodity price
  const existingPrice = await prisma.commodityPrice.findFirst()
  if (!existingPrice) {
    await prisma.commodityPrice.create({
      data: {
        effectiveDate: new Date(),
        normalPricePerKg: 35000,
        bsPricePerKg: 15000,
        updatedBy: admin.id,
      },
    })
  }
  console.log('✅ Default commodity price seeded')

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
