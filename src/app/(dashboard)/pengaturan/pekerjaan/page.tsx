'use client'

import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface JobType {
  id: number
  name: string
  code: string
  sortOrder: number
}

export default function PekerjaanPage() {
  const [jobTypes, setJobTypes] = useState<JobType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formName, setFormName] = useState('')
  const [formError, setFormError] = useState('')

  const fetchJobTypes = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/job-types')
    const data = await res.json()
    setJobTypes(data.items || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchJobTypes() }, [fetchJobTypes])

  async function handleSave() {
    if (!formName) return
    setSaving(true)
    setFormError('')

    const res = await fetch('/api/job-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formName }),
    })

    if (res.ok) {
      setShowForm(false)
      setFormName('')
      fetchJobTypes()
    } else {
      const data = await res.json().catch(() => ({}))
      setFormError(data.error || 'Gagal menambah jenis pekerjaan')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Jenis Pekerjaan</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Dipakai saat input gaji harian dan laporan produktivitas
          </p>
        </div>
        <button onClick={() => { setFormError(''); setShowForm(true) }} className="btn btn-primary">
          + Tambah Pekerjaan
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Memuat data...</p>
        ) : jobTypes.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">Belum ada jenis pekerjaan</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {jobTypes.map((job) => (
              <div key={job.id} className="p-3 rounded-lg bg-[var(--color-secondary)]">
                <p className="text-sm font-medium">{job.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{job.code}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Tambah Jenis Pekerjaan">
        <div className="space-y-4">
          <FormField label="Nama Pekerjaan" required>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Sortir Panen"
            />
          </FormField>

          {formError && <p className="text-sm text-[var(--color-accent)]">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving || !formName} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
