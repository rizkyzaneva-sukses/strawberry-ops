'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable, { Column } from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface BankAccount {
  id: number
  accountName: string
  bankName: string
  accountNumber: string
  isActive: boolean
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const [formAccountName, setFormAccountName] = useState('')
  const [formBankName, setFormBankName] = useState('')
  const [formAccountNumber, setFormAccountNumber] = useState('')

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/bank-accounts?all=true')
    const data = await res.json()
    setAccounts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  function openForm(account?: BankAccount) {
    if (account) {
      setEditId(account.id)
      setFormAccountName(account.accountName)
      setFormBankName(account.bankName)
      setFormAccountNumber(account.accountNumber)
    } else {
      setEditId(null)
      setFormAccountName('')
      setFormBankName('')
      setFormAccountNumber('')
    }
    setShowForm(true)
  }

  async function handleSave() {
    if (!formAccountName || !formBankName || !formAccountNumber) return
    setSaving(true)
    const body = { accountName: formAccountName, bankName: formBankName, accountNumber: formAccountNumber }
    const url = editId ? `/api/bank-accounts/${editId}` : '/api/bank-accounts'
    const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { setShowForm(false); fetchAccounts() }
    setSaving(false)
  }

  async function toggleActive(account: BankAccount) {
    await fetch(`/api/bank-accounts/${account.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !account.isActive }),
    })
    fetchAccounts()
  }

  const columns: Column<BankAccount>[] = [
    { key: 'accountName', label: 'Nama Akun' },
    { key: 'bankName', label: 'Bank' },
    { key: 'accountNumber', label: 'Nomor Rekening', render: (r) => <span className="font-mono">{r.accountNumber}</span> },
    { key: 'isActive', label: 'Status', render: (r) => (
      <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>
        {r.isActive ? 'Aktif' : 'Nonaktif'}
      </span>
    )},
    { key: 'actions', label: 'Aksi', align: 'center', render: (r) => (
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => openForm(r)} className="text-[var(--color-primary)] hover:underline text-sm">Edit</button>
        <button onClick={() => toggleActive(r)} className={`hover:underline text-sm ${r.isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-success)]'}`}>
          {r.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rekening Bank</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Kelola rekening bank dan sumber dana</p>
        </div>
        <button onClick={() => openForm()} className="btn btn-primary">+ Tambah Rekening</button>
      </div>

      <DataTable columns={columns} data={accounts} loading={loading} emptyMessage="Belum ada rekening bank" />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Rekening' : 'Tambah Rekening Baru'}>
        <div className="space-y-4">
          <FormField label="Nama Akun" required>
            <input type="text" value={formAccountName} onChange={(e) => setFormAccountName(e.target.value)} placeholder="Contoh: Kas Utama, BCA Operasional" />
          </FormField>
          <FormField label="Nama Bank" required>
            <input type="text" value={formBankName} onChange={(e) => setFormBankName(e.target.value)} placeholder="Contoh: BCA, Mandiri, Tunai" />
          </FormField>
          <FormField label="Nomor Rekening" required>
            <input type="text" value={formAccountNumber} onChange={(e) => setFormAccountNumber(e.target.value)} placeholder="Nomor rekening" />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving || !formAccountName || !formBankName || !formAccountNumber} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
