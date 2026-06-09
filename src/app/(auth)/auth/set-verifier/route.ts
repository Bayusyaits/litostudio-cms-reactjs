// apps/cms/src/app/(auth)/auth/set-verifier/route.ts
// Tiny server route called by the login page client-side to persist the PKCE
// code_verifier in an httpOnly cookie before the OAuth redirect begins.
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { setVerifierCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { verifier?: string } | null
  const verifier = body?.verifier

  if (!verifier || typeof verifier !== 'string') {
    return NextResponse.json({ error: 'missing_verifier' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  response.headers.set('Set-Cookie', setVerifierCookie(verifier))
  return response
}
