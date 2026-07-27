'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable, { Column } from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface User {
  id: number
  username: string
  fullName: string
  role: string
  isActive: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formFullName, setFormFullName] = useState('')
  const [formRole, setFormRole] = useState('STAFF')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/users')
    if (res.ok) {
      const data = await res.json()
      setUsers(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function openForm(user?: User) {
    setError('')
    if (user) {
      setEditId(user.id)
      setFormUsername(user.username)
      setFormPassword('')
      setFormFullName(user.fullName)
      setFormRole(user.role)
    } else {
      setEditId(null)
      setFormUsername('')
      setFormPassword('')
      setFormFullName('')
      setFormRole('STAFF')
    }
    setShowForm(true)
  }

  async function handleSave() {
    if (!formUsername || !formFullName) return
    if (!editId && !formPassword) { setError('Password wajib diisi'); return }
    setSaving(true)
    setError('')

    const body: any = {
      username: formUsername,
      fullName: formFullName,
      role: formRole,
    }
    if (formPassword) body.password = formPassword

    const url = editId ? `/api/users/${editId}` : '/api/users'
    const res = await fetch(url, {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setShowForm(false)
      fetchUsers()
    } else {
      const data = await res.json()
      setError(data.error || 'Gagal menyimpan')
    }
    setSaving(false)
  }

  const columns: Column<User>[] = [
    { key: 'fullName', label: 'Nama Lengkap' },
    { key: 'username', label: 'Username' },
    { key: 'role', label: 'Role', render: (r) => (
      <span className={`badge ${r.role === 'OWNER' ? 'badge-danger' : r.role === 'MANAGER' ? 'badge-warning' : 'badge-info'}`}>
        {r.role}
      </span>
    )},
    { key: 'isActive', label: 'Status', render: (r) => (
      <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>
        {r.isActive ? 'Aktif' : 'Nonaktif'}
      </span>
    )},
    { key: 'actions', label: 'Aksi', align: 'center', render: (r) => (
      <button onClick={() => openForm(r)} className="text-[var(--color-primary)] hover:underline text-sm">Edit</button>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kelola User</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Kelola akun pengguna sistem</p>
        </div>
        <button onClick={() => openForm()} className="btn btn-primary">+ Tambah User</button>
      </div>

      <DataTable columns={columns} data={users} loading={loading} emptyMessage="Belum ada data user" />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit User' : 'Tambah User Baru'}>
        <div className="space-y-4">
          {error && (
            <div role="alert" className="p-3 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-sm">{error}</div>
          )}
          <FormField label="Nama Lengkap" required>
            <input type="text" value={formFullName} onChange={(e) => setFormFullName(e.target.value)} placeholder="Nama lengkap" />
          </FormField>
          <FormField label="Username" required>
            <input type="text" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="Username untuk login" />
          </FormField>
          <FormField label="Password" required={!editId}>
            <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder={editId ? 'Kosongkan jika tidak diubah' : 'Password'} />
          </FormField>
          <FormField label="Role" required>
            <select value={formRole} onChange={(e) => setFormRole(e.target.value)}>
              <option value="OWNER">Owner</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
            </select>
          </FormField>

          <div className="p-3 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-muted)]">
              <strong>Owner:</strong> Akses penuh ke semua fitur<br />
              <strong>Manager:</strong> Akses ke semua fitur kecuali kelola user<br />
              <strong>Staff:</strong> Akses input data, tidak bisa hapus
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving || !formUsername || !formFullName} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
