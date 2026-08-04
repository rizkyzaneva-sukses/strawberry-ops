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
  gender: string | null
  employmentType: string
  wageNgabedug: number
  wageNyore: number
  wageLemburPerHour: number
  monthlySalary: number
  isGroup: boolean
  notes: string | null
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
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formGender, setFormGender] = useState('')
  const [formEmploymentType, setFormEmploymentType] = useState('HARIAN')
  const [formWageNgabedug, setFormWageNgabedug] = useState('')
  const [formWageNyore, setFormWageNyore] = useState('')
  const [formWageLembur, setFormWageLembur] = useState('')
  const [formMonthlySalary, setFormMonthlySalary] = useState('')
  const [formIsGroup, setFormIsGroup] = useState(false)
  const [formNotes, setFormNotes] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formStatus, setFormStatus] = useState('ACTIVE')
  const [formError, setFormError] = useState('')

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page), limit: '20', sortBy, sortOrder, search,
      ...(filterStatus && { status: filterStatus }),
    })
    const res = await fetch(`/api/employees?${params}`)
    const data = await res.json()
    setEmployees(data.items || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, sortBy, sortOrder, search, filterStatus])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  function handleSort(key: string) {
    if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortOrder('asc') }
  }

  function openForm(record?: Employee) {
    setFormError('')
    if (record) {
      setEditId(record.id)
      setFormName(record.fullName)
      setFormPhone(record.phone || '')
      setFormAddress(record.address || '')
      setFormGender(record.gender || '')
      setFormEmploymentType(record.employmentType)
      setFormWageNgabedug(String(record.wageNgabedug))
      setFormWageNyore(String(record.wageNyore))
      setFormWageLembur(String(record.wageLemburPerHour))
      setFormMonthlySalary(String(record.monthlySalary))
      setFormIsGroup(record.isGroup)
      setFormNotes(record.notes || '')
      setFormStartDate(record.startDate.split('T')[0])
      setFormStatus(record.status)
    } else {
      setEditId(null)
      setFormName('')
      setFormPhone('')
      setFormAddress('')
      setFormGender('')
      setFormEmploymentType('HARIAN')
      setFormWageNgabedug('')
      setFormWageNyore('')
      setFormWageLembur('')
      setFormMonthlySalary('')
      setFormIsGroup(false)
      setFormNotes('')
      setFormStartDate(new Date().toISOString().split('T')[0])
      setFormStatus('ACTIVE')
    }
    setShowForm(true)
  }

  async function handleSave() {
    if (!formName) return
    setSaving(true)
    setFormError('')
    const body = {
      fullName: formName,
      phone: formPhone || null,
      address: formAddress || null,
      gender: formGender || null,
      employmentType: formEmploymentType,
      wageNgabedug: formWageNgabedug ? parseInt(formWageNgabedug) : 0,
      wageNyore: formWageNyore ? parseInt(formWageNyore) : 0,
      wageLemburPerHour: formWageLembur ? parseInt(formWageLembur) : 0,
      monthlySalary: formMonthlySalary ? parseInt(formMonthlySalary) : 0,
      isGroup: formIsGroup,
      notes: formNotes || null,
      startDate: formStartDate,
      status: formStatus,
    }
    const url = editId ? `/api/employees/${editId}` : '/api/employees'
    const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      setShowForm(false)
      fetchEmployees()
    } else {
      const data = await res.json().catch(() => ({}))
      setFormError(data.error || 'Gagal menyimpan data karyawan')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    await fetch(`/api/employees/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null); setSaving(false); fetchEmployees()
  }

  const columns: Column<Employee>[] = [
    { key: 'fullName', label: 'Nama', sortable: true, render: (r) => (
      <span>
        {r.fullName}
        {r.isGroup && <span className="text-[var(--color-text-muted)] text-xs block">entri kolektif</span>}
      </span>
    )},
    { key: 'employmentType', label: 'Tipe', render: (r) => (
      <span className="badge badge-info">{r.employmentType === 'BULANAN' ? 'Bulanan' : 'Harian'}</span>
    )},
    { key: 'wageNgabedug', label: 'Ngabedug', align: 'right', sortable: true, render: (r) =>
      r.employmentType === 'BULANAN' ? '-' : formatIDR(r.wageNgabedug) },
    { key: 'wageNyore', label: 'Nyore', align: 'right', sortable: true, render: (r) =>
      r.employmentType === 'BULANAN' ? '-' : formatIDR(r.wageNyore) },
    { key: 'wageLemburPerHour', label: 'Lembur/jam', align: 'right', render: (r) =>
      r.wageLemburPerHour ? formatIDR(r.wageLemburPerHour) : '-' },
    { key: 'monthlySalary', label: 'Gaji Bulanan', align: 'right', render: (r) =>
      r.monthlySalary ? formatIDR(r.monthlySalary) : '-' },
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" placeholder="Cari nama..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}>
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>
          <button onClick={() => { setSearch(''); setFilterStatus(''); setPage(1) }} className="btn btn-secondary">Reset</button>
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
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Jenis Kelamin">
              <select value={formGender} onChange={(e) => setFormGender(e.target.value)}>
                <option value="">Tidak diisi</option>
                <option value="P">Perempuan</option>
                <option value="L">Laki-laki</option>
              </select>
            </FormField>
            <FormField label="Tipe Penggajian" required>
              <select value={formEmploymentType} onChange={(e) => setFormEmploymentType(e.target.value)}>
                <option value="HARIAN">Harian (per shift)</option>
                <option value="BULANAN">Bulanan (gaji tetap)</option>
              </select>
            </FormField>
          </div>

          {formEmploymentType === 'BULANAN' ? (
            <FormField label="Gaji Bulanan (Rp)" required>
              <input type="number" value={formMonthlySalary} onChange={(e) => setFormMonthlySalary(e.target.value)} placeholder="0" min="0" />
            </FormField>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Ngabedug (Rp)" required>
                <input type="number" value={formWageNgabedug} onChange={(e) => setFormWageNgabedug(e.target.value)} placeholder="0" min="0" />
              </FormField>
              <FormField label="Nyore (Rp)" required>
                <input type="number" value={formWageNyore} onChange={(e) => setFormWageNyore(e.target.value)} placeholder="0" min="0" />
              </FormField>
              <FormField label="Lembur (Rp/jam)">
                <input type="number" value={formWageLembur} onChange={(e) => setFormWageLembur(e.target.value)} placeholder="0" min="0" />
              </FormField>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={formIsGroup} onChange={(e) => setFormIsGroup(e.target.checked)} className="w-4 h-4" />
            <span>Entri kolektif (dipakai untuk mencatat beberapa orang sekaligus)</span>
          </label>

          <FormField label="Catatan">
            <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} placeholder="Tugas utama, dll" />
          </FormField>

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

          {formError && <p className="text-sm text-[var(--color-accent)]">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving || !formName} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Hapus Karyawan" message="Apakah Anda yakin ingin menghapus data karyawan ini? Data akan dihapus secara soft delete." loading={saving} />
    </div>
  )
}
