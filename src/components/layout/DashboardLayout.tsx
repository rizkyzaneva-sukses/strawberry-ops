'use client'

import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import Header from './Header'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: { id: number; username: string; role: string; fullName: string }
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="lg:pl-64">
        <Header user={user} onLogout={handleLogout} />
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
