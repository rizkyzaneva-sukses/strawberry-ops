import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center space-y-4">
        <div className="text-6xl">🍓</div>
        <h1 className="text-3xl font-bold">404</h1>
        <h2 className="text-xl font-semibold text-[var(--color-text-muted)]">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <Link href="/" className="btn btn-primary inline-block">
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}
