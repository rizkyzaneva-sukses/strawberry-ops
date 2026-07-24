'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface MenuItem {
  href: string
  label: string
  icon: string
  roles?: string[]
}

interface MenuGroup {
  label: string
  items: MenuItem[]
  roles?: string[]
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Utama',
    items: [
      { href: '/', label: 'Dashboard', icon: '📊' },
      { href: '/gaji', label: 'Rekap Gaji', icon: '💰' },
      { href: '/pengeluaran', label: 'Pengeluaran', icon: '📤' },
      { href: '/pendapatan', label: 'Pendapatan Panen', icon: '🍓' },
    ],
  },
  {
    label: 'Data',
    items: [
      { href: '/karyawan', label: 'Database Karyawan', icon: '👥' },
      { href: '/revisi', label: 'Revisi & Usulan', icon: '📝' },
      { href: '/panduan', label: 'Panduan & Workflow', icon: '📖' },
    ],
  },
  {
    label: 'Pengaturan',
    roles: ['OWNER', 'MANAGER'],
    items: [
      { href: '/pengaturan/users', label: 'Kelola User', icon: '🔑', roles: ['OWNER'] },
      { href: '/pengaturan/bank-accounts', label: 'Rekening Bank', icon: '🏦' },
      { href: '/pengaturan/commodity-prices', label: 'Harga Komoditas', icon: '💲' },
      { href: '/pengaturan/audit-logs', label: 'Log Aktivitas', icon: '📋', roles: ['OWNER'] },
    ],
  },
]

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  user: { fullName: string; role: string }
  onLogout: () => void
}

export default function MobileDrawer({ isOpen, onClose, user, onLogout }: MobileDrawerProps) {
  const pathname = usePathname()

  const filteredGroups = menuGroups
    .filter(group => !group.roles || group.roles.includes(user.role))
    .map(group => ({
      ...group,
      items: group.items.filter(item => !item.roles || item.roles.includes(user.role)),
    }))
    .filter(group => group.items.length > 0)

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 lg:hidden"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 left-0 w-72 bg-[var(--color-surface)] z-50 lg:hidden overflow-y-auto shadow-xl flex flex-col">
        <div className="flex items-center gap-3 px-4 h-16 border-b border-[var(--color-border)] shrink-0">
          <span className="text-2xl">🍓</span>
          <div>
            <h1 className="font-bold text-sm">StrawberryOps</h1>
            <p className="text-xs text-[var(--color-text-muted)]">Kebun Stroberi</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <h3 className="px-3 mb-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)]'
                      )}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--color-primary)]">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{user.role}</p>
            </div>
            <button
              onClick={() => { onClose(); onLogout(); }}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
              title="Logout"
            >
              ⎋
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
