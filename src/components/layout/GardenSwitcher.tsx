'use client'

import { useState } from 'react'
import { ALL_GARDENS, useGarden } from '@/components/GardenProvider'

export default function GardenSwitcher() {
  const { gardens, selection, activeGarden, loading, setSelection } = useGarden()
  const [open, setOpen] = useState(false)

  if (loading || gardens.length === 0) return null

  const label = activeGarden ? activeGarden.name : 'Semua Kebun'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-light)] text-sm hover:border-[var(--color-primary)] transition-colors"
        title="Ganti kebun"
      >
        <span>🌱</span>
        <span className="font-medium max-w-[9rem] truncate">{label}</span>
        <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-60 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg py-1 z-50">
            {gardens.map((garden) => (
              <button
                key={garden.id}
                onClick={() => {
                  setSelection(garden.id)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-surface-light)] ${
                  selection === garden.id ? 'text-[var(--color-primary)] font-medium' : ''
                }`}
              >
                <span className="block">{garden.name}</span>
                <span className="block text-xs text-[var(--color-text-muted)]">
                  {garden.hasInvestor ? 'Dengan investor' : 'Tanpa investor'}
                  {garden.blocks.length > 0 && ` · ${garden.blocks.length} blok`}
                </span>
              </button>
            ))}

            <div className="border-t border-[var(--color-border)] mt-1 pt-1">
              <button
                onClick={() => {
                  setSelection(ALL_GARDENS)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-surface-light)] ${
                  selection === ALL_GARDENS ? 'text-[var(--color-primary)] font-medium' : ''
                }`}
              >
                <span className="block">Semua Kebun</span>
                <span className="block text-xs text-[var(--color-text-muted)]">
                  Tampilan gabungan, input tetap per kebun
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
