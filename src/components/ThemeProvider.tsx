'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: 'dark', toggle: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Nilai awal harus sama dengan render server ('dark') supaya tidak
  // ada hydration mismatch. Kelas <html> sendiri sudah benar sejak
  // awal berkat inline script di layout.tsx — ini cuma menyusulkan
  // state React (ikon/teks toggle) begitu mount.
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('strawberry-theme') as Theme | null
    const initial = saved || 'dark'
    setTheme(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
    setMounted(true)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('strawberry-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  // Prevent flash: render children but theme state may not be ready
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
