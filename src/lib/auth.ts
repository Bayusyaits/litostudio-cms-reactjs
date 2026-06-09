// apps/cms/src/lib/auth.ts
// JWT session helpers — no Supabase dependency.
// The CMS stores the Supabase JWT returned by the backend in a cookie so the
// backend can validate it on every authenticated request.

export const SESSION_COOKIE = 'cms_token'
export const VERIFIER_COOKIE = 'cms_pkce_verifier'

// ── Cookie write (Route Handlers / Server Actions only) ──────────────────────

export function setSessionCookie(token: string, expiresAt: number): string {
  const maxAge = expiresAt - Math.floor(Date.now() / 1000)
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly`
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`
}

export function setVerifierCookie(verifier: string): string {
  return `${VERIFIER_COOKIE}=${encodeURIComponent(verifier)}; Path=/; Max-Age=300; SameSite=Lax; HttpOnly`
}

export function clearVerifierCookie(): string {
  return `${VERIFIER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`
}

// ── JWT decode (client-safe — no signature verification) ─────────────────────

interface JwtPayload {
  sub?: string
  exp?: number
  email?: string
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token)
  if (!payload?.exp) return true
  // 10-second buffer to avoid edge-case race
  return payload.exp < Math.floor(Date.now() / 1000) + 10
}
