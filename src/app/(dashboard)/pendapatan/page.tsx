'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable, { Column } from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField from '@/components/ui/FormField'
import StatCard from '@/components/ui/StatCard'
import ExportButton from '@/components/ui/ExportButton'
import { formatIDR, formatDate } from '@/lib/utils'

interface HarvestRevenue {
  id: number
  harvestDate: string
  workArea: string | null
  normalPricePerKg: number
  bsPricePerKg: number
  totalHarvestKg: number
  bsKg: number
  normalKg: number
  normalRevenue: number
  bsRevenue: number
  totalRevenue: number
  bsPercentage: number
  notes: string | null
  user: { id: number; fullName: string }
}

export default function PendapatanPage() {
  const [records, setRecords] = useState<HarvestRevenue[]>([])
  const [total, setTotal] = useState(0)
  const [totals, setTotals] = useState({ totalRevenue: 0, normalRevenue: 0, bsRevenue: 0, totalHarvestKg: 0, bsKg: 0, normalKg: 0 })
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('harvestDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formDate, setFormDate] = useState('')
  const [formWorkArea, setFormWorkArea] = useState('')
  const [formNormalPrice, setFormNormalPrice] = useState('')
  const [formBsPrice, setFormBsPrice] = useState('')
  const [formTotalKg, setFormTotalKg] = useState('')
  const [formBsKg, setFormBsKg] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page), limit: '20', sortBy, sortOrder, search, startDate, endDate,
    })
    const res = await fetch(`/api/harvest-revenues?${params}`)
    const data = await res.json()
    setRecords(data.items || [])
    setTotal(data.total || 0)
    setTotals(data.totals || { totalRevenue: 0, normalRevenue: 0, bsRevenue: 0, totalHarvestKg: 0, bsKg: 0, normalKg: 0 })
    setLoading(false)
  }, [page, sortBy, sortOrder, search, startDate, endDate])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  // Load latest commodity prices as defaults
  useEffect(() => {
    fetch('/api/commodity-prices').then(r => r.json()).then(data => {
      if (data.latest) {
        setFormNormalPrice(String(data.latest.normalPricePerKg))
        setFormBsPrice(String(data.latest.bsPricePerKg))
      }
    }).catch(() => {})
  }, [])

  function handleSort(key: string) {
    if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortOrder('desc') }
  }

  function openForm(record?: HarvestRevenue) {
    if (record) {
      setEditId(record.id)
      setFormDate(record.harvestDate.split('T')[0])
      setFormWorkArea(record.workArea || '')
      setFormNormalPrice(String(record.normalPricePerKg))
      setFormBsPrice(String(record.bsPricePerKg))
      setFormTotalKg(String(record.totalHarvestKg))
      setFormBsKg(String(record.bsKg))
      setFormNotes(record.notes || '')
    } else {
      setEditId(null)
      setFormDate(new Date().toISOString().split('T')[0])
      setFormWorkArea('')
      setFormTotalKg('')
      setFormBsKg('0')
      setFormNotes('')
    }
    setShowForm(true)
  }

  async function handleSave() {
    if (!formDate || !formNormalPrice || !formBsPrice || !formTotalKg) return
    setSaving(true)
    const body = {
      harvestDate: formDate,
      workArea: formWorkArea || null,
      normalPricePerKg: formNormalPrice,
      bsPricePerKg: formBsPrice,
      totalHarvestKg: formTotalKg,
      bsKg: formBsKg || '0',
      notes: formNotes || null,
    }
    const url = editId ? `/api/harvest-revenues/${editId}` : '/api/harvest-revenues'
    const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { setShowForm(false); fetchRecords() }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    await fetch(`/api/harvest-revenues/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null); setSaving(false); fetchRecords()
  }

  // Auto-calculation preview
  const previewTotalKg = parseFloat(formTotalKg) || 0
  const previewBsKg = parseFloat(formBsKg) || 0
  const previewNormalKg = previewTotalKg - previewBsKg
  const previewNormalRevenue = Math.round(previewNormalKg * (parseInt(formNormalPrice) || 0))
  const previewBsRevenue = Math.round(previewBsKg * (parseInt(formBsPrice) || 0))
  const previewTotalRevenue = previewNormalRevenue + previewBsRevenue
  const previewBsPct = previewTotalKg > 0 ? ((previewBsKg / previewTotalKg) * 100).toFixed(1) : '0'

  const columns: Column<HarvestRevenue>[] = [
    { key: 'harvestDate', label: 'Tanggal Panen', sortable: true, render: (r) => formatDate(r.harvestDate) },
    { key: 'workArea', label: 'Area', render: (r) => r.workArea || '-' },
    { key: 'totalHarvestKg', label: 'Total (kg)', align: 'right', sortable: true, render: (r) => `${r.totalHarvestKg.toLocaleString('id-ID')} kg` },
    { key: 'normalKg', label: 'Normal (kg)', align: 'right', render: (r) => `${r.normalKg.toLocaleString('id-ID')} kg` },
    { key: 'bsKg', label: 'BS (kg)', align: 'right', render: (r) => `${r.bsKg.toLocaleString('id-ID')} kg` },
    { key: 'bsPercentage', label: 'BS %', align: 'right', render: (r) => (
      <span className={r.bsPercentage > 20 ? 'text-[var(--color-accent)]' : 'text-[var(--color-success)]'}>
        {r.bsPercentage.toFixed(1)}%
      </span>
    )},
    { key: 'totalRevenue', label: 'Total Pendapatan', align: 'right', sortable: true, render: (r) => <span className="font-semibold">{formatIDR(r.totalRevenue)}</span> },
    { key: 'actions', label: 'Aksi', align: 'center', render: (r) => (
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => openForm(r)} className="text-[var(--color-primary)] hover:underline text-sm">Edit</button>
        <button onClick={() => setDeleteId(r.id)} className="text-[var(--color-accent)] hover:underline text-sm">Hapus</button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pendapatan Panen</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Kelola data hasil panen dan pendapatan</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton type="harvest" startDate={startDate} endDate={endDate} />
          <button onClick={() => openForm()} className="btn btn-primary">+ Input Panen</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pendapatan" value={totals.totalRevenue} icon="🍓" />
        <StatCard label="Pendapatan Normal" value={totals.normalRevenue} icon="✅" />
        <StatCard label="Pendapatan BS" value={totals.bsRevenue} icon="⚠️" />
        <StatCard label="Total Panen" value={totals.totalHarvestKg} format="kg" icon="⚖️" />
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input type="text" placeholder="Cari area..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} />
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} />
          <button onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setPage(1) }} className="btn btn-secondary">Reset</button>
        </div>
      </div>

      <DataTable columns={columns} data={records} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} loading={loading} emptyMessage="Belum ada data panen" />
      <Pagination page={page} total={total} limit={20} onChange={setPage} />

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Data Panen' : 'Input Data Panen Baru'} maxWidth="max-w-xl">
        <div className="space-y-4">
          <FormField label="Tanggal Panen" required>
            <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
          </FormField>
          <FormField label="Area Kerja">
            <input type="text" value={formWorkArea} onChange={(e) => setFormWorkArea(e.target.value)} placeholder="Contoh: Blok A" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Harga Normal/kg (Rp)" required>
              <input type="number" value={formNormalPrice} onChange={(e) => setFormNormalPrice(e.target.value)} placeholder="0" min="0" />
            </FormField>
            <FormField label="Harga BS/kg (Rp)" required>
              <input type="number" value={formBsPrice} onChange={(e) => setFormBsPrice(e.target.value)} placeholder="0" min="0" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Total Panen (kg)" required>
              <input type="number" value={formTotalKg} onChange={(e) => setFormTotalKg(e.target.value)} placeholder="0" min="0" step="0.1" />
            </FormField>
            <FormField label="Berat BS (kg)">
              <input type="number" value={formBsKg} onChange={(e) => setFormBsKg(e.target.value)} placeholder="0" min="0" step="0.1" />
            </FormField>
          </div>

          {previewTotalKg > 0 && (
            <div className="p-4 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)] space-y-2">
              <p className="text-sm text-[var(--color-text-muted)]">Preview Perhitungan:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Normal: <span className="font-medium">{previewNormalKg.toLocaleString('id-ID')} kg</span></div>
                <div>BS: <span className="font-medium">{previewBsKg.toLocaleString('id-ID')} kg</span></div>
                <div>Pendapatan Normal: <span className="font-medium">{formatIDR(previewNormalRevenue)}</span></div>
                <div>Pendapatan BS: <span className="font-medium">{formatIDR(previewBsRevenue)}</span></div>
              </div>
              <div className="pt-2 border-t border-[var(--color-border)]">
                <p className="text-lg font-bold text-[var(--color-primary)]">Total: {formatIDR(previewTotalRevenue)}</p>
                <p className={`text-sm ${parseFloat(previewBsPct) > 20 ? 'text-[var(--color-accent)]' : 'text-[var(--color-success)]'}`}>
                  Persentase BS: {previewBsPct}%
                </p>
              </div>
            </div>
          )}

          <FormField label="Catatan">
            <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} placeholder="Catatan tambahan..." />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving || !formDate || !formNormalPrice || !formBsPrice || !formTotalKg} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Hapus Data Panen" message="Apakah Anda yakin ingin menghapus data panen ini?" loading={saving} />
    </div>
  )
}
