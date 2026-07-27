import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { logAudit } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const employee = await prisma.employee.findFirst({
    where: { id: parseInt(id), deletedAt: null },
  })

  if (!employee) {
    return errorResponse('Karyawan tidak ditemukan', 404)
  }

  return jsonResponse(employee)
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
    const { fullName, phone, address, wageNgabedug, wageNyore, startDate, status } = body

    const existing = await prisma.employee.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })
    if (!existing) {
      return errorResponse('Karyawan tidak ditemukan', 404)
    }

    const employee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(address !== undefined && { address: address || null }),
        ...(wageNgabedug !== undefined && { wageNgabedug: parseInt(wageNgabedug) }),
        ...(wageNyore !== undefined && { wageNyore: parseInt(wageNyore) }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(status !== undefined && { status }),
      },
    })

    const changes: string[] = []
    if (fullName !== undefined && fullName !== existing.fullName) changes.push(`fullName: ${existing.fullName} -> ${fullName}`)
    if (wageNgabedug !== undefined && parseInt(wageNgabedug) !== existing.wageNgabedug) changes.push(`wageNgabedug: ${existing.wageNgabedug} -> ${wageNgabedug}`)
    if (wageNyore !== undefined && parseInt(wageNyore) !== existing.wageNyore) changes.push(`wageNyore: ${existing.wageNyore} -> ${wageNyore}`)
    if (status !== undefined && status !== existing.status) changes.push(`status: ${existing.status} -> ${status}`)
    logAudit(user!.id, 'UPDATE', 'Employee', employee.id, changes.length > 0 ? JSON.stringify(changes) : undefined)

    return jsonResponse(employee)
  } catch (err) {
    console.error('Update employee error:', err)
    return errorResponse('Gagal mengupdate data karyawan')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const existing = await prisma.employee.findFirst({
    where: { id: parseInt(id), deletedAt: null },
  })
  if (!existing) {
    return errorResponse('Karyawan tidak ditemukan', 404)
  }

  await prisma.employee.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() },
  })

  logAudit(user!.id, 'DELETE', 'Employee', parseInt(id), 'Soft deleted')
  return jsonResponse({ message: 'Karyawan berhasil dihapus' })
}
