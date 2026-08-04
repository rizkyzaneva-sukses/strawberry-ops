'use client'

import { useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { useGarden } from '@/components/GardenProvider'
import { usePathname } from 'next/navigation'
import { isActivePath, visibleGroups } from './menus'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  user: { id: number; username: string; role: string; fullName: string }
  onLogout: () => void
}

export default function MobileDrawer({ isOpen, onClose, user, onLogout }: MobileDrawerProps) {
  const { theme, toggle } = useTheme()
  const { activeGarden, gardens } = useGarden()
  const pathname = usePathname()

  const showInvestorMenus = activeGarden
    ? activeGarden.hasInvestor
    : gardens.some((garden) => garden.hasInvestor)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handleNavigate = (href: string) => {
    window.location.href = href
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-[var(--color-surface)] z-50 lg:hidden flex flex-col"
        style={{ animation: 'slideInLeft 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍓</span>
              <div>
                <h1 className="font-bold text-base">StrawberryOps</h1>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {activeGarden ? activeGarden.name : 'Semua Kebun'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--color-surface-light)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
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

        {/* User Info */}
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--color-primary)]">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-2 px-3">
          {visibleGroups(showInvestorMenus).map((group) => (
            <div key={group.title} className="mb-3">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {group.title}
              </p>
              {group.items.map((menu) => (
                <button
                  key={menu.href}
                  onClick={() => { handleNavigate(menu.href); onClose(); }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors ${
                    isActivePath(pathname, menu.href)
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-light)]'
                  }`}
                >
                  <span className="text-lg">{menu.icon}</span>
                  <span>{menu.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-[var(--color-border)]">
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-[var(--color-accent)] hover:bg-[var(--color-surface-light)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  )
}
