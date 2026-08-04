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
import { useGarden } from '@/components/GardenProvider'
import { formatIDR, formatDate } from '@/lib/utils'

interface ExpenseCategory { id: number; name: string; code: string }
interface BankAccount { id: number; accountName: string; bankName: string }
interface Vendor { id: number; name: string; isFlagged: boolean }

interface Allocation {
  gardenId: number
  amount: number
  garden: { id: number; name: string }
}

interface Expense {
  id: number
  transactionDate: string
  gardenId: number | null
  categoryId: number
  vendorId: number | null
  description: string | null
  amount: number
  gardenAmount: number
  quantity: number | null
  unit: string | null
  unitPrice: number | null
  paymentStatus: string
  installmentLabel: string | null
  isShared: boolean
  sourceAccountId: number | null
  recipientAccount: string | null
  transferProofPath: string | null
  receiptProofPath: string | null
  proofRef: string | null
  isFlagged: boolean
  flagNote: string | null
  notes: string | null
  category: ExpenseCategory
  garden: { id: number; name: string } | null
  vendor: Vendor | null
  sourceAccount: BankAccount | null
  allocations: Allocation[]
}

const PAYMENT_STATUSES = [
  { value: 'LUNAS', label: 'Lunas' },
  { value: 'DP', label: 'DP / Uang Muka' },
  { value: 'KURANG_BAYAR', label: 'Kurang Bayar' },
  { value: 'BELUM_BAYAR', label: 'Belum Bayar' },
]

export default function PengeluaranPage() {
  const { gardens, activeGarden, selection } = useGarden()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [total, setTotal] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('transactionDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [formDate, setFormDate] = useState('')
  const [formGardenId, setFormGardenId] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formVendor, setFormVendor] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formQuantity, setFormQuantity] = useState('')
  const [formUnit, setFormUnit] = useState('')
  const [formUnitPrice, setFormUnitPrice] = useState('')
  const [formPaymentStatus, setFormPaymentStatus] = useState('LUNAS')
  const [formInstallment, setFormInstallment] = useState('')
  const [formShared, setFormShared] = useState(false)
  const [formShares, setFormShares] = useState<Record<number, string>>({})
  const [formSourceAccount, setFormSourceAccount] = useState('')
  const [formRecipient, setFormRecipient] = useState('')
  const [formFlagged, setFormFlagged] = useState(false)
  const [formFlagNote, setFormFlagNote] = useState('')
  const [formTransferProof, setFormTransferProof] = useState<string | null>(null)
  const [formReceiptProof, setFormReceiptProof] = useState<string | null>(null)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page), limit: '20', sortBy, sortOrder, search, startDate, endDate,
      gardenId: String(selection),
      ...(filterCategory && { categoryId: filterCategory }),
      ...(flaggedOnly && { flagged: '1' }),
    })
    const res = await fetch(`/api/expenses?${params}`)
    const data = await res.json()
    setExpenses(data.items || [])
    setTotal(data.total || 0)
    setTotalAmount(data.totals?.totalAmount || 0)
    setLoading(false)
  }, [page, sortBy, sortOrder, search, startDate, endDate, filterCategory, flaggedOnly, selection])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  useEffect(() => {
    Promise.all([
      fetch('/api/bank-accounts').then((r) => r.json()),
      fetch('/api/expense-categories').then((r) => r.json()),
      fetch('/api/vendors?limit=100').then((r) => r.json()),
    ]).then(([bankData, catData, vendorData]) => {
      setBankAccounts(bankData || [])
      setCategories(catData || [])
      setVendors(vendorData.items || [])
    })
  }, [])

  function handleSort(key: string) {
    if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortOrder('desc') }
  }

  function openForm(record?: Expense) {
    setFormError('')
    if (record) {
      setEditId(record.id)
      setFormDate(record.transactionDate.split('T')[0])
      setFormGardenId(record.gardenId ? String(record.gardenId) : '')
      setFormCategory(String(record.categoryId))
      setFormVendor(record.vendorId ? String(record.vendorId) : '')
      setFormDescription(record.description || '')
      setFormAmount(String(record.amount))
      setFormQuantity(record.quantity ? String(record.quantity) : '')
      setFormUnit(record.unit || '')
      setFormUnitPrice(record.unitPrice ? String(record.unitPrice) : '')
      setFormPaymentStatus(record.paymentStatus)
      setFormInstallment(record.installmentLabel || '')
      setFormShared(record.isShared)
      setFormShares(
        Object.fromEntries(
          record.allocations.map((allocation) => [allocation.gardenId, String(allocation.amount)])
        )
      )
      setFormSourceAccount(record.sourceAccountId ? String(record.sourceAccountId) : '')
      setFormRecipient(record.recipientAccount || '')
      setFormFlagged(record.isFlagged)
      setFormFlagNote(record.flagNote || '')
      setFormTransferProof(record.transferProofPath)
      setFormReceiptProof(record.receiptProofPath)
    } else {
      setEditId(null)
      setFormDate(new Date().toISOString().split('T')[0])
      setFormGardenId(activeGarden ? String(activeGarden.id) : '')
      setFormCategory('')
      setFormVendor('')
      setFormDescription('')
      setFormAmount('')
      setFormQuantity('')
      setFormUnit('')
      setFormUnitPrice('')
      setFormPaymentStatus('LUNAS')
      setFormInstallment('')
      setFormShared(false)
      setFormShares({})
      setFormSourceAccount('')
      setFormRecipient('')
      setFormFlagged(false)
      setFormFlagNote('')
      setFormTransferProof(null)
      setFormReceiptProof(null)
    }
    setShowForm(true)
  }

  const amountValue = parseInt(formAmount) || 0

  /** Membagi rata nominal ke semua kebun, sisa pembulatan ke kebun pertama. */
  function splitEvenly() {
    if (gardens.length === 0) return
    const base = Math.floor(amountValue / gardens.length)
    const shares: Record<number, string> = {}
    gardens.forEach((garden, index) => {
      shares[garden.id] = String(index === 0 ? amountValue - base * (gardens.length - 1) : base)
    })
    setFormShares(shares)
  }

  const shareTotal = formShared
    ? gardens.reduce((sum, garden) => sum + (parseInt(formShares[garden.id]) || 0), 0)
    : amountValue

  async function handleSave() {
    if (!formDate || !formCategory || !formAmount) return
    if (!formShared && !formGardenId) {
      setFormError('Kebun wajib dipilih')
      return
    }
    if (formShared && shareTotal !== amountValue) {
      setFormError(`Jumlah porsi (${formatIDR(shareTotal)}) harus sama dengan nominal (${formatIDR(amountValue)})`)
      return
    }

    setSaving(true)
    setFormError('')

    const body = {
      transactionDate: formDate,
      gardenId: formShared ? null : parseInt(formGardenId),
      categoryId: parseInt(formCategory),
      vendorId: formVendor ? parseInt(formVendor) : null,
      description: formDescription || null,
      amount: amountValue,
      quantity: formQuantity ? parseFloat(formQuantity) : null,
      unit: formUnit || null,
      unitPrice: formUnitPrice ? parseInt(formUnitPrice) : null,
      paymentStatus: formPaymentStatus,
      installmentLabel: formInstallment || null,
      isShared: formShared,
      allocations: formShared
        ? gardens
            .map((garden) => ({ gardenId: garden.id, amount: parseInt(formShares[garden.id]) || 0 }))
            .filter((allocation) => allocation.amount > 0)
        : undefined,
      sourceAccountId: formSourceAccount ? parseInt(formSourceAccount) : null,
      recipientAccount: formRecipient || null,
      isFlagged: formFlagged,
      flagNote: formFlagNote || null,
      transferProofPath: formTransferProof,
      receiptProofPath: formReceiptProof,
    }

    const url = editId ? `/api/expenses/${editId}` : '/api/expenses'
    const res = await fetch(url, {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setShowForm(false)
      fetchExpenses()
    } else {
      const data = await res.json().catch(() => ({}))
      setFormError(data.error || 'Gagal menyimpan pengeluaran')
    }
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
    {
      key: 'description',
      label: 'Deskripsi',
      render: (r) => (
        <span>
          {r.description || '-'}
          {r.isFlagged && <span title={r.flagNote || 'Perlu ditinjau'}> ⚠️</span>}
          {r.installmentLabel && (
            <span className="text-[var(--color-text-muted)] text-xs block">{r.installmentLabel}</span>
          )}
        </span>
      ),
    },
    {
      key: 'garden',
      label: 'Kebun',
      render: (r) =>
        r.isShared ? (
          <span title={r.allocations.map((a) => `${a.garden.name}: ${formatIDR(a.amount)}`).join(' · ')}>
            Bersama
            <span className="text-[var(--color-text-muted)] text-xs block">
              {r.allocations.map((a) => a.garden.name).join(' + ')}
            </span>
          </span>
        ) : (
          r.garden?.name || '-'
        ),
    },
    {
      key: 'amount',
      label: 'Jumlah',
      align: 'right',
      sortable: true,
      render: (r) => (
        <span>
          {formatIDR(r.gardenAmount ?? r.amount)}
          {r.isShared && r.gardenAmount !== r.amount && (
            <span className="text-[var(--color-text-muted)] text-xs block">
              dari {formatIDR(r.amount)}
            </span>
          )}
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
    { key: 'vendor', label: 'Penerima', render: (r) => r.vendor?.name || r.recipientAccount || '-' },
    {
      key: 'proof',
      label: 'Bukti',
      align: 'center',
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          {r.transferProofPath && <a href={r.transferProofPath} target="_blank" className="text-[var(--color-primary)]" title="Bukti Transfer">📄</a>}
          {r.receiptProofPath && <a href={r.receiptProofPath} target="_blank" className="text-[var(--color-primary)]" title="Bukti Kwitansi">🧾</a>}
          {!r.transferProofPath && !r.receiptProofPath && (
            r.proofRef ? <span title={`Berkas belum diunggah: ${r.proofRef}`}>📎</span> : '-'
          )}
        </div>
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
          <h1 className="text-2xl font-bold">Pengeluaran</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {activeGarden ? `Porsi biaya untuk ${activeGarden.name}` : 'Gabungan seluruh kebun'}
          </p>
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

      <div className="card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input type="text" placeholder="Cari..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}>
            <option value="">Semua Kategori</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} />
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} />
          <button
            onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setFilterCategory(''); setFlaggedOnly(false); setPage(1) }}
            className="btn btn-secondary"
          >
            Reset
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => { setFlaggedOnly(e.target.checked); setPage(1) }}
            className="w-4 h-4"
          />
          <span>Hanya transaksi bertanda masalah ⚠️</span>
        </label>
      </div>

      <DataTable columns={columns} data={expenses} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} loading={loading} emptyMessage="Belum ada data pengeluaran" />
      <Pagination page={page} total={total} limit={20} onChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Pengeluaran' : 'Input Pengeluaran Baru'} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tanggal Transaksi" required>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </FormField>
            <FormField label="Kategori" required>
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                <option value="">Pilih kategori</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Deskripsi">
            <input type="text" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Deskripsi pengeluaran" />
          </FormField>

          <FormField label="Jumlah (Rp)" required>
            <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0" min="0" />
          </FormField>

          <div className="rounded-lg border border-[var(--color-border)] p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formShared}
                onChange={(e) => {
                  setFormShared(e.target.checked)
                  if (e.target.checked) splitEvenly()
                }}
                className="w-4 h-4"
              />
              <span>Biaya bersama dua kebun</span>
            </label>

            {formShared ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  {gardens.map((garden) => (
                    <FormField key={garden.id} label={`Porsi ${garden.name}`}>
                      <input
                        type="number"
                        value={formShares[garden.id] || ''}
                        onChange={(e) => setFormShares({ ...formShares, [garden.id]: e.target.value })}
                        min="0"
                      />
                    </FormField>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <button onClick={splitEvenly} className="text-[var(--color-primary)] hover:underline">
                    Bagi rata 50/50
                  </button>
                  <span className={shareTotal === amountValue ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'}>
                    Total porsi: {formatIDR(shareTotal)} / {formatIDR(amountValue)}
                  </span>
                </div>
              </div>
            ) : (
              <FormField label="Kebun" required>
                <select value={formGardenId} onChange={(e) => setFormGardenId(e.target.value)}>
                  <option value="">Pilih kebun</option>
                  {gardens.map((garden) => <option key={garden.id} value={garden.id}>{garden.name}</option>)}
                </select>
              </FormField>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Jumlah">
              <input type="number" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} placeholder="4" min="0" step="0.1" />
            </FormField>
            <FormField label="Satuan">
              <input type="text" value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder="Liter" />
            </FormField>
            <FormField label="Harga Satuan">
              <input type="number" value={formUnitPrice} onChange={(e) => setFormUnitPrice(e.target.value)} placeholder="15000" min="0" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Status Pembayaran">
              <select value={formPaymentStatus} onChange={(e) => setFormPaymentStatus(e.target.value)}>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Termin">
              <input type="text" value={formInstallment} onChange={(e) => setFormInstallment(e.target.value)} placeholder="Tahap 1 / DP / Pelunasan" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Sumber Dana">
              <select value={formSourceAccount} onChange={(e) => setFormSourceAccount(e.target.value)}>
                <option value="">Pilih sumber dana</option>
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.accountName} - {account.bankName}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Penerima">
              <select value={formVendor} onChange={(e) => setFormVendor(e.target.value)}>
                <option value="">Pilih penerima</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}{vendor.isFlagged ? ' ⚠️' : ''}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Rekening Penerima (teks bebas)">
            <input type="text" value={formRecipient} onChange={(e) => setFormRecipient(e.target.value)} placeholder="BCA 123456 (Nama)" />
          </FormField>

          <FileUpload label="Bukti Transfer" value={formTransferProof || undefined} onChange={setFormTransferProof} />
          <FileUpload label="Bukti Kwitansi" value={formReceiptProof || undefined} onChange={setFormReceiptProof} />

          <div className="rounded-lg border border-[var(--color-border)] p-3 space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={formFlagged} onChange={(e) => setFormFlagged(e.target.checked)} className="w-4 h-4" />
              <span>Tandai bermasalah (perlu ditinjau)</span>
            </label>
            {formFlagged && (
              <textarea
                value={formFlagNote}
                onChange={(e) => setFormFlagNote(e.target.value)}
                rows={2}
                placeholder="Apa yang bermasalah? mis. nota kosong, selisih harga"
              />
            )}
          </div>

          {formError && <p className="text-sm text-[var(--color-accent)]">{formError}</p>}

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
