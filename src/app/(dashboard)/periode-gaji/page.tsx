'use client'

import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import StatCard from '@/components/ui/StatCard'
import { formatIDR, formatDate } from '@/lib/utils'

interface Period {
  id: number
  startDate: string
  endDate: string
  status: string
  totalWage: number
  totalPaid: number
  outstanding: number
  payments: Payment[]
  _count: { records: number }
}

interface Payment {
  id: number
  batchNo: number
  paidDate: string
  amount: number
  notes: string | null
}

interface RecapLine {
  employeeId: number
  employeeName: string
  gender: string | null
  employmentType: string
  perGarden: Record<number, number>
  wage: number
  advance: number
  net: number
  days: number
}

interface Recap {
  period: Period
  lines: RecapLine[]
  gardens: Array<{ id: number; name: string }>
  summary: {
    totalWage: number
    totalAdvance: number
    totalNet: number
    totalPaid: number
    outstanding: number
    perempuan: number
    lakiLaki: number
    perGarden: Array<{ gardenId: number; gardenName: string; amount: number }>
    recordCount: number
    includesMonthlySalary: boolean
  }
}

/** Senin di minggu yang sama dengan tanggal acuan. */
function mondayOf(date: Date) {
  const result = new Date(date)
  const offset = (result.getDay() + 6) % 7
  result.setDate(result.getDate() - offset)
  return result.toISOString().split('T')[0]
}

function addDays(isoDate: string, days: number) {
  const result = new Date(isoDate)
  result.setDate(result.getDate() + days)
  return result.toISOString().split('T')[0]
}

export default function PeriodeGajiPage() {
  const [periods, setPeriods] = useState<Period[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [recap, setRecap] = useState<Recap | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingRecap, setLoadingRecap] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState('')
  const [payNotes, setPayNotes] = useState('')

  const fetchPeriods = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/payroll-periods')
    const data = await res.json()
    const items: Period[] = data.items || []
    setPeriods(items)
    setSelectedId((current) => current ?? items[0]?.id ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchPeriods() }, [fetchPeriods])

  const fetchRecap = useCallback(async () => {
    if (!selectedId) {
      setRecap(null)
      return
    }
    setLoadingRecap(true)
    const res = await fetch(`/api/payroll-periods/${selectedId}`)
    setRecap(res.ok ? await res.json() : null)
    setLoadingRecap(false)
  }, [selectedId])

  useEffect(() => { fetchRecap() }, [fetchRecap])

  function openForm() {
    setFormError('')
    const monday = mondayOf(new Date())
    setFormStart(monday)
    setFormEnd(addDays(monday, 6))
    setShowForm(true)
  }

  async function handleCreatePeriod() {
    if (!formStart || !formEnd) return
    setSaving(true)
    setFormError('')

    const res = await fetch('/api/payroll-periods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: formStart, endDate: formEnd }),
    })

    if (res.ok) {
      const created = await res.json()
      setShowForm(false)
      setSelectedId(created.id)
      fetchPeriods()
    } else {
      const data = await res.json().catch(() => ({}))
      setFormError(data.error || 'Gagal membuat periode gaji')
    }
    setSaving(false)
  }

  function openPayment() {
    setFormError('')
    setPayAmount(recap ? String(Math.max(0, recap.summary.outstanding)) : '')
    setPayDate(new Date().toISOString().split('T')[0])
    setPayNotes('')
    setShowPayment(true)
  }

  async function handlePayment() {
    if (!selectedId || !payAmount) return
    setSaving(true)
    setFormError('')

    const res = await fetch(`/api/payroll-periods/${selectedId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseInt(payAmount),
        paidDate: payDate,
        notes: payNotes || null,
      }),
    })

    if (res.ok) {
      setShowPayment(false)
      fetchRecap()
      fetchPeriods()
    } else {
      const data = await res.json().catch(() => ({}))
      setFormError(data.error || 'Gagal mencatat pembayaran')
    }
    setSaving(false)
  }

  const women = recap?.lines.filter((line) => line.gender === 'P') ?? []
  const men = recap?.lines.filter((line) => line.gender !== 'P') ?? []

  function renderGroup(title: string, lines: RecapLine[], subtotal: number) {
    if (lines.length === 0) return null
    return (
      <>
        <tr>
          <td colSpan={4 + (recap?.gardens.length ?? 0)} className="font-semibold pt-4">
            {title}
          </td>
        </tr>
        {lines.map((line) => (
          <tr key={line.employeeId}>
            <td>
              {line.employeeName}
              {line.employmentType === 'BULANAN' && (
                <span className="text-[var(--color-text-muted)] text-xs block">gaji bulanan</span>
              )}
            </td>
            <td className="text-right">{line.days || '-'}</td>
            {recap?.gardens.map((garden) => (
              <td key={garden.id} className="text-right text-[var(--color-text-muted)]">
                {line.perGarden[garden.id] ? formatIDR(line.perGarden[garden.id]) : '-'}
              </td>
            ))}
            <td className="text-right">
              {line.advance ? (
                <span className="text-[var(--color-accent)]">-{formatIDR(line.advance)}</span>
              ) : (
                '-'
              )}
            </td>
            <td className="text-right font-semibold">{formatIDR(line.net)}</td>
          </tr>
        ))}
        <tr className="border-t border-[var(--color-border)]">
          <td colSpan={2 + (recap?.gardens.length ?? 0) + 1} className="text-right font-medium">
            Subtotal {title}
          </td>
          <td className="text-right font-bold text-[var(--color-primary)]">{formatIDR(subtotal)}</td>
        </tr>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Periode Gaji</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Rekap mingguan Senin–Minggu, kasbon jadi pengurang, pembayaran bisa bertahap
          </p>
        </div>
        <button onClick={openForm} className="btn btn-primary">+ Periode Baru</button>
      </div>

      <div className="card">
        <FormField label="Pilih Periode">
          <select
            value={selectedId ?? ''}
            onChange={(e) => setSelectedId(e.target.value ? parseInt(e.target.value) : null)}
            disabled={loading}
          >
            {periods.length === 0 && <option value="">Belum ada periode</option>}
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {formatDate(period.startDate)} – {formatDate(period.endDate)}
                {period.status === 'PAID' ? ' (lunas)' : ''}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {loadingRecap && <div className="card text-[var(--color-text-muted)]">Memuat rekap...</div>}

      {!loadingRecap && recap && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Upah" value={recap.summary.totalWage} icon="💰" />
            <StatCard label="Potongan Kasbon" value={recap.summary.totalAdvance} icon="🤝" />
            <StatCard label="Harus Dibayar" value={recap.summary.totalNet} icon="📋" />
            <StatCard label="Sisa Belum Dibayar" value={recap.summary.outstanding} icon="⏳" />
          </div>

          {recap.summary.includesMonthlySalary && (
            <div className="card text-sm text-[var(--color-text-muted)]">
              ℹ️ Periode ini adalah batch terakhir bulan berjalan, jadi gaji karyawan bulanan ikut dihitung.
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Rekap per Pekerja</h2>
              <span className="text-sm text-[var(--color-text-muted)]">
                {recap.summary.recordCount} baris gaji
              </span>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nama Pekerja</th>
                    <th className="text-right">Hari</th>
                    {recap.gardens.map((garden) => (
                      <th key={garden.id} className="text-right">{garden.name}</th>
                    ))}
                    <th className="text-right">Kasbon</th>
                    <th className="text-right">Total Bayaran</th>
                  </tr>
                </thead>
                <tbody>
                  {recap.lines.length === 0 && (
                    <tr>
                      <td colSpan={4 + recap.gardens.length} className="text-center py-8 text-[var(--color-text-muted)]">
                        Belum ada catatan gaji di periode ini
                      </td>
                    </tr>
                  )}
                  {renderGroup('Pekerja Perempuan', women, recap.summary.perempuan)}
                  {renderGroup('Pekerja Laki-laki', men, recap.summary.lakiLaki)}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-wrap gap-4 text-sm">
              {recap.summary.perGarden.map((garden) => (
                <span key={garden.gardenId}>
                  {garden.gardenName}: <span className="font-medium">{formatIDR(garden.amount)}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Pembayaran</h2>
              <button onClick={openPayment} className="btn btn-primary">+ Catat Transfer</button>
            </div>

            {recap.period.payments.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">Belum ada pembayaran dicatat</p>
            ) : (
              <div className="space-y-2">
                {recap.period.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between text-sm">
                    <span>
                      Batch {payment.batchNo} · {formatDate(payment.paidDate)}
                      {payment.notes && (
                        <span className="text-[var(--color-text-muted)]"> — {payment.notes}</span>
                      )}
                    </span>
                    <span className="font-medium">{formatIDR(payment.amount)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
                  <span className="font-medium">Total dibayar</span>
                  <span className="font-bold text-[var(--color-primary)]">
                    {formatIDR(recap.summary.totalPaid)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Periode Gaji Baru">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tanggal Mulai" required>
              <input
                type="date"
                value={formStart}
                onChange={(e) => { setFormStart(e.target.value); setFormEnd(addDays(e.target.value, 6)) }}
              />
            </FormField>
            <FormField label="Tanggal Akhir" required>
              <input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
            </FormField>
          </div>

          <p className="text-sm text-[var(--color-text-muted)]">
            Catatan gaji yang tanggalnya masuk periode ini akan otomatis dikaitkan.
          </p>

          {formError && <p className="text-sm text-[var(--color-accent)]">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleCreatePeriod} disabled={saving || !formStart || !formEnd} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Buat Periode'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Catat Transfer Gaji">
        <div className="space-y-4">
          <FormField label="Nominal (Rp)" required>
            <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} min="0" />
          </FormField>
          <FormField label="Tanggal Transfer" required>
            <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
          </FormField>
          <FormField label="Catatan">
            <input type="text" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Sudah di TF batch 1" />
          </FormField>

          {formError && <p className="text-sm text-[var(--color-accent)]">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowPayment(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handlePayment} disabled={saving || !payAmount || !payDate} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
