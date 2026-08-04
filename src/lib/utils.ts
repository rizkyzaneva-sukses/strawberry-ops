const TIMEZONE = 'Asia/Jakarta'

export function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID').replace(/,/g, '.')}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function toJakartaDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const y = parts.find((p) => p.type === 'year')?.value || '0000'
  const m = parts.find((p) => p.type === 'month')?.value || '00'
  const day = parts.find((p) => p.type === 'day')?.value || '00'
  return `${y}-${m}-${day}`
}

export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const SHIFTS = ['NGABEDUG', 'NYORE', 'LEMBUR', 'BORONGAN'] as const
export type Shift = (typeof SHIFTS)[number]

export const SHIFT_LABELS: Record<Shift, string> = {
  NGABEDUG: 'Ngabedug (07.00 - 12.00)',
  NYORE: 'Nyore (12.00 - 15.00)',
  LEMBUR: 'Lembur',
  BORONGAN: 'Borongan',
}

export type WageRates = {
  wageNgabedug: number
  wageNyore: number
  wageLemburPerHour: number
}

/**
 * Upah satu shift. Tarif lembur diambil per karyawan, bukan angka tetap,
 * karena di lapangan tiap orang berbeda. Shift BORONGAN nominalnya diisi
 * manual sehingga fungsi ini mengembalikan 0.
 */
export function calculateShiftWage(
  rates: WageRates,
  shift: string,
  lemburHours = 0,
  headcount = 1
): number {
  const base =
    shift === 'NGABEDUG' ? rates.wageNgabedug : shift === 'NYORE' ? rates.wageNyore : 0
  const lembur = Math.round(lemburHours * rates.wageLemburPerHour)
  return (base + lembur) * Math.max(1, headcount)
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
