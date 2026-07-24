'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable, { Column } from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField from '@/components/ui/FormField'
import { formatIDR, formatDate } from '@/lib/utils'

interface Employee {
  id: number
  fullName: string
  phone: string | null
  address: string | null
  wageType: string
  wageRate: number
  minHours: number | null
  startDate: string
  status: string
}

export default function KaryawanPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('fullName')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterWageType, setFilterWageType] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formWageType, setFormWageType] = useState('HARIAN')
  const [formWageRate, setFormWageRate] = useState('')
  const [formMinHours, setFormMinHours] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formStatus, setFormStatus] = useState('ACTIVE')

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page), limit: '20', sortBy, sortOrder, search,
      ...(filterStatus && { status: filterStatus }),
      ...(filterWageType && { wageType: filterWageType }),
    })
    const res = await fetch(`/api/employees?${params}`)
    const data = await res.json()
    setEmployees(data.items || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, sortBy, sortOrder, search, filterStatus, filterWageType])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  function handleSort(key: string) {
    if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortOrder('asc') }
  }

  function openForm(record?: Employee) {
    if (record) {
      setEditId(record.id)
      setFormName(record.fullName)
      setFormPhone(record.phone || '')
      setFormAddress(record.address || '')
      setFormWageType(record.wageType)
      setFormWageRate(String(record.wageRate))
      setFormMinHours(record.minHours ? String(record.minHours) : '')
      setFormStartDate(record.startDate.split('T')[0])
      setFormStatus(record.status)
    } else {
      setEditId(null)
      setFormName('')
      setFormPhone('')
      setFormAddress('')
      setFormWageType('HARIAN')
      setFormWageRate('')
      setFormMinHours('')
      setFormStartDate(new Date().toISOString().split('T')[0])
      setFormStatus('ACTIVE')
    }
    setShowForm(true)
  }

  async function handleSave() {
    if (!formName || !formWageType || !formWageRate) return
    setSaving(true)
    const body = {
      fullName: formName,
      phone: formPhone || null,
      address: formAddress || null,
      wageType: formWageType,
      wageRate: formWageRate,
      minHours: formMinHours || null,
      startDate: formStartDate,
      status: formStatus,
    }
    const url = editId ? `/api/employees/${editId}` : '/api/employees'
    const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { setShowForm(false); fetchEmployees() }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    await fetch(`/api/employees/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null); setSaving(false); fetchEmployees()
  }

  function wageTypeLabel(type: string) {
    const labels: Record<string, string> = { HARIAN: 'Harian', PER_JAM: 'Per Jam', BORONGAN: 'Borongan' }
    return labels[type] || type
  }

  const columns: Column<Employee>[] = [
    { key: 'fullName', label: 'Nama', sortable: true },
    { key: 'phone', label: 'Telepon', render: (r) => r.phone || '-' },
    { key: 'wageType', label: 'Tipe Upah', render: (r) => <span className="badge badge-info">{wageTypeLabel(r.wageType)}</span> },
    { key: 'wageRate', label: 'Tarif Upah', align: 'right', sortable: true, render: (r) => formatIDR(r.wageRate) },
    { key: 'minHours', label: 'Min Jam', align: 'right', render: (r) => r.minHours ? `${r.minHours} jam` : '-' },
    { key: 'startDate', label: 'Mulai Kerja', sortable: true, render: (r) => formatDate(r.startDate) },
    { key: 'status', label: 'Status', align: 'center', render: (r) => (
      <span className={`badge ${r.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
        {r.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
      </span>
    )},
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
          <h1 className="text-2xl font-bold">Database Karyawan</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Kelola data karyawan kebun</p>
        </div>
        <button onClick={() => openForm()} className="btn btn-primary">+ Tambah Karyawan</button>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input type="text" placeholder="Cari nama..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}>
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>
          <select value={filterWageType} onChange={(e) => { setFilterWageType(e.target.value); setPage(1) }}>
            <option value="">Semua Tipe</option>
            <option value="HARIAN">Harian</option>
            <option value="PER_JAM">Per Jam</option>
            <option value="BORONGAN">Borongan</option>
          </select>
          <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterWageType(''); setPage(1) }} className="btn btn-secondary">Reset</button>
        </div>
      </div>

      <DataTable columns={columns} data={employees} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} loading={loading} emptyMessage="Belum ada data karyawan" />
      <Pagination page={page} total={total} limit={20} onChange={setPage} />

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Karyawan' : 'Tambah Karyawan Baru'} maxWidth="max-w-xl">
        <div className="space-y-4">
          <FormField label="Nama Lengkap" required>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nama lengkap karyawan" />
          </FormField>
          <FormField label="Telepon">
            <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
          </FormField>
          <FormField label="Alamat">
            <textarea value={formAddress} onChange={(e) => setFormAddress(e.target.value)} rows={2} placeholder="Alamat karyawan" />
          </FormField>
          <FormField label="Tipe Upah" required>
            <select value={formWageType} onChange={(e) => setFormWageType(e.target.value)}>
              <option value="HARIAN">Harian</option>
              <option value="PER_JAM">Per Jam</option>
              <option value="BORONGAN">Borongan</option>
            </select>
          </FormField>
          <FormField label={`Tarif Upah (Rp)${formWageType === 'HARIAN' ? '/hari' : formWageType === 'PER_JAM' ? '/jam' : '/borongan'}`} required>
            <input type="number" value={formWageRate} onChange={(e) => setFormWageRate(e.target.value)} placeholder="0" min="0" />
          </FormField>
          {formWageType === 'PER_JAM' && (
            <FormField label="Minimum Jam Kerja">
              <input type="number" value={formMinHours} onChange={(e) => setFormMinHours(e.target.value)} placeholder="0" min="0" step="0.5" />
            </FormField>
          )}
          <FormField label="Tanggal Mulai Kerja">
            <input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
          </FormField>
          {editId && (
            <FormField label="Status">
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </FormField>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving || !formName || !formWageRate} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Hapus Karyawan" message="Apakah Anda yakin ingin menghapus data karyawan ini? Data akan dihapus secara soft delete." loading={saving} />
    </div>
  )
}
