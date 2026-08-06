'use client'

import { useTheme } from '@/components/ThemeProvider'
import { useGarden } from '@/components/GardenProvider'
import { usePathname, useRouter } from 'next/navigation'
import { isActivePath, visibleGroups } from './menus'

interface SidebarProps {
  user: { id: number; username: string; role: string; fullName: string }
  onLogout: () => void
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const { theme, toggle } = useTheme()
  const { activeGarden, gardens } = useGarden()
  const pathname = usePathname()
  const router = useRouter()

  // Mode gabungan tetap menampilkan menu modal selama ada kebun berinvestor.
  const showInvestorMenus = activeGarden
    ? activeGarden.hasInvestor
    : gardens.some((garden) => garden.hasInvestor)

  const handleNavigate = (href: string) => {
    router.push(href)
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-[var(--color-surface)] border-r border-[var(--color-border)] h-screen fixed top-0 left-0 z-30">
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍓</span>
          <div>
            <h1 className="font-bold text-base">StrawberryOps</h1>
            <p className="text-xs text-[var(--color-text-muted)]">
              {activeGarden ? activeGarden.name : 'Semua Kebun'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        {visibleGroups(showInvestorMenus).map((group) => (
          <div key={group.title} className="mb-3">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {group.title}
            </p>
            {group.items.map((menu) => (
              <button
                key={menu.href}
                onClick={() => handleNavigate(menu.href)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors ${
                  isActivePath(pathname, menu.href)
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-light)]'
                }`}
              >
                <span className="text-base">{menu.icon}</span>
                <span>{menu.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[var(--color-border)] space-y-1">
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-light)] transition-colors"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          <span>{theme === 'dark' ? 'Mode Terang ☀️' : 'Mode Gelap 🌙'}</span>
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-[var(--color-accent)] hover:bg-[var(--color-surface-light)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
