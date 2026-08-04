'use client'

import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField from '@/components/ui/FormField'
import { useGarden } from '@/components/GardenProvider'

interface Block {
  id: number
  gardenId: number
  name: string
  notes: string | null
  sortOrder: number
  garden: { id: number; name: string }
}

export default function BlokPage() {
  const { gardens, refresh } = useGarden()

  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [formGardenId, setFormGardenId] = useState('')
  const [formName, setFormName] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const fetchBlocks = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/blocks')
    const data = await res.json()
    setBlocks(data.items || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchBlocks() }, [fetchBlocks])

  function openForm(gardenId: number, block?: Block) {
    setFormError('')
    setFormGardenId(String(gardenId))
    if (block) {
      setEditId(block.id)
      setFormName(block.name)
      setFormNotes(block.notes || '')
    } else {
      setEditId(null)
      setFormName('')
      setFormNotes('')
    }
    setShowForm(true)
  }

  async function handleSave() {
    if (!formName || !formGardenId) return
    setSaving(true)
    setFormError('')

    const res = await fetch(editId ? `/api/blocks/${editId}` : '/api/blocks', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gardenId: parseInt(formGardenId),
        name: formName,
        notes: formNotes || null,
      }),
    })

    if (res.ok) {
      setShowForm(false)
      fetchBlocks()
      refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setFormError(data.error || 'Gagal menyimpan blok')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    await fetch(`/api/blocks/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null)
    setSaving(false)
    fetchBlocks()
    refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kebun &amp; Blok</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Blok dipakai untuk mencatat gaji dan panen lebih detail per bagian kebun
        </p>
      </div>

      {loading && <div className="card text-[var(--color-text-muted)]">Memuat data...</div>}

      {!loading && gardens.map((garden) => {
        const gardenBlocks = blocks.filter((block) => block.gardenId === garden.id)
        return (
          <div key={garden.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold">{garden.name}</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {garden.hasInvestor ? 'Dengan investor' : 'Tanpa investor'} · {gardenBlocks.length} blok
                </p>
              </div>
              <button onClick={() => openForm(garden.id)} className="btn btn-primary">+ Tambah Blok</button>
            </div>

            {gardenBlocks.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-2">
                Belum ada blok. Tambahkan agar bisa dipilih saat input gaji dan panen.
              </p>
            ) : (
              <div className="space-y-2">
                {gardenBlocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-secondary)]">
                    <div>
                      <p className="text-sm font-medium">{block.name}</p>
                      {block.notes && (
                        <p className="text-xs text-[var(--color-text-muted)]">{block.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => openForm(garden.id, block)} className="text-[var(--color-primary)] hover:underline text-sm">Edit</button>
                      <button onClick={() => setDeleteId(block.id)} className="text-[var(--color-accent)] hover:underline text-sm">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Blok' : 'Tambah Blok'}>
        <div className="space-y-4">
          <FormField label="Kebun" required>
            <select value={formGardenId} onChange={(e) => setFormGardenId(e.target.value)} disabled={!!editId}>
              {gardens.map((garden) => <option key={garden.id} value={garden.id}>{garden.name}</option>)}
            </select>
          </FormField>
          <FormField label="Nama Blok" required>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Blok A" />
          </FormField>
          <FormField label="Catatan">
            <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} placeholder="Luas, jumlah bedeng, dll" />
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

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Blok"
        message="Blok yang sudah dipakai catatan gaji atau panen akan dinonaktifkan, bukan dihapus."
        loading={saving}
      />
    </div>
  )
}
