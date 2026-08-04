import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, parseSearchParams, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'
import { createEmployeeSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { page, limit, search, sortBy, sortOrder } = parseSearchParams(request.url)
  const params = new URL(request.url).searchParams
  const status = params.get('status') || ''
  const employmentType = params.get('employmentType') || ''

  const where: any = { deletedAt: null }
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { phone: { contains: search } },
    ]
  }
  if (status) where.status = status
  if (employmentType) where.employmentType = employmentType

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.employee.count({ where }),
  ])

  return jsonResponse({ items, total, page, limit })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createEmployeeSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }
    const {
      fullName, phone, address, gender, employmentType,
      wageNgabedug, wageNyore, wageLemburPerHour, monthlySalary,
      isGroup, notes, startDate,
    } = parsed.data

    const employee = await prisma.employee.create({
      data: {
        fullName,
        phone: phone || null,
        address: address || null,
        gender: gender || null,
        employmentType,
        wageNgabedug: wageNgabedug ?? 0,
        wageNyore: wageNyore ?? 0,
        wageLemburPerHour: wageLemburPerHour ?? 0,
        monthlySalary: monthlySalary ?? 0,
        isGroup: Boolean(isGroup),
        notes: notes || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        status: 'ACTIVE',
      },
    })

    logAudit(user!.id, 'CREATE', 'Employee', employee.id)
    return jsonResponse(employee, 201)
  } catch (err) {
    console.error('Create employee error:', err)
    return errorResponse('Gagal membuat data karyawan')
  }
}
