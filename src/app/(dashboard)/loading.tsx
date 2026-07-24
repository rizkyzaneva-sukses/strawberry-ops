export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
        <p className="text-sm text-[var(--color-text-muted)]">Memuat...</p>
      </div>
    </div>
  )
}
