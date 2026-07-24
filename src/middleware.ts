import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/session'

const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/verify-otp',
]

const PUBLIC_PAGE_PATHS = [
  '/login',
  '/forgot-password',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicPage = PUBLIC_PAGE_PATHS.some((p) => pathname.startsWith(p))
  const isApiRoute = pathname.startsWith('/api/')
  const isPublicApi = PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))

  if (isPublicPage || pathname.startsWith('/_next') || pathname.startsWith('/uploads') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, sessionOptions)
  const isAuthenticated = !!session.userId

  if (!isApiRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isApiRoute && !isPublicApi && !isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
