'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="card max-w-md w-full text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          {error.message || 'Gagal memuat halaman. Silakan coba lagi.'}
        </p>
        <button onClick={reset} className="btn btn-primary">
          Coba Lagi
        </button>
      </div>
    </div>
  )
}
