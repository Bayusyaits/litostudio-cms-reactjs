// apps/cms/src/middleware.ts
// Protect all dashboard routes — reads cms_token cookie, checks JWT expiry.
// No Supabase dependency; the backend validates the token on actual API calls.
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, isTokenExpired } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/auth/callback', '/auth/error']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value

  if (!token || isTokenExpired(token)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (pathname !== '/') {
      url.searchParams.set('redirectTo', pathname)
    }
    const response = NextResponse.redirect(url)
    // Clear stale cookie on redirect
    if (token) {
      response.cookies.delete(SESSION_COOKIE)
    }
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    String.raw`/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`,
  ],
}
