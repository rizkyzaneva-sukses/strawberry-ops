'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable, { Column } from '@/components/ui/DataTable'
import { formatDateTime } from '@/lib/utils'

interface AuditLog {
  id: number
  userId: number
  action: string
  entity: string
  entityId: number
  details: string | null
  createdAt: string
  user: { id: number; fullName: string; username: string }
}

interface AuditResponse {
  items: AuditLog[]
  total: number
  page: number
  limit: number
}

const actionLabels: Record<string, string> = {
  CREATE: 'Tambah',
  UPDATE: 'Ubah',
  DELETE: 'Hapus',
}

const entityLabels: Record<string, string> = {
  Employee: 'Karyawan',
  Expense: 'Pengeluaran',
  HarvestRevenue: 'Pendapatan Panen',
  PayrollRecord: 'Catatan Gaji',
  User: 'User',
  BankAccount: 'Rekening Bank',
  CommodityPrice: 'Harga Komoditas',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)

    const res = await fetch(`/api/audit-logs?${params}`)
    if (res.ok) {
      const data: AuditResponse = await res.json()
      setLogs(data.items)
      setTotal(data.total)
    }
    setLoading(false)
  }, [page, limit, startDate, endDate])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const totalPages = Math.ceil(total / limit)

  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      label: 'Waktu',
      render: (r) => <span className="text-sm">{formatDateTime(r.createdAt)}</span>,
    },
    {
      key: 'user',
      label: 'User',
      render: (r) => (
        <div>
          <p className="text-sm font-medium">{r.user.fullName}</p>
          <p className="text-xs text-[var(--color-text-muted)]">@{r.user.username}</p>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Aksi',
      render: (r) => (
        <span
          className={`badge ${
            r.action === 'CREATE'
              ? 'badge-success'
              : r.action === 'DELETE'
              ? 'badge-danger'
              : 'badge-warning'
          }`}
        >
          {actionLabels[r.action] || r.action}
        </span>
      ),
    },
    {
      key: 'entity',
      label: 'Entity',
      render: (r) => (
        <span className="text-sm">
          {entityLabels[r.entity] || r.entity} #{r.entityId}
        </span>
      ),
    },
    {
      key: 'details',
      label: 'Detail',
      render: (r) => (
        <span className="text-sm text-[var(--color-text-muted)] max-w-xs truncate inline-block">
          {r.details || '-'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Log Aktivitas</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Riwayat aktivitas pengguna sistem</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">Dari Tanggal</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <DataTable columns={columns} data={logs} loading={loading} emptyMessage="Belum ada log aktivitas" />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-muted)]">
            Halaman {page} dari {totalPages} ({total} data)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary text-sm"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary text-sm"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
