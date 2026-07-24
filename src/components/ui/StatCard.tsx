'use client'

import { formatIDR } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  format?: 'idr' | 'number' | 'text' | 'kg'
  icon: string
  color?: string
  trend?: { value: number; positive: boolean }
}

export default function StatCard({ label, value, format = 'idr', icon, color, trend }: StatCardProps) {
  const displayValue = format === 'idr'
    ? formatIDR(value as number)
    : format === 'kg'
    ? `${(value as number).toLocaleString('id-ID')} kg`
    : format === 'number'
    ? (value as number).toLocaleString('id-ID')
    : String(value)

  return (
    <div className="card flex items-start gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: color ? `${color}20` : 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
        <p className="text-xl font-bold mt-1 truncate">{displayValue}</p>
        {trend && (
          <p className={`text-xs mt-1 ${trend.positive ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </p>
        )}
      </div>
    </div>
  )
}
