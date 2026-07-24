import { NextResponse } from 'next/server'
import { getUser } from './session'

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    return { user: null, error: errorResponse('Unauthorized', 401) }
  }
  return { user, error: null }
}

export async function requireRole(...roles: string[]) {
  const { user, error } = await requireAuth()
  if (error) return { user: null, error }
  if (!roles.includes(user!.role)) {
    return { user: null, error: errorResponse('Forbidden', 403) }
  }
  return { user, error: null }
}

const ALLOWED_SORT_FIELDS = new Set([
  'createdAt', 'updatedAt', 'id', 'fullName', 'username',
  'transactionDate', 'amount', 'workDate', 'wageAmount',
  'harvestDate', 'totalRevenue', 'totalHarvestKg', 'bsPercentage',
  'accountName', 'bankName', 'effectiveDate',
])

export function parseSearchParams(url: string) {
  const { searchParams } = new URL(url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
  const search = searchParams.get('search') || ''
  const sortByRaw = searchParams.get('sortBy') || 'createdAt'
  const sortBy = ALLOWED_SORT_FIELDS.has(sortByRaw) ? sortByRaw : 'createdAt'
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  return { page, limit, search, sortBy, sortOrder, startDate, endDate }
}
