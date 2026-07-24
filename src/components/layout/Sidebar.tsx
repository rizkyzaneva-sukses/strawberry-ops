'use client'

import { useTheme } from '@/components/ThemeProvider'

interface SidebarProps {
  menus: { label: string; icon: string; href: string; active?: boolean }[]
  onNavigate: (href: string) => void
}

export default function Sidebar({ menus, onNavigate }: SidebarProps) {
  const { theme, toggle } = useTheme()

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-[var(--color-surface)] border-r border-[var(--color-border)] min-h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍓</span>
          <div>
            <h1 className="font-bold text-base">StrawberryOps</h1>
            <p className="text-xs text-[var(--color-text-muted)]">Manajemen Kebun Stroberi</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-3 px-3">
        {menus.map((menu, i) => (
          <button
            key={i}
            onClick={() => onNavigate(menu.href)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors ${
              menu.active
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-light)]'
            }`}
          >
            <span className="text-lg">{menu.icon}</span>
            <span>{menu.label}</span>
          </button>
        ))}
      </nav>

      {/* Theme Toggle at bottom */}
      <div className="p-3 border-t border-[var(--color-border)]">
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
      </div>
    </aside>
  )
}
