'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable, { Column } from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField from '@/components/ui/FormField'

interface Vendor {
  id: number
  name: string
  type: string
  bankName: string | null
  accountNumber: string | null
  accountHolder: string | null
  phone: string | null
  isFlagged: boolean
  notes: string | null
  _count: { expenses: number }
}

const TYPES = ['VENDOR', 'MATERIAL', 'JASA', 'PEKERJA', 'LAINNYA']

export default function VendorPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('VENDOR')
  const [formBank, setFormBank] = useState('')
  const [formAccount, setFormAccount] = useState('')
  const [formHolder, setFormHolder] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formFlagged, setFormFlagged] = useState(false)
  const [formNotes, setFormNotes] = useState('')

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page), limit: '20', search,
      ...(flaggedOnly && { flagged: '1' }),
    })
    const res = await fetch(`/api/vendors?${params}`)
    const data = await res.json()
    setVendors(data.items || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, search, flaggedOnly])

  useEffect(() => { fetchVendors() }, [fetchVendors])

  function openForm(vendor?: Vendor) {
    setFormError('')
    if (vendor) {
      setEditId(vendor.id)
      setFormName(vendor.name)
      setFormType(vendor.type)
      setFormBank(vendor.bankName || '')
      setFormAccount(vendor.accountNumber || '')
      setFormHolder(vendor.accountHolder || '')
      setFormPhone(vendor.phone || '')
      setFormFlagged(vendor.isFlagged)
      setFormNotes(vendor.notes || '')
    } else {
      setEditId(null)
      setFormName('')
      setFormType('VENDOR')
      setFormBank('')
      setFormAccount('')
      setFormHolder('')
      setFormPhone('')
      setFormFlagged(false)
      setFormNotes('')
    }
    setShowForm(true)
  }

  async function handleSave() {
    if (!formName) return
    setSaving(true)
    setFormError('')

    const res = await fetch(editId ? `/api/vendors/${editId}` : '/api/vendors', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formName,
        type: formType,
        bankName: formBank || null,
        accountNumber: formAccount || null,
        accountHolder: formHolder || null,
        phone: formPhone || null,
        isFlagged: formFlagged,
        notes: formNotes || null,
      }),
    })

    if (res.ok) {
      setShowForm(false)
      fetchVendors()
    } else {
      const data = await res.json().catch(() => ({}))
      setFormError(data.error || 'Gagal menyimpan data penerima')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    await fetch(`/api/vendors/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null); setSaving(false); fetchVendors()
  }

  const columns: Column<Vendor>[] = [
    {
      key: 'name',
      label: 'Nama',
      render: (r) => (
        <span>
          {r.name}
          {r.isFlagged && <span title={r.notes || 'Ditandai bermasalah'}> ⚠️</span>}
        </span>
      ),
    },
    { key: 'type', label: 'Jenis', render: (r) => <span className="badge badge-info">{r.type}</span> },
    {
      key: 'account',
      label: 'Rekening',
      render: (r) => (r.accountNumber ? `${r.bankName || ''} ${r.accountNumber}`.trim() : '-'),
    },
    { key: 'phone', label: 'Telepon', render: (r) => r.phone || '-' },
    { key: 'expenses', label: 'Transaksi', align: 'right', render: (r) => r._count?.expenses ?? 0 },
    {
      key: 'actions',
      label: 'Aksi',
      align: 'center',
      render: (r) => (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => openForm(r)} className="text-[var(--color-primary)] hover:underline text-sm">Edit</button>
          <button onClick={() => setDeleteId(r.id)} className="text-[var(--color-accent)] hover:underline text-sm">Nonaktifkan</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Penerima &amp; Vendor</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Master penerima dana supaya rekening tujuan tidak lagi diketik bebas
          </p>
        </div>
        <button onClick={() => openForm()} className="btn btn-primary">+ Tambah Penerima</button>
      </div>

      <div className="card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" placeholder="Cari nama / rekening..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          <button onClick={() => { setSearch(''); setFlaggedOnly(false); setPage(1) }} className="btn btn-secondary">Reset</button>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => { setFlaggedOnly(e.target.checked); setPage(1) }} className="w-4 h-4" />
          <span>Hanya penerima bertanda masalah ⚠️</span>
        </label>
      </div>

      <DataTable columns={columns} data={vendors} loading={loading} emptyMessage="Belum ada data penerima" />
      <Pagination page={page} total={total} limit={20} onChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Penerima' : 'Tambah Penerima'}>
        <div className="space-y-4">
          <FormField label="Nama" required>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} />
          </FormField>
          <FormField label="Jenis">
            <select value={formType} onChange={(e) => setFormType(e.target.value)}>
              {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Bank">
              <input type="text" value={formBank} onChange={(e) => setFormBank(e.target.value)} placeholder="BCA / BRI" />
            </FormField>
            <FormField label="Nomor Rekening">
              <input type="text" value={formAccount} onChange={(e) => setFormAccount(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Atas Nama">
            <input type="text" value={formHolder} onChange={(e) => setFormHolder(e.target.value)} />
          </FormField>
          <FormField label="Telepon">
            <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
          </FormField>

          <div className="rounded-lg border border-[var(--color-border)] p-3 space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={formFlagged} onChange={(e) => setFormFlagged(e.target.checked)} className="w-4 h-4" />
              <span>Tandai bermasalah</span>
            </label>
            <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} placeholder="Catatan" />
          </div>

          {formError && <p className="text-sm text-[var(--color-accent)]">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving || !formName} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Nonaktifkan Penerima"
        message="Riwayat transaksi tetap tersimpan, penerima hanya disembunyikan dari daftar pilihan."
        loading={saving}
      />
    </div>
  )
}
