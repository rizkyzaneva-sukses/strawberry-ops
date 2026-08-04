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
import { formatIDR, formatDate } from '@/lib/utils'

interface Investor { id: number; name: string }
interface BankAccount { id: number; accountName: string; bankName: string }

interface CapitalInjection {
  id: number
  gardenId: number
  entryDate: string
  description: string
  investorId: number | null
  fundingType: 'EQUITY' | 'LOAN'
  amount: number
  repaidAmount: number
  sourceAccount: string | null
  destinationAccountId: number | null
  proofRef: string | null
  notes: string | null
  garden: { id: number; name: string }
  investor: Investor | null
  destinationAccount: BankAccount | null
}

const EMPTY_TOTALS = { equity: 0, loan: 0, loanRepaid: 0, loanOutstanding: 0, grandTotal: 0 }

export default function ModalPage() {
  const { gardens, activeGarden, selection } = useGarden()

  const [records, setRecords] = useState<CapitalInjection[]>([])
  const [investors, setInvestors] = useState<Investor[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [total, setTotal] = useState(0)
  const [totals, setTotals] = useState(EMPTY_TOTALS)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [formGardenId, setFormGardenId] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formInvestor, setFormInvestor] = useState('')
  const [formType, setFormType] = useState<'EQUITY' | 'LOAN'>('EQUITY')
  const [formAmount, setFormAmount] = useState('')
  const [formRepaid, setFormRepaid] = useState('')
  const [formSource, setFormSource] = useState('')
  const [formDestination, setFormDestination] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const investorGardens = gardens.filter((garden) => garden.hasInvestor)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page), limit: '20', search, gardenId: String(selection),
      ...(filterType && { fundingType: filterType }),
    })
    const res = await fetch(`/api/capital-injections?${params}`)
    const data = await res.json()
    setRecords(data.items || [])
    setTotal(data.total || 0)
    setTotals(data.totals || EMPTY_TOTALS)
    setLoading(false)
  }, [page, search, filterType, selection])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  useEffect(() => {
    fetch('/api/bank-accounts').then((r) => r.json()).then((data) => setAccounts(data || []))
    fetch('/api/investors').then((r) => r.json()).then((data) => setInvestors(data.items || []))
  }, [])

  function openForm(record?: CapitalInjection) {
    setFormError('')
    if (record) {
      setEditId(record.id)
      setFormGardenId(String(record.gardenId))
      setFormDate(record.entryDate.split('T')[0])
      setFormDescription(record.description)
      setFormInvestor(record.investorId ? String(record.investorId) : '')
      setFormType(record.fundingType)
      setFormAmount(String(record.amount))
      setFormRepaid(String(record.repaidAmount))
      setFormSource(record.sourceAccount || '')
      setFormDestination(record.destinationAccountId ? String(record.destinationAccountId) : '')
      setFormNotes(record.notes || '')
    } else {
      setEditId(null)
      setFormGardenId(
        activeGarden?.hasInvestor
          ? String(activeGarden.id)
          : investorGardens.length === 1
            ? String(investorGardens[0].id)
            : ''
      )
      setFormDate(new Date().toISOString().split('T')[0])
      setFormDescription('')
      setFormInvestor('')
      setFormType('EQUITY')
      setFormAmount('')
      setFormRepaid('')
      setFormSource('')
      setFormDestination('')
      setFormNotes('')
    }
    setShowForm(true)
  }

  async function handleSave() {
    if (!formGardenId || !formDate || !formDescription || !formAmount) return
    setSaving(true)
    setFormError('')

    const body = {
      gardenId: parseInt(formGardenId),
      entryDate: formDate,
      description: formDescription,
      investorId: formInvestor ? parseInt(formInvestor) : null,
      fundingType: formType,
      amount: parseInt(formAmount),
      repaidAmount: formType === 'LOAN' && formRepaid ? parseInt(formRepaid) : 0,
      sourceAccount: formSource || null,
      destinationAccountId: formDestination ? parseInt(formDestination) : null,
      notes: formNotes || null,
    }

    const res = await fetch(
      editId ? `/api/capital-injections/${editId}` : '/api/capital-injections',
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
      setFormError(data.error || 'Gagal menyimpan catatan dana masuk')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    await fetch(`/api/capital-injections/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null); setSaving(false); fetchRecords()
  }

  const columns: Column<CapitalInjection>[] = [
    { key: 'entryDate', label: 'Tanggal', render: (r) => formatDate(r.entryDate) },
    { key: 'description', label: 'Keterangan', render: (r) => r.description },
    { key: 'garden', label: 'Kebun', render: (r) => r.garden.name },
    {
      key: 'fundingType',
      label: 'Jenis',
      render: (r) => (
        <span className={`badge ${r.fundingType === 'LOAN' ? 'badge-warning' : 'badge-info'}`}>
          {r.fundingType === 'LOAN' ? 'Modal Kasbon' : 'Modal Penyertaan'}
        </span>
      ),
    },
    { key: 'investor', label: 'Investor', render: (r) => r.investor?.name || '-' },
    { key: 'amount', label: 'Nominal', align: 'right', render: (r) => formatIDR(r.amount) },
    {
      key: 'repaidAmount',
      label: 'Sisa Utang',
      align: 'right',
      render: (r) =>
        r.fundingType === 'LOAN' ? (
          <span className={r.amount - r.repaidAmount > 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-success)]'}>
            {formatIDR(r.amount - r.repaidAmount)}
          </span>
        ) : (
          '-'
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

  if (investorGardens.length === 0) {
    return (
      <div className="card">
        <h1 className="text-xl font-bold mb-2">Modal &amp; Investor</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Belum ada kebun yang memakai pencatatan modal investor.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Modal &amp; Investor</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Modal penyertaan dan modal kasbon yang harus dikembalikan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton type="capital" />
          <button onClick={() => openForm()} className="btn btn-primary">+ Catat Dana Masuk</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Modal Penyertaan" value={totals.equity} icon="🏦" />
        <StatCard label="Modal Kasbon (Utang)" value={totals.loan} icon="📉" />
        <StatCard label="Sisa Utang" value={totals.loanOutstanding} icon="⚠️" />
        <StatCard label="Total Dana Masuk" value={totals.grandTotal} icon="💵" />
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" placeholder="Cari keterangan / investor..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1) }}>
            <option value="">Semua jenis</option>
            <option value="EQUITY">Modal Penyertaan</option>
            <option value="LOAN">Modal Kasbon (Utang)</option>
          </select>
          <button onClick={() => { setSearch(''); setFilterType(''); setPage(1) }} className="btn btn-secondary">Reset</button>
        </div>
      </div>

      <DataTable columns={columns} data={records} loading={loading} emptyMessage="Belum ada catatan dana masuk" />
      <Pagination page={page} total={total} limit={20} onChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Dana Masuk' : 'Catat Dana Masuk'} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kebun" required>
              <select value={formGardenId} onChange={(e) => setFormGardenId(e.target.value)}>
                <option value="">Pilih kebun</option>
                {investorGardens.map((garden) => (
                  <option key={garden.id} value={garden.id}>{garden.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Tanggal" required>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </FormField>
          </div>

          <FormField label="Keterangan" required>
            <input type="text" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Modal Awal / Modal Tambahan" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Jenis Dana" required>
              <select value={formType} onChange={(e) => setFormType(e.target.value as 'EQUITY' | 'LOAN')}>
                <option value="EQUITY">Modal Penyertaan</option>
                <option value="LOAN">Modal Kasbon (Utang)</option>
              </select>
            </FormField>
            <FormField label="Nominal (Rp)" required>
              <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} min="0" />
            </FormField>
          </div>

          {formType === 'LOAN' && (
            <FormField label="Sudah Dikembalikan (Rp)">
              <input type="number" value={formRepaid} onChange={(e) => setFormRepaid(e.target.value)} min="0" placeholder="0" />
            </FormField>
          )}

          <FormField label="Investor">
            <select value={formInvestor} onChange={(e) => setFormInvestor(e.target.value)}>
              <option value="">Tidak disebutkan</option>
              {investors.map((investor) => (
                <option key={investor.id} value={investor.id}>{investor.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Sumber Dana">
            <input type="text" value={formSource} onChange={(e) => setFormSource(e.target.value)} placeholder="BCA 123456 (Nama)" />
          </FormField>

          <FormField label="Rekening Tujuan">
            <select value={formDestination} onChange={(e) => setFormDestination(e.target.value)}>
              <option value="">Pilih rekening</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.accountName} - {account.bankName}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Catatan">
            <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />
          </FormField>

          {formError && <p className="text-sm text-[var(--color-accent)]">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button
              onClick={handleSave}
              disabled={saving || !formGardenId || !formDate || !formDescription || !formAmount}
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
        title="Hapus Catatan Dana Masuk"
        message="Apakah Anda yakin ingin menghapus catatan ini?"
        loading={saving}
      />
    </div>
  )
}
