'use client'

import { useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'

interface HeaderProps {
  user: { fullName: string; role: string }
  onLogout: () => void
  onMenuToggle?: () => void
}

export default function Header({ user, onLogout, onMenuToggle }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false)
  const { theme, toggle } = useTheme()

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-surface)]/80 backdrop-blur-sm border-b border-[var(--color-border)]">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={onMenuToggle}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-light)] transition-colors"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-xl">🍓</span>
          <h1 className="font-bold text-sm">StrawberryOps</h1>
        </div>

        <div className="hidden lg:block" />

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-light)] transition-colors text-[var(--color-text-muted)]"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
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
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 text-sm"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                {user.fullName.charAt(0)}
              </div>
              <span className="hidden sm:inline text-[var(--color-text-muted)]">{user.fullName}</span>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-[var(--color-border)]">
                    <p className="text-sm font-medium">{user.fullName}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{user.role}</p>
                  </div>
                  <a
                    href="/pengaturan/change-password"
                    onClick={() => setShowMenu(false)}
                    className="block px-3 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-light)]"
                  >
                    Ubah Password
                  </a>
                  <button
                    onClick={() => { setShowMenu(false); onLogout(); }}
                    className="w-full text-left px-3 py-2 text-sm text-[var(--color-accent)] hover:bg-[var(--color-surface-light)]"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
