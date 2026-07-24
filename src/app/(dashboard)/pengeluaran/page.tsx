'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable, { Column } from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField from '@/components/ui/FormField'
import StatCard from '@/components/ui/StatCard'
import ExportButton from '@/components/ui/ExportButton'
import FileUpload from '@/components/ui/FileUpload'
import { formatIDR, formatDate } from '@/lib/utils'

interface ExpenseCategory { id: number; name: string; code: string }
interface BankAccount { id: number; accountName: string; bankName: string }
interface Expense {
  id: number
  transactionDate: string
  categoryId: number
  description: string | null
  amount: number
  sourceAccountId: number | null
  recipientAccount: string | null
  transferProofPath: string | null
  receiptProofPath: string | null
  category: ExpenseCategory
  sourceAccount: BankAccount | null
  user: { id: number; fullName: string }
}

export default function PengeluaranPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [total, setTotal] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('transactionDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formDate, setFormDate] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formSourceAccount, setFormSourceAccount] = useState('')
  const [formRecipient, setFormRecipient] = useState('')
  const [formTransferProof, setFormTransferProof] = useState<string | null>(null)
  const [formReceiptProof, setFormReceiptProof] = useState<string | null>(null)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page), limit: '20', sortBy, sortOrder, search, startDate, endDate,
      ...(filterCategory && { categoryId: filterCategory }),
    })
    const res = await fetch(`/api/expenses?${params}`)
    const data = await res.json()
    setExpenses(data.items || [])
    setTotal(data.total || 0)
    setTotalAmount(data.totals?.totalAmount || 0)
    setLoading(false)
  }, [page, sortBy, sortOrder, search, startDate, endDate, filterCategory])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])
  useEffect(() => {
    Promise.all([
      fetch('/api/bank-accounts').then(r => r.json()),
      fetch('/api/expense-categories').then(r => r.json()),
    ]).then(([bankData, catData]) => {
      setBankAccounts(bankData || [])
      setCategories(catData || [])
    })
  }, [])

  function handleSort(key: string) {
    if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortOrder('desc') }
  }

  function openForm(record?: Expense) {
    if (record) {
      setEditId(record.id)
      setFormDate(record.transactionDate.split('T')[0])
      setFormCategory(String(record.categoryId))
      setFormDescription(record.description || '')
      setFormAmount(String(record.amount))
      setFormSourceAccount(record.sourceAccountId ? String(record.sourceAccountId) : '')
      setFormRecipient(record.recipientAccount || '')
      setFormTransferProof(record.transferProofPath)
      setFormReceiptProof(record.receiptProofPath)
    } else {
      setEditId(null)
      setFormDate(new Date().toISOString().split('T')[0])
      setFormCategory('')
      setFormDescription('')
      setFormAmount('')
      setFormSourceAccount('')
      setFormRecipient('')
      setFormTransferProof(null)
      setFormReceiptProof(null)
    }
    setShowForm(true)
  }

  async function handleSave() {
    if (!formDate || !formCategory || !formAmount) return
    setSaving(true)
    const body = {
      transactionDate: formDate,
      categoryId: formCategory,
      description: formDescription || null,
      amount: formAmount,
      sourceAccountId: formSourceAccount || null,
      recipientAccount: formRecipient || null,
      transferProofPath: formTransferProof,
      receiptProofPath: formReceiptProof,
    }
    const url = editId ? `/api/expenses/${editId}` : '/api/expenses'
    const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { setShowForm(false); fetchExpenses() }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null); setSaving(false); fetchExpenses()
  }

  const columns: Column<Expense>[] = [
    { key: 'transactionDate', label: 'Tanggal', sortable: true, render: (r) => formatDate(r.transactionDate) },
    { key: 'category', label: 'Kategori', render: (r) => <span className="badge badge-info">{r.category.name}</span> },
    { key: 'description', label: 'Deskripsi', render: (r) => r.description || '-' },
    { key: 'amount', label: 'Jumlah', align: 'right', sortable: true, render: (r) => formatIDR(r.amount) },
    { key: 'sourceAccount', label: 'Sumber Dana', render: (r) => r.sourceAccount?.accountName || '-' },
    { key: 'proof', label: 'Bukti', align: 'center', render: (r) => (
      <div className="flex items-center justify-center gap-1">
        {r.transferProofPath && <a href={r.transferProofPath} target="_blank" className="text-[var(--color-primary)]" title="Bukti Transfer">📄</a>}
        {r.receiptProofPath && <a href={r.receiptProofPath} target="_blank" className="text-[var(--color-primary)]" title="Bukti Kwitansi">🧾</a>}
        {!r.transferProofPath && !r.receiptProofPath && '-'}
      </div>
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
          <h1 className="text-2xl font-bold">Pengeluaran</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Kelola data pengeluaran kebun</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton type="expenses" startDate={startDate} endDate={endDate} />
          <button onClick={() => openForm()} className="btn btn-primary">+ Input Pengeluaran</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total Pengeluaran" value={totalAmount} icon="📤" />
        <StatCard label="Jumlah Transaksi" value={total} format="number" icon="📋" />
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input type="text" placeholder="Cari..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}>
            <option value="">Semua Kategori</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} />
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} />
          <button onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setFilterCategory(''); setPage(1) }} className="btn btn-secondary">Reset</button>
        </div>
      </div>

      <DataTable columns={columns} data={expenses} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} loading={loading} emptyMessage="Belum ada data pengeluaran" />
      <Pagination page={page} total={total} limit={20} onChange={setPage} />

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Pengeluaran' : 'Input Pengeluaran Baru'} maxWidth="max-w-xl">
        <div className="space-y-4">
          <FormField label="Tanggal Transaksi" required>
            <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
          </FormField>
          <FormField label="Kategori" required>
            <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
              <option value="">Pilih kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Deskripsi">
            <input type="text" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Deskripsi pengeluaran" />
          </FormField>
          <FormField label="Jumlah (Rp)" required>
            <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0" min="0" />
          </FormField>
          <FormField label="Sumber Dana">
            <select value={formSourceAccount} onChange={(e) => setFormSourceAccount(e.target.value)}>
              <option value="">Pilih sumber dana</option>
              {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.accountName} - {a.bankName}</option>)}
            </select>
          </FormField>
          <FormField label="Rekening Penerima">
            <input type="text" value={formRecipient} onChange={(e) => setFormRecipient(e.target.value)} placeholder="Nama/rekening penerima" />
          </FormField>
          <FileUpload label="Bukti Transfer" value={formTransferProof || undefined} onChange={setFormTransferProof} />
          <FileUpload label="Bukti Kwitansi" value={formReceiptProof || undefined} onChange={setFormReceiptProof} />

          {formAmount && (
            <div className="p-3 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)]">
              <p className="text-lg font-bold text-[var(--color-primary)]">Total: {formatIDR(parseInt(formAmount) || 0)}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving || !formDate || !formCategory || !formAmount} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Hapus Pengeluaran" message="Apakah Anda yakin ingin menghapus pengeluaran ini?" loading={saving} />
    </div>
  )
}
