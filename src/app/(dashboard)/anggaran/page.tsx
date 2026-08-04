'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable, { Column } from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField from '@/components/ui/FormField'
import StatCard from '@/components/ui/StatCard'
import ExportButton from '@/components/ui/ExportButton'
import { useGarden } from '@/components/GardenProvider'
import { formatIDR } from '@/lib/utils'

interface BudgetItem {
  id: number
  gardenId: number
  name: string
  plannedQty: number
  unit: string | null
  plannedUnitPrice: number
  plannedTotal: number
  actualUnitPrice: number | null
  actualTotal: number | null
  variance: number | null
  paymentStatus: string
  notes: string | null
  garden: { id: number; name: string }
}

const PAYMENT_STATUSES = [
  { value: 'BELUM_BAYAR', label: 'Belum Bayar' },
  { value: 'DP', label: 'DP / Uang Muka' },
  { value: 'KURANG_BAYAR', label: 'Kurang Bayar' },
  { value: 'LUNAS', label: 'Lunas' },
]

export default function AnggaranPage() {
  const { gardens, activeGarden, selection } = useGarden()

  const [items, setItems] = useState<BudgetItem[]>([])
  const [totals, setTotals] = useState({ planned: 0, actual: 0, variance: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [formGardenId, setFormGardenId] = useState('')
  const [formName, setFormName] = useState('')
  const [formQty, setFormQty] = useState('')
  const [formUnit, setFormUnit] = useState('')
  const [formPlannedPrice, setFormPlannedPrice] = useState('')
  const [formActualPrice, setFormActualPrice] = useState('')
  const [formStatus, setFormStatus] = useState('BELUM_BAYAR')
  const [formNotes, setFormNotes] = useState('')

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/budget-items?gardenId=${selection}`)
    const data = await res.json()
    setItems(data.items || [])
    setTotals(data.totals || { planned: 0, actual: 0, variance: 0 })
    setLoading(false)
  }, [selection])

  useEffect(() => { fetchItems() }, [fetchItems])

  function openForm(item?: BudgetItem) {
    setFormError('')
    if (item) {
      setEditId(item.id)
      setFormGardenId(String(item.gardenId))
      setFormName(item.name)
      setFormQty(String(item.plannedQty))
      setFormUnit(item.unit || '')
      setFormPlannedPrice(String(item.plannedUnitPrice))
      setFormActualPrice(item.actualUnitPrice !== null ? String(item.actualUnitPrice) : '')
      setFormStatus(item.paymentStatus)
      setFormNotes(item.notes || '')
    } else {
      setEditId(null)
      setFormGardenId(activeGarden ? String(activeGarden.id) : '')
      setFormName('')
      setFormQty('')
      setFormUnit('')
      setFormPlannedPrice('')
      setFormActualPrice('')
      setFormStatus('BELUM_BAYAR')
      setFormNotes('')
    }
    setShowForm(true)
  }

  const qty = parseFloat(formQty) || 0
  const plannedPrice = parseInt(formPlannedPrice) || 0
  const actualPrice = formActualPrice === '' ? null : parseInt(formActualPrice) || 0
  const previewPlanned = Math.round(qty * plannedPrice)
  const previewActual = actualPrice === null ? null : Math.round(qty * actualPrice)
  const previewVariance = actualPrice === null ? null : Math.round(qty * (plannedPrice - actualPrice))

  async function handleSave() {
    if (!formGardenId || !formName) return
    setSaving(true)
    setFormError('')

    const body = {
      gardenId: parseInt(formGardenId),
      name: formName,
      plannedQty: qty,
      unit: formUnit || null,
      plannedUnitPrice: plannedPrice,
      actualUnitPrice: actualPrice,
      paymentStatus: formStatus,
      notes: formNotes || null,
    }

    const res = await fetch(editId ? `/api/budget-items/${editId}` : '/api/budget-items', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setShowForm(false)
      fetchItems()
    } else {
      const data = await res.json().catch(() => ({}))
      setFormError(data.error || 'Gagal menyimpan pos anggaran')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    await fetch(`/api/budget-items/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null); setSaving(false); fetchItems()
  }

  const columns: Column<BudgetItem>[] = [
    { key: 'name', label: 'Pos Anggaran', render: (r) => r.name },
    { key: 'garden', label: 'Kebun', render: (r) => r.garden.name },
    {
      key: 'plannedQty',
      label: 'Jumlah',
      align: 'right',
      render: (r) => `${r.plannedQty.toLocaleString('id-ID')}${r.unit ? ` ${r.unit}` : ''}`,
    },
    { key: 'plannedUnitPrice', label: 'Harga Anggaran', align: 'right', render: (r) => formatIDR(r.plannedUnitPrice) },
    { key: 'plannedTotal', label: 'Total Anggaran', align: 'right', render: (r) => formatIDR(r.plannedTotal) },
    {
      key: 'actualUnitPrice',
      label: 'Harga Faktual',
      align: 'right',
      render: (r) => (r.actualUnitPrice !== null ? formatIDR(r.actualUnitPrice) : '-'),
    },
    {
      key: 'variance',
      label: 'Selisih',
      align: 'right',
      render: (r) =>
        r.variance === null ? (
          '-'
        ) : (
          <span className={r.variance >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'}>
            {r.variance >= 0 ? 'Hemat ' : 'Boros '}
            {formatIDR(Math.abs(r.variance))}
          </span>
        ),
    },
    {
      key: 'paymentStatus',
      label: 'Status',
      render: (r) => (
        <span className={`badge ${r.paymentStatus === 'LUNAS' ? 'badge-info' : 'badge-warning'}`}>
          {PAYMENT_STATUSES.find((status) => status.value === r.paymentStatus)?.label || r.paymentStatus}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      align: 'center',
      render: (r) => (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => openForm(r)} className="text-[var(--color-primary)] hover:underline text-sm">Edit</button>
          <button onClick={() => setDeleteId(r.id)} className="text-[var(--color-accent)] hover:underline text-sm">Hapus</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Anggaran vs Realisasi</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Bandingkan harga anggaran dengan harga faktual di lapangan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton type="budget" />
          <button onClick={() => openForm()} className="btn btn-primary">+ Pos Anggaran</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Anggaran" value={totals.planned} icon="🎯" />
        <StatCard label="Total Realisasi" value={totals.actual} icon="📊" />
        <StatCard
          label={totals.variance >= 0 ? 'Hemat' : 'Boros'}
          value={Math.abs(totals.variance)}
          icon={totals.variance >= 0 ? '✅' : '⚠️'}
        />
      </div>

      <DataTable columns={columns} data={items} loading={loading} emptyMessage="Belum ada pos anggaran" />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Pos Anggaran' : 'Pos Anggaran Baru'} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kebun" required>
              <select value={formGardenId} onChange={(e) => setFormGardenId(e.target.value)}>
                <option value="">Pilih kebun</option>
                {gardens.map((garden) => <option key={garden.id} value={garden.id}>{garden.name}</option>)}
              </select>
            </FormField>
            <FormField label="Nama Pos" required>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Bibit Stroberi" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Jumlah">
              <input type="number" value={formQty} onChange={(e) => setFormQty(e.target.value)} min="0" step="0.01" />
            </FormField>
            <FormField label="Satuan">
              <input type="text" value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder="batang / karung" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Harga Anggaran / Satuan" required>
              <input type="number" value={formPlannedPrice} onChange={(e) => setFormPlannedPrice(e.target.value)} min="0" />
            </FormField>
            <FormField label="Harga Faktual / Satuan">
              <input
                type="number"
                value={formActualPrice}
                onChange={(e) => setFormActualPrice(e.target.value)}
                min="0"
                placeholder="Kosongkan bila belum diketahui"
              />
            </FormField>
          </div>

          <FormField label="Status Pembayaran">
            <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </FormField>

          {qty > 0 && plannedPrice > 0 && (
            <div className="p-3 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)] space-y-1">
              <p className="text-sm">Total anggaran: <span className="font-medium">{formatIDR(previewPlanned)}</span></p>
              {previewActual !== null && (
                <>
                  <p className="text-sm">Total faktual: <span className="font-medium">{formatIDR(previewActual)}</span></p>
                  <p className={`text-sm font-bold ${(previewVariance || 0) >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'}`}>
                    {(previewVariance || 0) >= 0 ? 'Hemat ' : 'Boros '}
                    {formatIDR(Math.abs(previewVariance || 0))}
                  </p>
                </>
              )}
            </div>
          )}

          <FormField label="Catatan">
            <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />
          </FormField>

          {formError && <p className="text-sm text-[var(--color-accent)]">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving || !formGardenId || !formName} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Pos Anggaran"
        message="Apakah Anda yakin ingin menghapus pos anggaran ini?"
        loading={saving}
      />
    </div>
  )
}
