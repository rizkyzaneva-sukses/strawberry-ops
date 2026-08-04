import { z } from 'zod'

export const createEmployeeSchema = z.object({
  fullName: z.string().min(1, 'Nama wajib diisi'),
  gender: z.enum(['P', 'L']).optional().nullable(),
  employmentType: z.enum(['HARIAN', 'BULANAN']).default('HARIAN'),
  wageNgabedug: z.number().min(0, 'Upah Ngabedug tidak boleh negatif').default(0),
  wageNyore: z.number().min(0, 'Upah Nyore tidak boleh negatif').default(0),
  wageLemburPerHour: z.number().min(0, 'Tarif lembur tidak boleh negatif').default(0),
  monthlySalary: z.number().min(0, 'Gaji bulanan tidak boleh negatif').default(0),
  isGroup: z.boolean().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  startDate: z.string().optional(),
})

export const createExpenseSchema = z.object({
  transactionDate: z.string().min(1, 'Tanggal transaksi wajib diisi'),
  gardenId: z.number().positive().optional().nullable(),
  categoryId: z.number().positive('Kategori wajib diisi'),
  vendorId: z.number().positive().optional().nullable(),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  description: z.string().optional(),
  quantity: z.number().positive().optional().nullable(),
  unit: z.string().optional().nullable(),
  unitPrice: z.number().positive().optional().nullable(),
  paymentStatus: z.enum(['LUNAS', 'DP', 'KURANG_BAYAR', 'BELUM_BAYAR']).default('LUNAS'),
  installmentLabel: z.string().optional().nullable(),
  budgetItemId: z.number().positive().optional().nullable(),
  isShared: z.boolean().optional(),
  /** Porsi per kebun untuk biaya bersama. Totalnya harus sama dengan amount. */
  allocations: z
    .array(z.object({ gardenId: z.number().positive(), amount: z.number().min(0) }))
    .optional(),
  sourceAccountId: z.number().positive().optional().nullable(),
  recipientAccount: z.string().optional(),
  isFlagged: z.boolean().optional(),
  flagNote: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const createHarvestSchema = z.object({
  gardenId: z.number().positive('Kebun wajib dipilih'),
  blockId: z.number().positive().optional().nullable(),
  harvestDate: z.string().min(1, 'Tanggal panen wajib diisi'),
  normalPricePerKg: z.number().positive('Harga normal harus lebih dari 0'),
  bsPricePerKg: z.number().positive('Harga BS harus lebih dari 0'),
  totalHarvestKg: z.number().positive('Total panen harus lebih dari 0'),
  bsKg: z.number().min(0, 'BS tidak boleh negatif'),
  notes: z.string().optional(),
})

export const createPayrollSchema = z.object({
  employeeId: z.number().positive('Karyawan wajib diisi'),
  gardenId: z.number().positive('Kebun wajib dipilih'),
  blockId: z.number().positive().optional().nullable(),
  jobTypeId: z.number().positive().optional().nullable(),
  workDate: z.string().min(1, 'Tanggal kerja wajib diisi'),
  shift: z.enum(['NGABEDUG', 'NYORE', 'LEMBUR', 'BORONGAN'], {
    errorMap: () => ({ message: 'Shift tidak valid' }),
  }),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  lemburHours: z.number().min(0).optional(),
  headcount: z.number().int().min(1).optional(),
  /** Wajib untuk shift BORONGAN, opsional sebagai penimpa hitungan otomatis. */
  wageAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export const createGardenSchema = z.object({
  name: z.string().min(1, 'Nama kebun wajib diisi'),
  code: z.string().min(1, 'Kode kebun wajib diisi'),
  hasInvestor: z.boolean().optional(),
  notes: z.string().optional(),
})

export const createBlockSchema = z.object({
  gardenId: z.number().positive('Kebun wajib dipilih'),
  name: z.string().min(1, 'Nama blok wajib diisi'),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
})

export const createJobTypeSchema = z.object({
  name: z.string().min(1, 'Nama pekerjaan wajib diisi'),
  sortOrder: z.number().int().optional(),
})

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Nama penerima wajib diisi'),
  type: z.enum(['VENDOR', 'MATERIAL', 'JASA', 'PEKERJA', 'LAINNYA']).default('VENDOR'),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  accountHolder: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isFlagged: z.boolean().optional(),
  notes: z.string().optional().nullable(),
})

export const createCapitalSchema = z.object({
  gardenId: z.number().positive('Kebun wajib dipilih'),
  entryDate: z.string().min(1, 'Tanggal wajib diisi'),
  description: z.string().min(1, 'Keterangan wajib diisi'),
  investorId: z.number().positive().optional().nullable(),
  fundingType: z.enum(['EQUITY', 'LOAN'], {
    errorMap: () => ({ message: 'Jenis dana tidak valid' }),
  }),
  amount: z.number().positive('Nominal harus lebih dari 0'),
  sourceAccount: z.string().optional().nullable(),
  destinationAccountId: z.number().positive().optional().nullable(),
  repaidAmount: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
})

export const createAssetSchema = z.object({
  gardenId: z.number().positive().optional().nullable(),
  name: z.string().min(1, 'Nama aset wajib diisi'),
  category: z.string().optional().nullable(),
  acquiredDate: z.string().optional().nullable(),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().min(0).default(0),
  ownershipShare: z.number().positive().max(1, 'Porsi maksimal 1').default(1),
  paymentStatus: z.enum(['LUNAS', 'DP', 'KURANG_BAYAR', 'BELUM_BAYAR']).default('LUNAS'),
  vendorId: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const createBudgetItemSchema = z.object({
  gardenId: z.number().positive('Kebun wajib dipilih'),
  name: z.string().min(1, 'Nama pos anggaran wajib diisi'),
  categoryId: z.number().positive().optional().nullable(),
  plannedQty: z.number().min(0).default(0),
  unit: z.string().optional().nullable(),
  plannedUnitPrice: z.number().min(0).default(0),
  actualUnitPrice: z.number().min(0).optional().nullable(),
  paymentStatus: z.enum(['LUNAS', 'DP', 'KURANG_BAYAR', 'BELUM_BAYAR']).default('BELUM_BAYAR'),
  notes: z.string().optional().nullable(),
})

export const createAdvanceSchema = z.object({
  employeeId: z.number().positive('Karyawan wajib dipilih'),
  gardenId: z.number().positive().optional().nullable(),
  advanceDate: z.string().min(1, 'Tanggal wajib diisi'),
  amount: z.number().positive('Nominal harus lebih dari 0'),
  type: z.enum(['KASBON', 'TALANGAN']).default('KASBON'),
  beneficiaryId: z.number().positive().optional().nullable(),
  description: z.string().optional().nullable(),
})

export const createPayrollPeriodSchema = z.object({
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal akhir wajib diisi'),
  notes: z.string().optional().nullable(),
})

export const createPayrollPaymentSchema = z.object({
  periodId: z.number().positive('Periode wajib dipilih'),
  batchNo: z.number().int().min(1).default(1),
  paidDate: z.string().min(1, 'Tanggal bayar wajib diisi'),
  amount: z.number().positive('Nominal harus lebih dari 0'),
  sourceAccountId: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const createUserSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  fullName: z.string().min(1, 'Nama wajib diisi'),
  role: z.enum(['OWNER', 'MANAGER', 'STAFF'], {
    errorMap: () => ({ message: 'Role tidak valid' }),
  }),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
})
