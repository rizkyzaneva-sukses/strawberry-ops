'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import { formatDate } from '@/lib/utils'

interface Revision {
  id: number
  title: string
  description: string | null
  images: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  user: { id: number; fullName: string; username: string }
}

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Rendah', color: 'badge-info' },
  MEDIUM: { label: 'Sedang', color: 'badge-warning' },
  HIGH: { label: 'Tinggi', color: 'badge-danger' },
  URGENT: { label: 'Mendesak', color: 'badge-danger' },
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  OPEN: { label: 'Open', color: 'badge-warning', icon: '○' },
  IN_PROGRESS: { label: 'Dikerjakan', color: 'badge-info', icon: '◐' },
  DONE: { label: 'Selesai', color: 'badge-success', icon: '●' },
}

export default function RevisiPage() {
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [imageUploadLoading, setImageUploadLoading] = useState(false)

  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPriority, setFormPriority] = useState('MEDIUM')
  const [formImages, setFormImages] = useState<string[]>([])
  const [formStatus, setFormStatus] = useState('OPEN')

  const pasteAreaRef = useRef<HTMLDivElement>(null)

  const fetchRevisions = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/revisions')
    const data = await res.json()
    setRevisions(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRevisions() }, [fetchRevisions])

  const filteredRevisions = filterStatus
    ? revisions.filter(r => r.status === filterStatus)
    : revisions

  const stats = {
    total: revisions.length,
    open: revisions.filter(r => r.status === 'OPEN').length,
    inProgress: revisions.filter(r => r.status === 'IN_PROGRESS').length,
    done: revisions.filter(r => r.status === 'DONE').length,
  }

  function openForm(revision?: Revision) {
    if (revision) {
      setEditId(revision.id)
      setFormTitle(revision.title)
      setFormDescription(revision.description || '')
      setFormPriority(revision.priority)
      setFormStatus(revision.status)
      try {
        setFormImages(JSON.parse(revision.images || '[]'))
      } catch {
        setFormImages([])
      }
    } else {
      setEditId(null)
      setFormTitle('')
      setFormDescription('')
      setFormPriority('MEDIUM')
      setFormStatus('OPEN')
      setFormImages([])
    }
    setShowForm(true)
  }

  async function handleSave() {
    if (!formTitle.trim()) return
    setSaving(true)
    const body = {
      title: formTitle,
      description: formDescription || null,
      priority: formPriority,
      status: formStatus,
      images: JSON.stringify(formImages),
    }
    const url = editId ? `/api/revisions/${editId}` : '/api/revisions'
    const res = await fetch(url, {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setShowForm(false)
      fetchRevisions()
    }
    setSaving(false)
  }

  async function toggleStatus(revision: Revision) {
    const nextStatus = revision.status === 'DONE' ? 'OPEN' : revision.status === 'OPEN' ? 'IN_PROGRESS' : 'DONE'
    await fetch(`/api/revisions/${revision.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    fetchRevisions()
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus revisi ini?')) return
    await fetch(`/api/revisions/${id}`, { method: 'DELETE' })
    fetchRevisions()
  }

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData()
    formData.append('file', file)
    setImageUploadLoading(true)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.path) return data.path
      return null
    } catch {
      return null
    } finally {
      setImageUploadLoading(false)
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          uploadImage(file).then(path => {
            if (path) {
              setFormImages(prev => [...prev, path])
            }
          })
        }
        return
      }
    }
  }

  function removeImage(index: number) {
    setFormImages(prev => prev.filter((_, i) => i !== index))
  }

  async function handleQuickToggle(revision: Revision) {
    const nextStatus = revision.status === 'DONE' ? 'OPEN' : revision.status === 'OPEN' ? 'IN_PROGRESS' : 'DONE'
    await fetch(`/api/revisions/${revision.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    fetchRevisions()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Revisi & Usulan Fitur</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Kelola usulan fitur dan revisi untuk developer</p>
        </div>
        <button onClick={() => openForm()} className="btn btn-primary">+ Tambah Revisi</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center cursor-pointer hover:border-[var(--color-primary)] transition-colors" onClick={() => setFilterStatus('')}>
          <p className="text-xs text-[var(--color-text-muted)]">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="card text-center cursor-pointer hover:border-[var(--color-primary)] transition-colors" onClick={() => setFilterStatus(filterStatus === 'OPEN' ? '' : 'OPEN')}>
          <p className="text-xs text-[var(--color-text-muted)]">Open</p>
          <p className="text-2xl font-bold text-[var(--color-accent)]">{stats.open}</p>
        </div>
        <div className="card text-center cursor-pointer hover:border-[var(--color-primary)] transition-colors" onClick={() => setFilterStatus(filterStatus === 'IN_PROGRESS' ? '' : 'IN_PROGRESS')}>
          <p className="text-xs text-[var(--color-text-muted)]">Dikerjakan</p>
          <p className="text-2xl font-bold text-[var(--color-info)]">{stats.inProgress}</p>
        </div>
        <div className="card text-center cursor-pointer hover:border-[var(--color-primary)] transition-colors" onClick={() => setFilterStatus(filterStatus === 'DONE' ? '' : 'DONE')}>
          <p className="text-xs text-[var(--color-text-muted)]">Selesai</p>
          <p className="text-2xl font-bold text-[var(--color-success)]">{stats.done}</p>
        </div>
      </div>

      {/* Revision List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="spinner" />
        </div>
      ) : filteredRevisions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-lg font-medium">Belum ada revisi</p>
          <p className="text-sm text-[var(--color-text-muted)]">Klik &quot;+ Tambah Revisi&quot; untuk menambahkan usulan fitur baru</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRevisions.map((revision) => {
            let images: string[] = []
            try { images = JSON.parse(revision.images || '[]') } catch { /* ignore */ }

            return (
              <div
                key={revision.id}
                className={`card transition-all ${
                  revision.status === 'DONE' ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleQuickToggle(revision)}
                    className="mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                    style={{
                      borderColor: revision.status === 'DONE' ? 'var(--color-success)' : revision.status === 'IN_PROGRESS' ? 'var(--color-info)' : 'var(--color-border)',
                      backgroundColor: revision.status === 'DONE' ? 'var(--color-success)' : 'transparent',
                    }}
                    title={revision.status === 'DONE' ? 'Klik untuk buka' : revision.status === 'OPEN' ? 'Klik untuk mulai' : 'Klik untuk selesai'}
                  >
                    {revision.status === 'DONE' && (
                      <span className="text-[var(--color-on-success)] text-xs font-bold">✓</span>
                    )}
                    {revision.status === 'IN_PROGRESS' && (
                      <span className="text-[var(--color-info)] text-xs">◐</span>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-base ${revision.status === 'DONE' ? 'line-through text-[var(--color-text-muted)]' : ''}`}>
                          {revision.title}
                        </h3>
                        {revision.description && (
                          <p className="text-sm text-[var(--color-text-muted)] mt-1 whitespace-pre-wrap">
                            {revision.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`badge ${PRIORITY_LABELS[revision.priority]?.color || 'badge-info'}`}>
                          {PRIORITY_LABELS[revision.priority]?.label || revision.priority}
                        </span>
                        <span className={`badge ${STATUS_LABELS[revision.status]?.color || 'badge-info'}`}>
                          {STATUS_LABELS[revision.status]?.icon} {STATUS_LABELS[revision.status]?.label || revision.status}
                        </span>
                      </div>
                    </div>

                    {/* Images */}
                    {images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {images.map((img, i) => (
                          <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                            <img
                              src={img}
                              alt={`Lampiran ${i + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                            />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-text-muted)]">
                      <span>oleh {revision.user.fullName}</span>
                      <span>{formatDate(revision.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => openForm(revision)} className="text-[var(--color-primary)] hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(revision.id)} className="text-[var(--color-accent)] hover:underline text-xs">Hapus</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Revisi' : 'Tambah Revisi Baru'} maxWidth="max-w-2xl">
        <div className="space-y-4">
          <FormField label="Judul" required>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Contoh: Tambah fitur cetak struk"
            />
          </FormField>

          <FormField label="Deskripsi">
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Jelaskan detail revisi atau usulan fitur..."
              rows={4}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prioritas">
              <select value={formPriority} onChange={(e) => setFormPriority(e.target.value)}>
                <option value="LOW">Rendah</option>
                <option value="MEDIUM">Sedang</option>
                <option value="HIGH">Tinggi</option>
                <option value="URGENT">Mendesak</option>
              </select>
            </FormField>

            {editId && (
              <FormField label="Status">
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">Dikerjakan</option>
                  <option value="DONE">Selesai</option>
                </select>
              </FormField>
            )}
          </div>

          {/* Image Upload Area */}
          <FormField label="Lampiran Gambar">
            <div
              ref={pasteAreaRef}
              onPaste={handlePaste}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[var(--color-primary)]', 'bg-[var(--color-primary)]/5') }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('border-[var(--color-primary)]', 'bg-[var(--color-primary)]/5') }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-[var(--color-primary)]', 'bg-[var(--color-primary)]/5')
                const files = e.dataTransfer.files
                if (files.length > 0) {
                  Array.from(files).forEach(file => {
                    if (file.type.startsWith('image/')) uploadImage(file).then(path => { if (path) setFormImages(prev => [...prev, path]) })
                  })
                }
              }}
              className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-4 text-center cursor-text hover:border-[var(--color-primary)] transition-colors min-h-[100px]"
              tabIndex={0}
            >
              {imageUploadLoading ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <div className="spinner" />
                  <span className="text-sm text-[var(--color-text-muted)]">Mengupload...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    <span className="font-medium text-[var(--color-primary)]">Ctrl+V</span> paste, seret gambar, atau
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <label className="btn btn-primary text-sm cursor-pointer">
                      📁 Pilih dari Galeri
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files
                          if (files) {
                            Array.from(files).forEach(file => {
                              uploadImage(file).then(path => { if (path) setFormImages(prev => [...prev, path]) })
                            })
                          }
                          e.target.value = ''
                        }}
                      />
                    </label>
                    <label className="btn btn-secondary text-sm cursor-pointer">
                      📷 Ambil Foto
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files
                          if (files) {
                            Array.from(files).forEach(file => {
                              uploadImage(file).then(path => { if (path) setFormImages(prev => [...prev, path]) })
                            })
                          }
                          e.target.value = ''
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    JPG, PNG, maks 5MB per file
                  </p>
                </div>
              )}
            </div>

            {/* Image Previews */}
            {formImages.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {formImages.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img}
                      alt={`Lampiran ${i + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border border-[var(--color-border)]"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving || !formTitle.trim()} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
