'use client'

import { useRouter } from 'next/navigation'

const settingsMenus = [
  { label: '👤 Manajemen Users', desc: 'Kelola akun pengguna', href: '/pengaturan/users' },
  { label: '🏦 Rekening Bank', desc: 'Kelola data rekening', href: '/pengaturan/bank-accounts' },
  { label: '💲 Harga Komoditas', desc: 'Atur harga stroberi', href: '/pengaturan/commodity-prices' },
  { label: '🔐 Ganti Password', desc: 'Ubah password akun', href: '/pengaturan/change-password' },
  { label: '📋 Audit Log', desc: 'Riwayat aktivitas', href: '/pengaturan/audit-logs' },
]

export default function PengaturanPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Kelola pengaturan aplikasi</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsMenus.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="card text-left hover:border-[var(--color-primary)] transition-colors cursor-pointer"
          >
            <div className="text-2xl mb-2">{item.label.split(' ')[0]}</div>
            <h3 className="font-medium">{item.label.split(' ').slice(1).join(' ')}</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
