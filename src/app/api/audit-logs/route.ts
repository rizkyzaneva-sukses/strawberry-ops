import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, parseSearchParams, jsonResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const { user, error } = await requireRole('OWNER')
  if (error) return error

  const { page, limit, startDate, endDate } = parseSearchParams(request.url)

  const where: any = {}
  if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
  if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, username: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return jsonResponse({ items, total, page, limit })
}
