import { z } from 'zod'

export const createEmployeeSchema = z.object({
  fullName: z.string().min(1, 'Nama wajib diisi'),
  wageType: z.enum(['HARIAN', 'PER_JAM', 'BORONGAN'], {
    errorMap: () => ({ message: 'Tipe upah tidak valid' }),
  }),
  wageRate: z.number().positive('Tarif upah harus lebih dari 0'),
  phone: z.string().optional(),
  address: z.string().optional(),
  minHours: z.number().positive().optional(),
  startDate: z.string().optional(),
})

export const createExpenseSchema = z.object({
  transactionDate: z.string().min(1, 'Tanggal transaksi wajib diisi'),
  categoryId: z.number().positive('Kategori wajib diisi'),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  description: z.string().optional(),
  sourceAccountId: z.number().positive().optional(),
  recipientAccount: z.string().optional(),
})

export const createHarvestSchema = z.object({
  harvestDate: z.string().min(1, 'Tanggal panen wajib diisi'),
  normalPricePerKg: z.number().positive('Harga normal harus lebih dari 0'),
  bsPricePerKg: z.number().positive('Harga BS harus lebih dari 0'),
  totalHarvestKg: z.number().positive('Total panen harus lebih dari 0'),
  bsKg: z.number().min(0, 'BS tidak boleh negatif'),
  workArea: z.string().optional(),
  notes: z.string().optional(),
})

export const createPayrollSchema = z.object({
  employeeId: z.number().positive('Karyawan wajib diisi'),
  workDate: z.string().min(1, 'Tanggal kerja wajib diisi'),
  workArea: z.string().optional(),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  notes: z.string().optional(),
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
