'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const typeStyles: Record<ToastType, string> = {
    success: 'border-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_8%,var(--color-surface))] text-[var(--color-text)]',
    error: 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-surface))] text-[var(--color-text)]',
    warning: 'border-[var(--color-warning)] bg-[color-mix(in_srgb,var(--color-warning)_8%,var(--color-surface))] text-[var(--color-text)]',
    info: 'border-[var(--color-info)] bg-[color-mix(in_srgb,var(--color-info)_8%,var(--color-surface))] text-[var(--color-text)]',
  }

  const typeIconColors: Record<ToastType, string> = {
    success: 'text-[var(--color-success)]',
    error: 'text-[var(--color-accent)]',
    warning: 'text-[var(--color-warning)]',
    info: 'text-[var(--color-info)]',
  }

  const typeIcons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-[slideIn_0.2s_ease-out] ${typeStyles[t.type]}`}
          >
            <span className={`text-sm font-bold mt-0.5 ${typeIconColors[t.type]}`}>{typeIcons[t.type]}</span>
            <p className="flex-1 text-sm">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
