'use client'

import { useRef, useState } from 'react'

interface FileUploadProps {
  label: string
  value?: string
  onChange: (path: string | null) => void
  accept?: string
}

export default function FileUpload({ label, value, onChange, accept = '.jpg,.jpeg,.png,.pdf' }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload gagal')
        return
      }

      onChange(data.path)
    } catch (err) {
      setError('Gagal mengupload file')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn btn-secondary btn-sm"
        >
          {uploading ? 'Mengupload...' : 'Pilih File'}
        </button>
        {value && (
          <div className="flex items-center gap-2">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--color-primary)] hover:underline truncate max-w-[200px]"
            >
              📎 Lihat File
            </a>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-[var(--color-accent)] hover:opacity-75 text-sm"
              aria-label="Hapus file"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[var(--color-accent)] mt-1">{error}</p>}
      <p className="text-xs text-[var(--color-text-muted)] mt-1">Maks 5MB. Format: JPG, PNG, PDF</p>
    </div>
  )
}
