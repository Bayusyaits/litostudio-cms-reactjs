/**
 * useTokenRefresh — proactively refreshes the Supabase access_token before it
 * expires, keeping the CMS session alive for up to 6 hours without the user
 * having to log in again.
 *
 * Strategy:
 *  - Runs on mount and every CHECK_INTERVAL_MS (60 s).
 *  - If the hard 6-hour session ceiling (sessionExpiresAt) has passed → fullLogout.
 *  - If the access_token expires within REFRESH_BUFFER_MS (5 min) → call
 *    POST /auth/refresh with the persisted refresh_token and store the new pair.
 *  - On refresh failure (expired/revoked refresh_token) → fullLogout.
 *
 * Mount this hook once in DashboardLayout — it covers all protected routes.
 */

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'

/** How often to check the token TTL */
const CHECK_INTERVAL_MS = 60_000       // 1 minute

/** Refresh the access_token when it expires within this window */
const REFRESH_BUFFER_MS = 5 * 60_000  // 5 minutes before expiry

export function useTokenRefresh(): void {
  const { refreshToken, expiresAt, sessionExpiresAt, isAuthenticated, updateTokens, fullLogout } =
    useAuthStore()

  // Keep a stable ref to the latest store values so the interval callback
  // always sees the current state without needing to be recreated.
  const stateRef = useRef({ refreshToken, expiresAt, sessionExpiresAt, isAuthenticated, updateTokens, fullLogout })
  useEffect(() => {
    stateRef.current = { refreshToken, expiresAt, sessionExpiresAt, isAuthenticated, updateTokens, fullLogout }
  })

  useEffect(() => {
    async function checkAndRefresh() {
      const { refreshToken, expiresAt, sessionExpiresAt, isAuthenticated, updateTokens, fullLogout } =
        stateRef.current

      // Not authenticated — nothing to do
      if (!isAuthenticated) return

      const now = Date.now()

      // ── Hard 6-hour session ceiling ──────────────────────────────────────
      if (sessionExpiresAt !== null && now >= sessionExpiresAt) {
        fullLogout('/login?reason=session_expired')
        return
      }

      // ── No refresh token → can't refresh; rely on cookie TTL ────────────
      if (!refreshToken) return

      // ── Proactive refresh when within REFRESH_BUFFER_MS of expiry ───────
      if (expiresAt !== null && now >= expiresAt - REFRESH_BUFFER_MS) {
        try {
          const result = await authService.refresh(refreshToken)
          updateTokens(result.access_token, result.refresh_token, result.expires_at)
        } catch (err) {
          console.warn('[useTokenRefresh] Refresh failed — logging out', err)
          fullLogout('/login?reason=session_expired')
        }
      }
    }

    // Run immediately on mount (catches the case where the user returns to the
    // tab after a long absence and the token has already expired)
    checkAndRefresh()

    const intervalId = setInterval(checkAndRefresh, CHECK_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [])  // empty deps — stateRef always carries the latest values
}
