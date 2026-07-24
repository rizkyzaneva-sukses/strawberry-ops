'use client'

import Modal from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = 'Hapus', loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-[var(--color-text-muted)] mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>
          Batal
        </button>
        <button onClick={onConfirm} className="btn btn-danger btn-sm" disabled={loading}>
          {loading ? 'Menghapus...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
