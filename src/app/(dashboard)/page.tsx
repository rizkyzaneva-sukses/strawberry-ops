'use client'

import { useState, useEffect } from 'react'
import StatCard from '@/components/ui/StatCard'
import TrendChart from '@/components/charts/TrendChart'
import { useGarden } from '@/components/GardenProvider'
import { formatIDR, formatDate } from '@/lib/utils'

interface DashboardData {
  summary: {
    totalIncome: number
    totalExpenses: number
    profit: number
    employeeCount: number
    harvestCount: number
    harvestKg: number
    bsPercentage: number
    flaggedExpenses: number
    openAdvances: number
  }
  cashflow: {
    equity: number
    loan: number
    loanRepaid: number
    loanOutstanding: number
    cashIn: number
    cashOut: number
    balance: number
  } | null
  budget: { planned: number; actual: number; variance: number } | null
  totals: {
    payroll: number
    expenses: number
    harvestRevenue: number
    harvestKg: number
  }
  perGarden: Array<{
    gardenId: number
    gardenName: string
    hasInvestor: boolean
    income: number
    expenses: number
    profit: number
    harvestKg: number
  }>
  recentHarvests: Array<{
    id: number
    harvestDate: string
    totalHarvestKg: number
    totalRevenue: number
    bsPercentage: number
    garden: { name: string } | null
  }>
  recentExpenses: Array<{
    id: number
    transactionDate: string
    amount: number
    description: string | null
    category: { name: string }
    garden: { name: string } | null
  }>
  monthlyTrend: Array<{
    month: string
    income: number
    expenses: number
    profit: number
  }>
}

const PERIODS = [
  { key: 'week', label: '7 Hari' },
  { key: 'month', label: 'Bulan Ini' },
  { key: 'year', label: '1 Tahun' },
  { key: 'all', label: 'Semua' },
]

export default function DashboardPage() {
  const { activeGarden, selection } = useGarden()
  const [data, setData] = useState<DashboardData | null>(null)
  const [period, setPeriod] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dashboard?period=${period}&gardenId=${selection}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period, selection])

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

  const { summary, cashflow, budget, totals, perGarden, recentHarvests, recentExpenses, monthlyTrend } = data
  const marginPct = summary.totalIncome > 0
    ? ((summary.profit / summary.totalIncome) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {activeGarden ? activeGarden.name : 'Gabungan seluruh kebun'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriod(item.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === item.key
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pendapatan Panen" value={summary.totalIncome} icon="💰" />
        <StatCard label="Biaya Operasional" value={summary.totalExpenses} icon="📤" />
        <div className={`card ${summary.profit >= 0 ? 'border-l-4 border-l-[var(--color-success)]' : 'border-l-4 border-l-[var(--color-accent)]'}`}>
          <p className="text-sm text-[var(--color-text-muted)]">Laba / Rugi</p>
          <p className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'}`}>
            {formatIDR(summary.profit)}
          </p>
          <p className={`text-xs ${summary.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'}`}>
            {marginPct}% dari pendapatan
          </p>
        </div>
        <StatCard label="Karyawan Aktif" value={summary.employeeCount} format="number" icon="👷" />
      </div>

      {cashflow && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">🏦 Posisi Kas &amp; Modal</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Modal Penyertaan</p>
              <p className="text-lg font-bold">{formatIDR(cashflow.equity)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Modal Kasbon</p>
              <p className="text-lg font-bold">{formatIDR(cashflow.loan)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Sisa Utang</p>
              <p className={`text-lg font-bold ${cashflow.loanOutstanding > 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-success)]'}`}>
                {formatIDR(cashflow.loanOutstanding)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Kas Keluar</p>
              <p className="text-lg font-bold">{formatIDR(cashflow.cashOut)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Saldo Kas</p>
              <p className={`text-lg font-bold ${cashflow.balance >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'}`}>
                {formatIDR(cashflow.balance)}
              </p>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-3">
            Saldo kas = dana masuk − kas keluar + pendapatan panen. Talangan operasional harian
            dihitung di kas keluar, tapi tidak di biaya operasional agar tidak dobel.
          </p>
        </div>
      )}

      {perGarden.length > 1 && !activeGarden && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">🌱 Perbandingan Kebun</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Kebun</th>
                  <th className="text-right">Panen (kg)</th>
                  <th className="text-right">Pendapatan</th>
                  <th className="text-right">Biaya</th>
                  <th className="text-right">Laba / Rugi</th>
                </tr>
              </thead>
              <tbody>
                {perGarden.map((garden) => (
                  <tr key={garden.gardenId}>
                    <td>
                      {garden.gardenName}
                      {garden.hasInvestor && (
                        <span className="text-[var(--color-text-muted)] text-xs block">dengan investor</span>
                      )}
                    </td>
                    <td className="text-right">{garden.harvestKg.toLocaleString('id-ID')}</td>
                    <td className="text-right">{formatIDR(garden.income)}</td>
                    <td className="text-right">{formatIDR(garden.expenses)}</td>
                    <td className={`text-right font-semibold ${garden.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'}`}>
                      {formatIDR(garden.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-xs text-[var(--color-text-muted)]">Total Gaji</p>
          <p className="text-lg font-bold">{formatIDR(totals.payroll)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-[var(--color-text-muted)]">Total Panen</p>
          <p className="text-lg font-bold">{summary.harvestKg.toLocaleString('id-ID')} kg</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-[var(--color-text-muted)]">Rata-rata BS</p>
          <p className={`text-lg font-bold ${summary.bsPercentage > 20 ? 'text-[var(--color-accent)]' : 'text-[var(--color-success)]'}`}>
            {summary.bsPercentage.toFixed(1)}%
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-[var(--color-text-muted)]">Sisa Kasbon</p>
          <p className="text-lg font-bold">{formatIDR(summary.openAdvances)}</p>
        </div>
      </div>

      {(summary.flaggedExpenses > 0 || budget) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {summary.flaggedExpenses > 0 && (
            <a href="/pengeluaran" className="card border-l-4 border-l-[var(--color-accent)] block">
              <p className="text-sm font-medium">⚠️ {summary.flaggedExpenses} transaksi bertanda masalah</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Klik untuk meninjau di halaman Pengeluaran
              </p>
            </a>
          )}
          {budget && (
            <a href="/anggaran" className="card block">
              <p className="text-sm font-medium">🎯 Anggaran vs Realisasi</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Anggaran {formatIDR(budget.planned)} · Realisasi {formatIDR(budget.actual)} ·{' '}
                <span className={budget.variance >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'}>
                  {budget.variance >= 0 ? 'hemat' : 'boros'} {formatIDR(Math.abs(budget.variance))}
                </span>
              </p>
            </a>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Tren Pendapatan vs Pengeluaran</h2>
        <TrendChart data={monthlyTrend} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">🍓 Panen Terakhir</h2>
          {recentHarvests.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">Belum ada data panen</p>
          ) : (
            <div className="space-y-3">
              {recentHarvests.map((harvest) => (
                <div key={harvest.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-secondary)]">
                  <div>
                    <p className="text-sm font-medium">{formatDate(harvest.harvestDate)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {harvest.garden?.name || '-'} • {harvest.totalHarvestKg.toLocaleString('id-ID')} kg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--color-success)]">{formatIDR(harvest.totalRevenue)}</p>
                    <p className={`text-xs ${harvest.bsPercentage > 20 ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
                      BS: {harvest.bsPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">📤 Pengeluaran Terakhir</h2>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">Belum ada data pengeluaran</p>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-secondary)]">
                  <div>
                    <p className="text-sm font-medium">{expense.description || expense.category.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatDate(expense.transactionDate)} • {expense.category.name}
                      {expense.garden && ` • ${expense.garden.name}`}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[var(--color-accent)]">{formatIDR(expense.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
