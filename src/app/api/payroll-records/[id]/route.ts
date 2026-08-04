import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { calculateShiftWage } from '@/lib/utils'
import { logAudit } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const record = await prisma.payrollRecord.findFirst({
    where: { id: parseInt(id), deletedAt: null },
    include: {
      employee: true,
      garden: true,
      block: true,
      jobType: true,
      user: { select: { id: true, fullName: true } },
    },
  })

  if (!record) return errorResponse('Catatan gaji tidak ditemukan', 404)
  return jsonResponse(record)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  try {
    const body = await request.json()
    const {
      employeeId, gardenId, blockId, jobTypeId, workDate, shift,
      startTime, endTime, lemburHours, headcount, wageAmount, notes,
    } = body

    const existing = await prisma.payrollRecord.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })
    if (!existing) return errorResponse('Catatan gaji tidak ditemukan', 404)

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId ? parseInt(employeeId) : existing.employeeId },
    })
    if (!employee) return errorResponse('Karyawan tidak ditemukan')

    const nextGardenId = gardenId !== undefined ? parseInt(gardenId) : existing.gardenId
    if (blockId) {
      const block = await prisma.block.findFirst({
        where: { id: parseInt(blockId), gardenId: nextGardenId },
      })
      if (!block) return errorResponse('Blok tidak ada di kebun yang dipilih')
    }

    const nextShift = shift ?? existing.shift
    const nextLembur = lemburHours !== undefined ? parseFloat(lemburHours) : existing.lemburHours
    const nextHeadcount = headcount !== undefined ? parseInt(headcount) : existing.headcount

    const computed = calculateShiftWage(employee, nextShift, nextLembur, nextHeadcount)
    const nextWage = wageAmount !== undefined ? parseInt(wageAmount) : computed

    const record = await prisma.payrollRecord.update({
      where: { id: parseInt(id) },
      data: {
        ...(employeeId !== undefined && { employeeId: parseInt(employeeId) }),
        ...(gardenId !== undefined && { gardenId: nextGardenId }),
        ...(blockId !== undefined && { blockId: blockId ? parseInt(blockId) : null }),
        ...(jobTypeId !== undefined && { jobTypeId: jobTypeId ? parseInt(jobTypeId) : null }),
        ...(workDate !== undefined && { workDate: new Date(workDate) }),
        ...(shift !== undefined && { shift: nextShift }),
        ...(startTime !== undefined && { startTime: startTime || null }),
        ...(endTime !== undefined && { endTime: endTime || null }),
        ...(lemburHours !== undefined && { lemburHours: nextLembur }),
        ...(headcount !== undefined && { headcount: nextHeadcount }),
        wageAmount: nextWage,
        isManualWage: nextWage !== computed,
        ...(notes !== undefined && { notes: notes || null }),
      },
      include: { employee: true, garden: true, jobType: true, block: true },
    })

    const changes: string[] = []
    if (nextWage !== existing.wageAmount) {
      changes.push(`wageAmount: ${existing.wageAmount} -> ${nextWage}`)
    }
    if (nextGardenId !== existing.gardenId) {
      changes.push(`gardenId: ${existing.gardenId} -> ${nextGardenId}`)
    }
    if (nextShift !== existing.shift) changes.push(`shift: ${existing.shift} -> ${nextShift}`)
    logAudit(
      user!.id,
      'UPDATE',
      'PayrollRecord',
      record.id,
      changes.length > 0 ? JSON.stringify(changes) : undefined
    )

    return jsonResponse(record)
  } catch (err) {
    console.error('Update payroll error:', err)
    return errorResponse('Gagal mengupdate catatan gaji')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const existing = await prisma.payrollRecord.findFirst({
    where: { id: parseInt(id), deletedAt: null },
  })
  if (!existing) return errorResponse('Catatan gaji tidak ditemukan', 404)

  await prisma.payrollRecord.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() },
  })

  logAudit(user!.id, 'DELETE', 'PayrollRecord', parseInt(id), 'Soft deleted')
  return jsonResponse({ message: 'Catatan gaji berhasil dihapus' })
}
