'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatIDR } from '@/lib/utils'

interface TrendChartProps {
  data: { month: string; income: number; expenses: number }[]
  height?: number
}

export default function TrendChart({ data, height = 300 }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-[var(--color-text-muted)]">
        Tidak ada data tren
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="month"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--color-border)' }}
        />
        <YAxis
          tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--color-border)' }}
          tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.5rem',
            color: 'var(--color-text)',
          }}
          formatter={(value: number) => formatIDR(value)}
        />
        <Legend
          wrapperStyle={{ color: 'var(--color-text-muted)', fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="income"
          name="Pendapatan"
          stroke="var(--color-success)"
          strokeWidth={2}
          dot={{ fill: 'var(--color-success)', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          name="Pengeluaran"
          stroke="var(--color-accent)"
          strokeWidth={2}
          dot={{ fill: 'var(--color-accent)', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
