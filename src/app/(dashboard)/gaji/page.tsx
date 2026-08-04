'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable, { Column } from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField from '@/components/ui/FormField'
import StatCard from '@/components/ui/StatCard'
import ExportButton from '@/components/ui/ExportButton'
import { useGarden } from '@/components/GardenProvider'
import { formatIDR, formatDate, calculateShiftWage, SHIFTS, SHIFT_LABELS, type Shift } from '@/lib/utils'

interface Employee {
  id: number
  fullName: string
  employmentType: string
  isGroup: boolean
  wageNgabedug: number
  wageNyore: number
  wageLemburPerHour: number
}

interface JobType {
  id: number
  name: string
}

interface PayrollRecord {
  id: number
  employeeId: number
  gardenId: number
  blockId: number | null
  jobTypeId: number | null
  workDate: string
  shift: string
  startTime: string | null
  endTime: string | null
  lemburHours: number
  headcount: number
  wageAmount: number
  isManualWage: boolean
  notes: string | null
  employee: Employee
  garden: { id: number; name: string }
  block: { id: number; name: string } | null
  jobType: { id: number; name: string } | null
}

export default function GajiPage() {
  const { gardens, activeGarden, selection, withGarden } = useGarden()

  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [jobTypes, setJobTypes] = useState<JobType[]>([])
  const [total, setTotal] = useState(0)
  const [totals, setTotals] = useState({ totalWage: 0, totalLemburHours: 0 })
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('workDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterJobType, setFilterJobType] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [formEmployeeId, setFormEmployeeId] = useState('')
  const [formGardenId, setFormGardenId] = useState('')
  const [formBlockId, setFormBlockId] = useState('')
  const [formJobTypeId, setFormJobTypeId] = useState('')
  const [formWorkDate, setFormWorkDate] = useState('')
  const [formShift, setFormShift] = useState<Shift>('NGABEDUG')
  const [formStartTime, setFormStartTime] = useState('')
  const [formEndTime, setFormEndTime] = useState('')
  const [formLemburHours, setFormLemburHours] = useState('')
  const [formHeadcount, setFormHeadcount] = useState('1')
  const [formWageOverride, setFormWageOverride] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      sortBy,
      sortOrder,
      search,
      startDate,
      endDate,
      gardenId: String(selection),
    })
    if (filterJobType) params.set('jobTypeId', filterJobType)
    const res = await fetch(`/api/payroll-records?${params}`)
    const data = await res.json()
    setRecords(data.items || [])
    setTotal(data.total || 0)
    setTotals(data.totals || { totalWage: 0, totalLemburHours: 0 })
    setLoading(false)
  }, [page, sortBy, sortOrder, search, startDate, endDate, filterJobType, selection])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  useEffect(() => {
    fetch('/api/employees?limit=100&status=ACTIVE')
      .then((res) => res.json())
      .then((data) => setEmployees(data.items || []))
    fetch('/api/job-types')
      .then((res) => res.json())
      .then((data) => setJobTypes(data.items || []))
  }, [])

  function handleSort(key: string) {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  function openForm(record?: PayrollRecord) {
    setFormError('')
    if (record) {
      setEditId(record.id)
      setFormEmployeeId(String(record.employeeId))
      setFormGardenId(String(record.gardenId))
      setFormBlockId(record.blockId ? String(record.blockId) : '')
      setFormJobTypeId(record.jobTypeId ? String(record.jobTypeId) : '')
      setFormWorkDate(record.workDate.split('T')[0])
      setFormShift(record.shift as Shift)
      setFormStartTime(record.startTime || '')
      setFormEndTime(record.endTime || '')
      setFormLemburHours(record.lemburHours ? String(record.lemburHours) : '')
      setFormHeadcount(String(record.headcount))
      setFormWageOverride(record.isManualWage ? String(record.wageAmount) : '')
      setFormNotes(record.notes || '')
    } else {
      setEditId(null)
      setFormEmployeeId('')
      // Kebun aktif jadi default; mode gabungan menyisakan pilihan kosong.
      setFormGardenId(activeGarden ? String(activeGarden.id) : '')
      setFormBlockId('')
      setFormJobTypeId('')
      setFormWorkDate(new Date().toISOString().split('T')[0])
      setFormShift('NGABEDUG')
      setFormStartTime('')
      setFormEndTime('')
      setFormLemburHours('')
      setFormHeadcount('1')
      setFormWageOverride('')
      setFormNotes('')
    }
    setShowForm(true)
  }

  const selectedEmployee = employees.find((employee) => employee.id === parseInt(formEmployeeId))
  const selectedGarden = gardens.find((garden) => garden.id === parseInt(formGardenId))
  const lemburHours = formLemburHours ? parseFloat(formLemburHours) : 0
  const headcount = formHeadcount ? parseInt(formHeadcount) : 1

  const computedWage = selectedEmployee
    ? calculateShiftWage(selectedEmployee, formShift, lemburHours, headcount)
    : 0
  const previewWage = formWageOverride ? parseInt(formWageOverride) : computedWage

  async function handleSave() {
    if (!formEmployeeId || !formWorkDate || !formGardenId) return
    setSaving(true)
    setFormError('')

    const body = {
      employeeId: parseInt(formEmployeeId),
      gardenId: parseInt(formGardenId),
      blockId: formBlockId ? parseInt(formBlockId) : null,
      jobTypeId: formJobTypeId ? parseInt(formJobTypeId) : null,
      workDate: formWorkDate,
      shift: formShift,
      startTime: formStartTime || null,
      endTime: formEndTime || null,
      lemburHours,
      headcount,
      ...(formWageOverride ? { wageAmount: parseInt(formWageOverride) } : {}),
      notes: formNotes || null,
    }

    const res = await fetch(
      editId ? `/api/payroll-records/${editId}` : '/api/payroll-records',
      {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    if (res.ok) {
      setShowForm(false)
      fetchRecords()
    } else {
      const data = await res.json().catch(() => ({}))
      setFormError(data.error || 'Gagal menyimpan catatan gaji')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    await fetch(`/api/payroll-records/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null)
    setSaving(false)
    fetchRecords()
  }

  const columns: Column<PayrollRecord>[] = [
    { key: 'workDate', label: 'Tanggal', sortable: true, render: (r) => formatDate(r.workDate) },
    {
      key: 'employee',
      label: 'Karyawan',
      render: (r) => (
        <span>
          {r.employee.fullName}
          {r.headcount > 1 && (
            <span className="text-[var(--color-text-muted)]"> × {r.headcount}</span>
          )}
        </span>
      ),
    },
    { key: 'jobType', label: 'Pekerjaan', render: (r) => r.jobType?.name || '-' },
    {
      key: 'garden',
      label: 'Kebun',
      render: (r) => (
        <span>
          {r.garden.name}
          {r.block && (
            <span className="text-[var(--color-text-muted)] text-xs block">{r.block.name}</span>
          )}
        </span>
      ),
    },
    {
      key: 'shift',
      label: 'Shift',
      render: (r) => (
        <span>
          {SHIFT_LABELS[r.shift as Shift]?.split(' ')[0] || r.shift}
          {r.startTime && (
            <span className="text-[var(--color-text-muted)] text-xs block">
              {r.startTime}{r.endTime ? ` - ${r.endTime}` : ''}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'lemburHours',
      label: 'Lembur',
      align: 'right',
      render: (r) => (r.lemburHours > 0 ? `${r.lemburHours} jam` : '-'),
    },
    {
      key: 'wageAmount',
      label: 'Upah',
      align: 'right',
      sortable: true,
      render: (r) => (
        <span>
          {formatIDR(r.wageAmount)}
          {r.isManualWage && (
            <span className="text-[var(--color-text-muted)] text-xs block">manual</span>
          )}
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
          <h1 className="text-2xl font-bold">Gaji Harian</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Satu baris = satu orang, satu shift, satu pekerjaan, satu kebun
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton type="payroll" startDate={startDate} endDate={endDate} />
          <button onClick={() => openForm()} className="btn btn-primary">+ Input Gaji</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Upah" value={totals.totalWage} icon="💰" />
        <StatCard label="Jumlah Baris" value={total} format="number" icon="📋" />
        <StatCard label="Total Lembur (jam)" value={totals.totalLemburHours} format="number" icon="🕗" />
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Cari karyawan / pekerjaan..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
          <select value={filterJobType} onChange={(e) => { setFilterJobType(e.target.value); setPage(1) }}>
            <option value="">Semua pekerjaan</option>
            {jobTypes.map((job) => (
              <option key={job.id} value={job.id}>{job.name}</option>
            ))}
          </select>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} />
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} />
          <button
            onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setFilterJobType(''); setPage(1) }}
            className="btn btn-secondary"
          >
            Reset Filter
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={records}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        loading={loading}
        emptyMessage="Belum ada data gaji"
      />

      <Pagination page={page} total={total} limit={20} onChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Gaji' : 'Input Gaji Baru'}>
        <div className="space-y-4">
          <FormField label="Karyawan" required>
            <select value={formEmployeeId} onChange={(e) => setFormEmployeeId(e.target.value)}>
              <option value="">Pilih karyawan</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                  {employee.employmentType === 'BULANAN' ? ' (bulanan)' : ''}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kebun" required>
              <select
                value={formGardenId}
                onChange={(e) => { setFormGardenId(e.target.value); setFormBlockId('') }}
              >
                <option value="">Pilih kebun</option>
                {gardens.map((garden) => (
                  <option key={garden.id} value={garden.id}>{garden.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Blok">
              <select
                value={formBlockId}
                onChange={(e) => setFormBlockId(e.target.value)}
                disabled={!selectedGarden || selectedGarden.blocks.length === 0}
              >
                <option value="">
                  {selectedGarden && selectedGarden.blocks.length === 0 ? 'Belum ada blok' : 'Tanpa blok'}
                </option>
                {selectedGarden?.blocks.map((block) => (
                  <option key={block.id} value={block.id}>{block.name}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tanggal Kerja" required>
              <input type="date" value={formWorkDate} onChange={(e) => setFormWorkDate(e.target.value)} />
            </FormField>
            <FormField label="Pekerjaan">
              <select value={formJobTypeId} onChange={(e) => setFormJobTypeId(e.target.value)}>
                <option value="">Pilih pekerjaan</option>
                {jobTypes.map((job) => (
                  <option key={job.id} value={job.id}>{job.name}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Shift" required>
            <select value={formShift} onChange={(e) => setFormShift(e.target.value as Shift)}>
              {SHIFTS.map((shift) => (
                <option key={shift} value={shift}>{SHIFT_LABELS[shift]}</option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Jam Mulai">
              <input type="text" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} placeholder="07.00" />
            </FormField>
            <FormField label="Jam Selesai">
              <input type="text" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} placeholder="12.00" />
            </FormField>
            <FormField label="Lembur (jam)">
              <input
                type="number"
                value={formLemburHours}
                onChange={(e) => setFormLemburHours(e.target.value)}
                placeholder="0"
                min="0"
                step="0.5"
              />
            </FormField>
          </div>

          {selectedEmployee?.isGroup && (
            <FormField label="Jumlah Orang" required>
              <input
                type="number"
                value={formHeadcount}
                onChange={(e) => setFormHeadcount(e.target.value)}
                min="1"
              />
            </FormField>
          )}

          <FormField
            label={formShift === 'BORONGAN' ? 'Upah Borongan (wajib)' : 'Upah Manual (opsional)'}
            required={formShift === 'BORONGAN'}
          >
            <input
              type="number"
              value={formWageOverride}
              onChange={(e) => setFormWageOverride(e.target.value)}
              placeholder={formShift === 'BORONGAN' ? 'Isi nominal borongan' : `Otomatis: ${computedWage}`}
              min="0"
            />
          </FormField>

          {selectedEmployee && (
            <div className="p-3 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-muted)]">Perhitungan:</p>
              <p className="text-sm mt-1">
                {formShift === 'NGABEDUG' && `Ngabedug ${formatIDR(selectedEmployee.wageNgabedug)}`}
                {formShift === 'NYORE' && `Nyore ${formatIDR(selectedEmployee.wageNyore)}`}
                {formShift === 'LEMBUR' && `Lembur ${formatIDR(selectedEmployee.wageLemburPerHour)}/jam`}
                {formShift === 'BORONGAN' && 'Borongan - nominal diisi manual'}
                {lemburHours > 0 && formShift !== 'LEMBUR' && (
                  <> + lembur {lemburHours} jam × {formatIDR(selectedEmployee.wageLemburPerHour)}</>
                )}
                {headcount > 1 && <> × {headcount} orang</>}
              </p>
              <p className="text-lg font-bold text-[var(--color-primary)] mt-1">
                Upah: {formatIDR(previewWage)}
              </p>
            </div>
          )}

          <FormField label="Catatan">
            <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} placeholder="Catatan tambahan..." />
          </FormField>

          {formError && <p className="text-sm text-[var(--color-accent)]">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button
              onClick={handleSave}
              disabled={saving || !formEmployeeId || !formWorkDate || !formGardenId}
              className="btn btn-primary"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Catatan Gaji"
        message="Apakah Anda yakin ingin menghapus catatan gaji ini?"
        loading={saving}
      />
    </div>
  )
}
