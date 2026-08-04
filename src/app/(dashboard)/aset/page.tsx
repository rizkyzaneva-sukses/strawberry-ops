'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable, { Column } from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField from '@/components/ui/FormField'
import StatCard from '@/components/ui/StatCard'
import { useGarden } from '@/components/GardenProvider'
import { formatIDR, formatDate } from '@/lib/utils'

interface Vendor { id: number; name: string }

interface Asset {
  id: number
  gardenId: number | null
  name: string
  category: string | null
  acquiredDate: string | null
  quantity: number
  unitPrice: number
  ownershipShare: number
  totalCost: number
  paymentStatus: string
  vendorId: number | null
  notes: string | null
  garden: { id: number; name: string } | null
  vendor: Vendor | null
}

const CATEGORIES = ['MESIN', 'PERLENGKAPAN', 'BANGUNAN', 'LAINNYA']
const PAYMENT_STATUSES = ['LUNAS', 'DP', 'KURANG_BAYAR', 'BELUM_BAYAR']

export default function AsetPage() {
  const { gardens, activeGarden, selection } = useGarden()

  const [assets, setAssets] = useState<Asset[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [total, setTotal] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [formName, setFormName] = useState('')
  const [formGardenId, setFormGardenId] = useState('')
  const [formShared, setFormShared] = useState(false)
  const [formCategory, setFormCategory] = useState('MESIN')
  const [formDate, setFormDate] = useState('')
  const [formQty, setFormQty] = useState('1')
  const [formUnitPrice, setFormUnitPrice] = useState('')
  const [formShare, setFormShare] = useState('1')
  const [formStatus, setFormStatus] = useState('LUNAS')
  const [formVendor, setFormVendor] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20', search, gardenId: String(selection) })
    const res = await fetch(`/api/assets?${params}`)
    const data = await res.json()
    setAssets(data.items || [])
    setTotal(data.total || 0)
    setTotalCost(data.totals?.totalCost || 0)
    setLoading(false)
  }, [page, search, selection])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  useEffect(() => {
    fetch('/api/vendors?limit=100').then((r) => r.json()).then((data) => setVendors(data.items || []))
  }, [])

  function openForm(asset?: Asset) {
    setFormError('')
    if (asset) {
      setEditId(asset.id)
      setFormName(asset.name)
      setFormGardenId(asset.gardenId ? String(asset.gardenId) : '')
      setFormShared(asset.gardenId === null)
      setFormCategory(asset.category || 'MESIN')
      setFormDate(asset.acquiredDate ? asset.acquiredDate.split('T')[0] : '')
      setFormQty(String(asset.quantity))
      setFormUnitPrice(String(asset.unitPrice))
      setFormShare(String(asset.ownershipShare))
      setFormStatus(asset.paymentStatus)
      setFormVendor(asset.vendorId ? String(asset.vendorId) : '')
      setFormNotes(asset.notes || '')
    } else {
      setEditId(null)
      setFormName('')
      setFormGardenId(activeGarden ? String(activeGarden.id) : '')
      setFormShared(false)
      setFormCategory('MESIN')
      setFormDate(new Date().toISOString().split('T')[0])
      setFormQty('1')
      setFormUnitPrice('')
      setFormShare('1')
      setFormStatus('LUNAS')
      setFormVendor('')
      setFormNotes('')
    }
    setShowForm(true)
  }

  const qty = parseFloat(formQty) || 0
  const unitPrice = parseInt(formUnitPrice) || 0
  const share = parseFloat(formShare) || 1
  const previewCost = Math.round(qty * unitPrice * share)

  async function handleSave() {
    if (!formName || !formUnitPrice) return
    if (share <= 0 || share > 1) {
      setFormError('Porsi kepemilikan harus antara 0 dan 1')
      return
    }
    setSaving(true)
    setFormError('')

    const body = {
      gardenId: formShared ? null : formGardenId ? parseInt(formGardenId) : null,
      name: formName,
      category: formCategory,
      acquiredDate: formDate || null,
      quantity: qty,
      unitPrice,
      ownershipShare: share,
      paymentStatus: formStatus,
      vendorId: formVendor ? parseInt(formVendor) : null,
      notes: formNotes || null,
    }

    const res = await fetch(editId ? `/api/assets/${editId}` : '/api/assets', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setShowForm(false)
      fetchAssets()
    } else {
      const data = await res.json().catch(() => ({}))
      setFormError(data.error || 'Gagal menyimpan data aset')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    await fetch(`/api/assets/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null); setSaving(false); fetchAssets()
  }

  const columns: Column<Asset>[] = [
    { key: 'name', label: 'Nama Aset', render: (r) => r.name },
    { key: 'category', label: 'Kategori', render: (r) => r.category || '-' },
    { key: 'garden', label: 'Kebun', render: (r) => r.garden?.name || 'Patungan' },
    {
      key: 'acquiredDate',
      label: 'Tanggal Beli',
      render: (r) => (r.acquiredDate ? formatDate(r.acquiredDate) : '-'),
    },
    { key: 'unitPrice', label: 'Harga Satuan', align: 'right', render: (r) => formatIDR(r.unitPrice) },
    {
      key: 'ownershipShare',
      label: 'Porsi',
      align: 'right',
      render: (r) => (r.ownershipShare < 1 ? `${(r.ownershipShare * 100).toFixed(0)}%` : '100%'),
    },
    {
      key: 'totalCost',
      label: 'Nilai Dibebankan',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatIDR(r.totalCost)}</span>,
    },
    {
      key: 'paymentStatus',
      label: 'Status',
      render: (r) => (
        <span className={`badge ${r.paymentStatus === 'LUNAS' ? 'badge-info' : 'badge-warning'}`}>
          {r.paymentStatus}
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
          <h1 className="text-2xl font-bold">Aset &amp; Alat</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Alat patungan dibebankan sebesar porsi kepemilikannya
          </p>
        </div>
        <button onClick={() => openForm()} className="btn btn-primary">+ Tambah Aset</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Nilai Aset" value={totalCost} icon="🚜" />
        <StatCard label="Jumlah Aset" value={total} format="number" icon="📦" />
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" placeholder="Cari aset..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          <button onClick={() => { setSearch(''); setPage(1) }} className="btn btn-secondary">Reset</button>
        </div>
      </div>

      <DataTable columns={columns} data={assets} loading={loading} emptyMessage="Belum ada data aset" />
      <Pagination page={page} total={total} limit={20} onChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Aset' : 'Tambah Aset'} maxWidth="max-w-xl">
        <div className="space-y-4">
          <FormField label="Nama Aset" required>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Mesin Water Pump" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kategori">
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </FormField>
            <FormField label="Tanggal Beli">
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </FormField>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={formShared} onChange={(e) => setFormShared(e.target.checked)} className="w-4 h-4" />
              <span>Aset patungan (dipakai lebih dari satu kebun)</span>
            </label>
            {!formShared && (
              <FormField label="Kebun">
                <select value={formGardenId} onChange={(e) => setFormGardenId(e.target.value)}>
                  <option value="">Pilih kebun</option>
                  {gardens.map((garden) => <option key={garden.id} value={garden.id}>{garden.name}</option>)}
                </select>
              </FormField>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Jumlah">
              <input type="number" value={formQty} onChange={(e) => setFormQty(e.target.value)} min="0" step="0.1" />
            </FormField>
            <FormField label="Harga Satuan" required>
              <input type="number" value={formUnitPrice} onChange={(e) => setFormUnitPrice(e.target.value)} min="0" />
            </FormField>
            <FormField label="Porsi Kepemilikan">
              <input
                type="number"
                value={formShare}
                onChange={(e) => setFormShare(e.target.value)}
                min="0.01"
                max="1"
                step="0.05"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Status Pembayaran">
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                {PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </FormField>
            <FormField label="Penjual">
              <select value={formVendor} onChange={(e) => setFormVendor(e.target.value)}>
                <option value="">Tidak disebutkan</option>
                {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
              </select>
            </FormField>
          </div>

          {unitPrice > 0 && (
            <div className="p-3 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-muted)]">
                {qty} × {formatIDR(unitPrice)} × porsi {share}
              </p>
              <p className="text-lg font-bold text-[var(--color-primary)] mt-1">
                Nilai dibebankan: {formatIDR(previewCost)}
              </p>
            </div>
          )}

          <FormField label="Catatan">
            <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />
          </FormField>

          {formError && <p className="text-sm text-[var(--color-accent)]">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving || !formName || !formUnitPrice} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Aset"
        message="Apakah Anda yakin ingin menghapus aset ini?"
        loading={saving}
      />
    </div>
  )
}
