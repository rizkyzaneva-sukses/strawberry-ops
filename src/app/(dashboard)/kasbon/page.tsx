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

interface Employee { id: number; fullName: string }

interface Advance {
  id: number
  employeeId: number
  gardenId: number | null
  advanceDate: string
  amount: number
  type: 'KASBON' | 'TALANGAN'
  beneficiaryId: number | null
  description: string | null
  settledAmount: number
  status: string
  employee: Employee
  beneficiary: Employee | null
  garden: { id: number; name: string } | null
}

export default function KasbonPage() {
  const { gardens, activeGarden } = useGarden()

  const [advances, setAdvances] = useState<Advance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [totals, setTotals] = useState({ amount: 0, settled: 0, outstanding: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [formEmployee, setFormEmployee] = useState('')
  const [formGardenId, setFormGardenId] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formType, setFormType] = useState<'KASBON' | 'TALANGAN'>('KASBON')
  const [formBeneficiary, setFormBeneficiary] = useState('')
  const [formSettled, setFormSettled] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const fetchAdvances = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page), limit: '20', search,
      ...(filterStatus && { status: filterStatus }),
    })
    const res = await fetch(`/api/employee-advances?${params}`)
    const data = await res.json()
    setAdvances(data.items || [])
    setTotal(data.total || 0)
    setTotals(data.totals || { amount: 0, settled: 0, outstanding: 0 })
    setLoading(false)
  }, [page, search, filterStatus])

  useEffect(() => { fetchAdvances() }, [fetchAdvances])

  useEffect(() => {
    fetch('/api/employees?limit=100&status=ACTIVE')
      .then((r) => r.json())
      .then((data) => setEmployees(data.items || []))
  }, [])

  function openForm(advance?: Advance) {
    setFormError('')
    if (advance) {
      setEditId(advance.id)
      setFormEmployee(String(advance.employeeId))
      setFormGardenId(advance.gardenId ? String(advance.gardenId) : '')
      setFormDate(advance.advanceDate.split('T')[0])
      setFormAmount(String(advance.amount))
      setFormType(advance.type)
      setFormBeneficiary(advance.beneficiaryId ? String(advance.beneficiaryId) : '')
      setFormSettled(String(advance.settledAmount))
      setFormDescription(advance.description || '')
    } else {
      setEditId(null)
      setFormEmployee('')
      setFormGardenId(activeGarden ? String(activeGarden.id) : '')
      setFormDate(new Date().toISOString().split('T')[0])
      setFormAmount('')
      setFormType('KASBON')
      setFormBeneficiary('')
      setFormSettled('')
      setFormDescription('')
    }
    setShowForm(true)
  }

  async function handleSave() {
    if (!formEmployee || !formDate || !formAmount) return
    setSaving(true)
    setFormError('')

    const body = {
      employeeId: parseInt(formEmployee),
      gardenId: formGardenId ? parseInt(formGardenId) : null,
      advanceDate: formDate,
      amount: parseInt(formAmount),
      type: formType,
      beneficiaryId: formBeneficiary ? parseInt(formBeneficiary) : null,
      description: formDescription || null,
      ...(editId ? { settledAmount: formSettled ? parseInt(formSettled) : 0 } : {}),
    }

    const res = await fetch(editId ? `/api/employee-advances/${editId}` : '/api/employee-advances', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setShowForm(false)
      fetchAdvances()
    } else {
      const data = await res.json().catch(() => ({}))
      setFormError(data.error || 'Gagal menyimpan kasbon')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    await fetch(`/api/employee-advances/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null); setSaving(false); fetchAdvances()
  }

  const columns: Column<Advance>[] = [
    { key: 'advanceDate', label: 'Tanggal', render: (r) => formatDate(r.advanceDate) },
    {
      key: 'employee',
      label: 'Pekerja',
      render: (r) => (
        <span>
          {r.employee.fullName}
          {r.beneficiary && (
            <span className="text-[var(--color-text-muted)] text-xs block">
              menalangi {r.beneficiary.fullName}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Jenis',
      render: (r) => (
        <span className="badge badge-info">{r.type === 'TALANGAN' ? 'Dana Talangan' : 'Kasbon'}</span>
      ),
    },
    { key: 'description', label: 'Keterangan', render: (r) => r.description || '-' },
    { key: 'amount', label: 'Nominal', align: 'right', render: (r) => formatIDR(r.amount) },
    {
      key: 'outstanding',
      label: 'Sisa',
      align: 'right',
      render: (r) => (
        <span className={r.amount - r.settledAmount > 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-success)]'}>
          {formatIDR(r.amount - r.settledAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={`badge ${r.status === 'SETTLED' ? 'badge-info' : 'badge-warning'}`}>
          {r.status === 'SETTLED' ? 'Lunas' : 'Belum Lunas'}
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
          <h1 className="text-2xl font-bold">Kasbon &amp; Piutang Pekerja</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Sisa kasbon otomatis jadi pengurang di rekap periode gaji
          </p>
        </div>
        <button onClick={() => openForm()} className="btn btn-primary">+ Catat Kasbon</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Kasbon" value={totals.amount} icon="🤝" />
        <StatCard label="Sudah Dipotong" value={totals.settled} icon="✅" />
        <StatCard label="Sisa Piutang" value={totals.outstanding} icon="⚠️" />
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" placeholder="Cari pekerja..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}>
            <option value="">Semua status</option>
            <option value="OPEN">Belum Lunas</option>
            <option value="SETTLED">Lunas</option>
          </select>
          <button onClick={() => { setSearch(''); setFilterStatus(''); setPage(1) }} className="btn btn-secondary">Reset</button>
        </div>
      </div>

      <DataTable columns={columns} data={advances} loading={loading} emptyMessage="Belum ada catatan kasbon" />
      <Pagination page={page} total={total} limit={20} onChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Kasbon' : 'Catat Kasbon'}>
        <div className="space-y-4">
          <FormField label="Pekerja" required>
            <select value={formEmployee} onChange={(e) => setFormEmployee(e.target.value)}>
              <option value="">Pilih pekerja</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.fullName}</option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tanggal" required>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </FormField>
            <FormField label="Nominal (Rp)" required>
              <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} min="0" />
            </FormField>
          </div>

          <FormField label="Jenis">
            <select
              value={formType}
              onChange={(e) => {
                setFormType(e.target.value as 'KASBON' | 'TALANGAN')
                if (e.target.value === 'KASBON') setFormBeneficiary('')
              }}
            >
              <option value="KASBON">Kasbon (pinjaman sendiri)</option>
              <option value="TALANGAN">Dana Talangan (untuk pekerja lain)</option>
            </select>
          </FormField>

          {formType === 'TALANGAN' && (
            <FormField label="Ditalangi Untuk" required>
              <select value={formBeneficiary} onChange={(e) => setFormBeneficiary(e.target.value)}>
                <option value="">Pilih pekerja</option>
                {employees
                  .filter((employee) => String(employee.id) !== formEmployee)
                  .map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                  ))}
              </select>
            </FormField>
          )}

          <FormField label="Kebun">
            <select value={formGardenId} onChange={(e) => setFormGardenId(e.target.value)}>
              <option value="">Tidak spesifik</option>
              {gardens.map((garden) => <option key={garden.id} value={garden.id}>{garden.name}</option>)}
            </select>
          </FormField>

          {editId && (
            <FormField label="Sudah Dipotong (Rp)">
              <input type="number" value={formSettled} onChange={(e) => setFormSettled(e.target.value)} min="0" />
            </FormField>
          )}

          <FormField label="Keterangan">
            <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} />
          </FormField>

          {formError && <p className="text-sm text-[var(--color-accent)]">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving || !formEmployee || !formDate || !formAmount} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Kasbon"
        message="Apakah Anda yakin ingin menghapus catatan kasbon ini?"
        loading={saving}
      />
    </div>
  )
}
