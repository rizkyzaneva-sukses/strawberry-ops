'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable, { Column } from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField from '@/components/ui/FormField'
import StatCard from '@/components/ui/StatCard'
import ExportButton from '@/components/ui/ExportButton'
import { formatIDR, formatDate, calculateDuration, calculateWage } from '@/lib/utils'

interface Employee {
  id: number
  fullName: string
  wageType: string
  wageRate: number
  minHours: number | null
}

interface PayrollRecord {
  id: number
  employeeId: number
  workDate: string
  workArea: string | null
  clockIn: string | null
  clockOut: string | null
  durationHours: number | null
  wageAmount: number
  notes: string | null
  employee: Employee
  user: { id: number; fullName: string }
}

export default function GajiPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [totals, setTotals] = useState({ totalWage: 0, totalHours: 0 })
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('workDate')
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
  const [formEmployeeId, setFormEmployeeId] = useState('')
  const [formWorkDate, setFormWorkDate] = useState('')
  const [formWorkArea, setFormWorkArea] = useState('')
  const [formClockIn, setFormClockIn] = useState('')
  const [formClockOut, setFormClockOut] = useState('')
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
    })
    const res = await fetch(`/api/payroll-records?${params}`)
    const data = await res.json()
    setRecords(data.items || [])
    setTotal(data.total || 0)
    setTotals(data.totals || { totalWage: 0, totalHours: 0 })
    setLoading(false)
  }, [page, sortBy, sortOrder, search, startDate, endDate])

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees?limit=100')
    const data = await res.json()
    setEmployees(data.items || [])
  }

  useEffect(() => { fetchRecords() }, [fetchRecords])
  useEffect(() => { fetchEmployees() }, [])

  function handleSort(key: string) {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  function openForm(record?: PayrollRecord) {
    if (record) {
      setEditId(record.id)
      setFormEmployeeId(String(record.employeeId))
      setFormWorkDate(record.workDate.split('T')[0])
      setFormWorkArea(record.workArea || '')
      setFormClockIn(record.clockIn || '')
      setFormClockOut(record.clockOut || '')
      setFormNotes(record.notes || '')
    } else {
      setEditId(null)
      setFormEmployeeId('')
      setFormWorkDate(new Date().toISOString().split('T')[0])
      setFormWorkArea('')
      setFormClockIn('')
      setFormClockOut('')
      setFormNotes('')
    }
    setShowForm(true)
  }

  async function handleSave() {
    if (!formEmployeeId || !formWorkDate) return
    setSaving(true)

    const body = {
      employeeId: formEmployeeId,
      workDate: formWorkDate,
      workArea: formWorkArea || null,
      clockIn: formClockIn || null,
      clockOut: formClockOut || null,
      notes: formNotes || null,
    }

    const url = editId ? `/api/payroll-records/${editId}` : '/api/payroll-records'
    const method = editId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setShowForm(false)
      fetchRecords()
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

  // Auto-calculate preview
  const selectedEmployee = employees.find(e => e.id === parseInt(formEmployeeId))
  const previewDuration = formClockIn && formClockOut ? calculateDuration(formClockIn, formClockOut) : 0
  const previewWage = selectedEmployee
    ? calculateWage(selectedEmployee.wageType, selectedEmployee.wageRate, previewDuration, selectedEmployee.minHours)
    : 0

  const columns: Column<PayrollRecord>[] = [
    { key: 'workDate', label: 'Tanggal', sortable: true, render: (r) => formatDate(r.workDate) },
    { key: 'employee', label: 'Karyawan', render: (r) => r.employee.fullName },
    { key: 'workArea', label: 'Area Kerja', render: (r) => r.workArea || '-' },
    { key: 'clockIn', label: 'Jam Masuk', render: (r) => r.clockIn || '-' },
    { key: 'clockOut', label: 'Jam Keluar', render: (r) => r.clockOut || '-' },
    { key: 'durationHours', label: 'Durasi', align: 'right', render: (r) => r.durationHours ? `${r.durationHours.toFixed(1)} jam` : '-' },
    { key: 'wageAmount', label: 'Upah', align: 'right', sortable: true, render: (r) => formatIDR(r.wageAmount) },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rekap Gaji</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Kelola data gaji dan upah karyawan</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton type="payroll" startDate={startDate} endDate={endDate} />
          <button onClick={() => openForm()} className="btn btn-primary">
            + Input Gaji
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Upah" value={totals.totalWage} icon="💰" />
        <StatCard label="Total Jam Kerja" value={totals.totalHours} format="number" icon="⏱️" />
        <StatCard label="Jumlah Record" value={total} format="number" icon="📋" />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Cari karyawan..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
            placeholder="Dari tanggal"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
            placeholder="Sampai tanggal"
          />
          <button onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setPage(1) }} className="btn btn-secondary">
            Reset Filter
          </button>
        </div>
      </div>

      {/* Table */}
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

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Gaji' : 'Input Gaji Baru'}>
        <div className="space-y-4">
          <FormField label="Karyawan" required>
            <select value={formEmployeeId} onChange={(e) => setFormEmployeeId(e.target.value)}>
              <option value="">Pilih karyawan</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.wageType} - {formatIDR(emp.wageRate)})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Tanggal Kerja" required>
            <input type="date" value={formWorkDate} onChange={(e) => setFormWorkDate(e.target.value)} />
          </FormField>

          <FormField label="Area Kerja">
            <input type="text" value={formWorkArea} onChange={(e) => setFormWorkArea(e.target.value)} placeholder="Contoh: Blok A" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Jam Masuk">
              <input type="time" value={formClockIn} onChange={(e) => setFormClockIn(e.target.value)} />
            </FormField>
            <FormField label="Jam Keluar">
              <input type="time" value={formClockOut} onChange={(e) => setFormClockOut(e.target.value)} />
            </FormField>
          </div>

          {selectedEmployee && (
            <div className="p-3 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-muted)]">Preview Perhitungan:</p>
              <p className="text-sm mt-1">
                Tipe: <span className="font-medium">{selectedEmployee.wageType}</span> |
                Tarif: <span className="font-medium">{formatIDR(selectedEmployee.wageRate)}</span>
                {previewDuration > 0 && <> | Durasi: <span className="font-medium">{previewDuration.toFixed(1)} jam</span></>}
              </p>
              <p className="text-lg font-bold text-[var(--color-primary)] mt-1">
                Upah: {formatIDR(previewWage)}
              </p>
            </div>
          )}

          <FormField label="Catatan">
            <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} placeholder="Catatan tambahan..." />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving || !formEmployeeId || !formWorkDate} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Catatan Gaji"
        message="Apakah Anda yakin ingin menghapus catatan gaji ini? Data akan dihapus secara soft delete."
        loading={saving}
      />
    </div>
  )
}
