// apps/cms/src/app/(auth)/auth/callback/route.ts
// OAuth callback — exchanges the authorization code via the backend and sets
// an httpOnly session cookie. No Supabase dependency in the CMS.
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  VERIFIER_COOKIE,
  setSessionCookie,
  clearVerifierCookie,
} from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?error=missing_code`)
  }

  const codeVerifier = request.cookies.get(VERIFIER_COOKIE)?.value

  if (!codeVerifier) {
    return NextResponse.redirect(`${origin}/auth/error?error=missing_verifier`)
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/exchange-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, code_verifier: codeVerifier }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { title?: string }
      const msg = body.title ?? 'exchange_failed'
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(msg)}`)
    }

    const { data } = await res.json() as {
      data: { access_token: string; expires_at: number }
    }

    const response = NextResponse.redirect(`${origin}${next}`)
    response.headers.append('Set-Cookie', setSessionCookie(data.access_token, data.expires_at))
    response.headers.append('Set-Cookie', clearVerifierCookie())
    return response
  } catch {
    return NextResponse.redirect(`${origin}/auth/error?error=exchange_failed`)
  }
}
