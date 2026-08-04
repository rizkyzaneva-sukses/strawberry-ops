import { prisma } from './prisma'

/** Nilai parameter gardenId untuk mode konsolidasi semua kebun. */
export const ALL_GARDENS = 'all'

/**
 * Kebun aktif diambil dari query `?gardenId=`. Kosong atau `all` berarti
 * gabungan seluruh kebun.
 */
export function parseGardenParam(url: string): number | null {
  const value = new URL(url).searchParams.get('gardenId')
  if (!value || value === ALL_GARDENS) return null
  const id = parseInt(value)
  return Number.isFinite(id) && id > 0 ? id : null
}

/** Filter Prisma untuk tabel yang punya kolom gardenId langsung. */
export function gardenWhere(url: string) {
  const gardenId = parseGardenParam(url)
  return gardenId ? { gardenId } : {}
}

/**
 * Pengeluaran bisa dipikul dua kebun sekaligus, jadi penyaringannya lewat
 * tabel alokasi - bukan kolom gardenId yang hanya menyimpan kebun utama.
 */
export function expenseGardenWhere(url: string) {
  const gardenId = parseGardenParam(url)
  return gardenId ? { allocations: { some: { gardenId } } } : {}
}

export async function requireGarden(gardenId: number) {
  const garden = await prisma.garden.findFirst({ where: { id: gardenId, isActive: true } })
  return garden
}

/** Porsi biaya sebuah pengeluaran untuk satu kebun. */
export function allocationAmount(
  allocations: Array<{ gardenId: number; amount: number }>,
  gardenId: number | null,
  fallback: number
) {
  if (!gardenId) return fallback
  return allocations.find((allocation) => allocation.gardenId === gardenId)?.amount ?? 0
}
