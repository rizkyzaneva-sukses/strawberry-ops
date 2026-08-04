'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export interface Block {
  id: number
  name: string
  gardenId: number
}

export interface Garden {
  id: number
  name: string
  code: string
  hasInvestor: boolean
  blocks: Block[]
}

/** Nilai kebun aktif saat mode konsolidasi seluruh kebun. */
export const ALL_GARDENS = 'all'

type GardenSelection = number | typeof ALL_GARDENS

interface GardenContextValue {
  gardens: Garden[]
  /** Kebun yang sedang dilihat, atau 'all' untuk gabungan. */
  selection: GardenSelection
  /** Kebun aktif sebagai objek. null saat mode gabungan. */
  activeGarden: Garden | null
  loading: boolean
  setSelection: (value: GardenSelection) => void
  /** Menempelkan gardenId ke query string sebuah endpoint. */
  withGarden: (path: string) => string
  refresh: () => Promise<void>
}

const GardenContext = createContext<GardenContextValue | null>(null)

const STORAGE_KEY = 'strawberry-ops:garden'

export function GardenProvider({ children }: { children: React.ReactNode }) {
  const [gardens, setGardens] = useState<Garden[]>([])
  const [selection, setSelectionState] = useState<GardenSelection>(ALL_GARDENS)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/gardens')
      if (!res.ok) return
      const data = await res.json()
      const items: Garden[] = data.items || []
      setGardens(items)

      // Pilihan terakhir dipertahankan selama kebunnya masih ada.
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
      if (stored === ALL_GARDENS) {
        setSelectionState(ALL_GARDENS)
      } else if (stored && items.some((garden) => garden.id === Number(stored))) {
        setSelectionState(Number(stored))
      } else if (items.length > 0) {
        setSelectionState(items[0].id)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setSelection = useCallback((value: GardenSelection) => {
    setSelectionState(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(value))
    }
  }, [])

  const value = useMemo<GardenContextValue>(() => {
    const activeGarden =
      selection === ALL_GARDENS ? null : gardens.find((garden) => garden.id === selection) ?? null

    return {
      gardens,
      selection,
      activeGarden,
      loading,
      setSelection,
      withGarden: (path: string) => {
        const separator = path.includes('?') ? '&' : '?'
        return `${path}${separator}gardenId=${selection}`
      },
      refresh,
    }
  }, [gardens, selection, loading, setSelection, refresh])

  return <GardenContext.Provider value={value}>{children}</GardenContext.Provider>
}

export function useGarden() {
  const context = useContext(GardenContext)
  if (!context) throw new Error('useGarden harus dipakai di dalam GardenProvider')
  return context
}
