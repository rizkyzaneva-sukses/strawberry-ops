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

export function calculateWage(
  wageNgabedug: number,
  wageNyore: number,
  shiftNgabedug: boolean,
  shiftNyore: boolean,
  lemburHours: number
): number {
  const LEMBUR_RATE = 10000 // 10rb per hour
  return (shiftNgabedug ? wageNgabedug : 0) + (shiftNyore ? wageNyore : 0) + Math.round(lemburHours * LEMBUR_RATE)
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
