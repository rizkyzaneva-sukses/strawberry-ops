import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export type SessionData = {
  userId?: number
  username?: string
  role?: string
  fullName?: string
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'strawberry-ops-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

export async function getUser() {
  const session = await getSession()
  if (!session.userId) return null
  return {
    id: session.userId,
    username: session.username!,
    role: session.role!,
    fullName: session.fullName!,
  }
}
