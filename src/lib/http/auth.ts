/**
 * auth.ts — token storage and auth-guard utilities.
 *
 * Centralises all cookie/token concerns so they're not scattered across
 * the request pipeline. SSR-safe: every browser API access is guarded
 * with typeof window / typeof document checks.
 */

import Cookies from 'js-cookie'

// ── Constants ─────────────────────────────────────────────────────────────

/** Name of the cookie that holds the Supabase access token */
export const SESSION_COOKIE = 'cms_token'

/** Fallback cookie lifetime when expiresAt is missing or in the past */
const FALLBACK_COOKIE_DAYS = 7

/**
 * URL path prefixes that must NOT trigger a redirect to /login on 401.
 *
 * A failed login POST itself returns 401 — we must stay on the page.
 * The /auth/* wildcard covers the OAuth callback and email-verify pages.
 */
const AUTH_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/email-verification',
  '/auth/',
] as const

// ── Auth-page detection ───────────────────────────────────────────────────

/**
 * Returns true when the current page is a public/auth route.
 * Safe to call during SSR — returns false when window is unavailable.
 */
export function isAuthPage(): boolean {
  if (typeof window === 'undefined') return false
  const { pathname } = window.location
  return AUTH_PATHS.some((p) => pathname.startsWith(p))
}

// ── Token helpers ─────────────────────────────────────────────────────────

/**
 * Read the stored access token from the session cookie.
 * Returns null during SSR or when no cookie is set.
 */
export function getStoredToken(): string | null {
  if (typeof document === 'undefined') return null
  return Cookies.get(SESSION_COOKIE) ?? null
}

/**
 * Persist the access token in a Lax/Secure cookie.
 *
 * @param token     - The Supabase access_token string
 * @param expiresAt - Unix timestamp (seconds) when the token expires
 */
export function setStoredToken(token: string, expiresAt: number): void {
  const remainingSecs = expiresAt - Math.floor(Date.now() / 1_000)
  const days          = remainingSecs > 0 ? remainingSecs / 86_400 : FALLBACK_COOKIE_DAYS
  Cookies.set(SESSION_COOKIE, token, {
    expires:  days,
    sameSite: 'Lax',
    // Secure flag only when served over HTTPS (not localhost)
    secure: typeof location !== 'undefined' && location.protocol === 'https:',
  })
}

/**
 * Delete the session cookie (on logout or 401 eviction).
 */
export function removeStoredToken(): void {
  Cookies.remove(SESSION_COOKIE)
}

// ── 401 handler ───────────────────────────────────────────────────────────

/**
 * Evict the session and redirect to /login when a 401 occurs on a
 * protected (non-auth) page.
 *
 * Safe during SSR — no-ops when window is unavailable.
 */
export function handleUnauthorized(status: number): void {
  if (status !== 401) return
  if (isAuthPage()) return
  if (typeof window === 'undefined') return
  removeStoredToken()
  window.location.href = '/login'
}
