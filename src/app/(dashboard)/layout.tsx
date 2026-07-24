import { redirect } from 'next/navigation'
import { getUser } from '@/lib/session'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <DashboardLayout user={user}>
      {children}
    </DashboardLayout>
  )
}
