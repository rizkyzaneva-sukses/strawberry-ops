'use client'

import { useState, useEffect } from 'react'
import StatCard from '@/components/ui/StatCard'
import TrendChart from '@/components/charts/TrendChart'
import { formatIDR, formatDate } from '@/lib/utils'

interface DashboardData {
  summary: {
    totalIncome: number
    totalExpenses: number
    profit: number
    employeeCount: number
    harvestCount: number
    expenseCount: number
  }
  totals: {
    payroll: number
    expenses: number
    harvestRevenue: number
    harvestKg: number
  }
  recentHarvests: Array<{
    id: number
    harvestDate: string
    workArea: string | null
    totalHarvestKg: number
    totalRevenue: number
    bsPercentage: number
  }>
  recentExpenses: Array<{
    id: number
    transactionDate: string
    amount: number
    description: string | null
    category: { name: string }
  }>
  monthlyTrend: Array<{
    month: string
    income: number
    expenses: number
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dashboard?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🍓</p>
        <p className="text-lg font-medium">Belum ada data</p>
        <p className="text-sm text-[var(--color-text-muted)]">Mulai input data untuk melihat dashboard</p>
      </div>
    )
  }

  const { summary, totals, recentHarvests, recentExpenses, monthlyTrend } = data
  const marginPct = summary.totalIncome > 0
    ? ((summary.profit / summary.totalIncome) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Ringkasan operasional kebun strawberry</p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { key: 'week', label: '7 Hari' },
            { key: 'month', label: '30 Hari' },
            { key: 'year', label: '1 Tahun' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p.key
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pendapatan" value={summary.totalIncome} icon="💰" />
        <StatCard label="Total Pengeluaran" value={summary.totalExpenses} icon="📤" />
        <div className={`card ${summary.profit >= 0 ? 'border-l-4 border-l-[var(--color-success)]' : 'border-l-4 border-l-[var(--color-accent)]'}`}>
          <p className="text-sm text-[var(--color-text-muted)]">Margin</p>
          <p className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'}`}>
            {formatIDR(summary.profit)}
          </p>
          <p className={`text-xs ${summary.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'}`}>
            {marginPct}%
          </p>
        </div>
        <StatCard label="Karyawan Aktif" value={summary.employeeCount} format="number" icon="👷" />
      </div>

      {/* Detail Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-xs text-[var(--color-text-muted)]">Total Gaji</p>
          <p className="text-lg font-bold">{formatIDR(totals.payroll)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-[var(--color-text-muted)]">Total Panen</p>
          <p className="text-lg font-bold">{totals.harvestKg.toLocaleString('id-ID')} kg</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-[var(--color-text-muted)]">Transaksi Panen</p>
          <p className="text-lg font-bold">{summary.harvestCount}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-[var(--color-text-muted)]">Transaksi Pengeluaran</p>
          <p className="text-lg font-bold">{summary.expenseCount}</p>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Tren Pendapatan vs Pengeluaran</h2>
        <TrendChart data={monthlyTrend} />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Harvests */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">🍓 Panen Terakhir</h2>
          {recentHarvests.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">Belum ada data panen</p>
          ) : (
            <div className="space-y-3">
              {recentHarvests.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-secondary)]">
                  <div>
                    <p className="text-sm font-medium">{formatDate(h.harvestDate)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{h.workArea || '-'} • {h.totalHarvestKg.toLocaleString('id-ID')} kg</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--color-success)]">{formatIDR(h.totalRevenue)}</p>
                    <p className={`text-xs ${h.bsPercentage > 20 ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
                      BS: {h.bsPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">📤 Pengeluaran Terakhir</h2>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">Belum ada data pengeluaran</p>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-secondary)]">
                  <div>
                    <p className="text-sm font-medium">{e.description || e.category.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{formatDate(e.transactionDate)} • {e.category.name}</p>
                  </div>
                  <p className="text-sm font-bold text-[var(--color-accent)]">{formatIDR(e.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
