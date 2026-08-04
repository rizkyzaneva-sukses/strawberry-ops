import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  try {
    const body = await request.json()
    const existing = await prisma.employeeAdvance.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })
    if (!existing) return errorResponse('Kasbon tidak ditemukan', 404)

    const amount = body.amount !== undefined ? parseInt(body.amount) : existing.amount
    const settledAmount =
      body.settledAmount !== undefined ? parseInt(body.settledAmount) : existing.settledAmount

    if (settledAmount > amount) {
      return errorResponse('Potongan tidak boleh melebihi nominal kasbon')
    }

    const advance = await prisma.employeeAdvance.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.advanceDate !== undefined && { advanceDate: new Date(body.advanceDate) }),
        ...(body.gardenId !== undefined && {
          gardenId: body.gardenId ? parseInt(body.gardenId) : null,
        }),
        amount,
        settledAmount,
        // Status ikut nilai potongan supaya tidak perlu diperbarui manual.
        status: settledAmount >= amount ? 'SETTLED' : 'OPEN',
        ...(body.type !== undefined && { type: body.type }),
        ...(body.periodId !== undefined && {
          periodId: body.periodId ? parseInt(body.periodId) : null,
        }),
        ...(body.description !== undefined && { description: body.description || null }),
      },
      include: { employee: true, beneficiary: true, garden: true, period: true },
    })

    logAudit(user!.id, 'UPDATE', 'EmployeeAdvance', advance.id)
    return jsonResponse(advance)
  } catch (err) {
    console.error('Update advance error:', err)
    return errorResponse('Gagal mengupdate kasbon')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const existing = await prisma.employeeAdvance.findFirst({
    where: { id: parseInt(id), deletedAt: null },
  })
  if (!existing) return errorResponse('Kasbon tidak ditemukan', 404)

  await prisma.employeeAdvance.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() },
  })

  logAudit(user!.id, 'DELETE', 'EmployeeAdvance', parseInt(id), 'Soft deleted')
  return jsonResponse({ message: 'Kasbon berhasil dihapus' })
}
