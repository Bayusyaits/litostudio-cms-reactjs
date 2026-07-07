import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import type { User, LoginResponse } from '@/types/auth.types'
import { SESSION_COOKIE } from '@/lib/http/auth'

type LoginUser = LoginResponse['user']

// Keys used by our persisted Zustand stores — cleared on full logout
const PERSISTED_STORE_KEYS = ['cms-auth', 'cms-org', 'cms-website'] as const

/** Hard session TTL: 6 hours in milliseconds. After this the session is evicted
 *  even if the Supabase refresh_token is still valid. */
export const SESSION_DURATION_MS = 6 * 60 * 60 * 1_000

interface AuthStore {
  user: User | null
  token: string | null
  /** Supabase refresh_token — persisted so we can auto-refresh before expiry */
  refreshToken: string | null
  /** Unix timestamp (ms) when the current access_token expires */
  expiresAt: number | null
  /** Unix timestamp (ms) of the hard 6-hour session ceiling — set once at login */
  sessionExpiresAt: number | null
  isAuthenticated: boolean
  /** True once Zustand persist has finished rehydrating from localStorage */
  _hasHydrated: boolean

  setAuth: (user: LoginUser, token: string, expiresAt: number, refreshToken?: string | null) => void
  setUser: (user: User) => void
  /** Update access token + refresh token after a successful refresh call (no session reset). */
  updateTokens: (token: string, refreshToken: string, expiresAt: number) => void
  /**
   * Soft logout — clears auth state only. Use `fullLogout()` for the
   * complete eviction path (401, explicit sign-out).
   */
  logout: () => void
  /**
   * Full eviction — clears auth + org + website store persistence,
   * removes the session cookie, and optionally redirects to /login.
   *
   * This MUST be called on:
   *   - User-initiated logout
   *   - 401 Unauthorized responses on protected pages
   *   - Expired/revoked refresh tokens
   */
  fullLogout: (redirectTo?: string) => void
  setHasHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:             null,
      token:            null,
      refreshToken:     null,
      expiresAt:        null,
      sessionExpiresAt: null,
      isAuthenticated:  false,
      _hasHydrated:     false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setAuth: (loginUser, token, expiresAt, refreshToken = null) => {
        // Cookie lifetime = 6 hours (matches SESSION_DURATION_MS)
        const cookieDays = SESSION_DURATION_MS / 86_400_000
        Cookies.set(SESSION_COOKIE, token, {
          expires:  cookieDays,
          sameSite: 'Lax',
          secure:   location.protocol === 'https:',
        })
        const user: User = {
          id:         loginUser.id,
          email:      loginUser.email,
          full_name:  loginUser.full_name,
          avatar_url: loginUser.avatar_url,
          org_id:     loginUser.org_id,
          org_role:   loginUser.org_role,
        }
        // sessionExpiresAt is set ONCE at login — not renewed on refresh
        set({
          user,
          token,
          refreshToken:     refreshToken ?? null,
          expiresAt:        expiresAt * 1_000,  // convert from Unix seconds to ms
          sessionExpiresAt: Date.now() + SESSION_DURATION_MS,
          isAuthenticated:  true,
        })
      },

      updateTokens: (token, refreshToken, expiresAt) => {
        // Refresh cookie lifetime to another 6 hours from now
        const cookieDays = SESSION_DURATION_MS / 86_400_000
        Cookies.set(SESSION_COOKIE, token, {
          expires:  cookieDays,
          sameSite: 'Lax',
          secure:   location.protocol === 'https:',
        })
        set({
          token,
          refreshToken,
          expiresAt: expiresAt * 1_000,
          // sessionExpiresAt intentionally NOT updated — hard 6-hour ceiling
        })
      },

      setUser: (user) => set({ user }),

      logout: () => {
        Cookies.remove(SESSION_COOKIE)
        set({ user: null, token: null, refreshToken: null, expiresAt: null, sessionExpiresAt: null, isAuthenticated: false })
      },

      fullLogout: (redirectTo) => {
        // 1. Remove session cookie
        Cookies.remove(SESSION_COOKIE)

        // 2. Clear ALL persisted Zustand stores from localStorage to prevent
        //    stale state from being rehydrated on next load.
        //    This stops the auth loop: without this, isAuthenticated=true
        //    would be rehydrated → protected page loads → 401 → loop.
        for (const key of PERSISTED_STORE_KEYS) {
          try { localStorage.removeItem(key) } catch { /* SSR / private browsing */ }
        }

        // 3. Reset in-memory auth state (other stores reset on next reload)
        set({ user: null, token: null, refreshToken: null, expiresAt: null, sessionExpiresAt: null, isAuthenticated: false })

        // 4. Redirect (hard reload clears all React state + query cache)
        if (typeof window !== 'undefined') {
          const dest = redirectTo ?? '/login'
          // Hard navigation ensures React re-mounts from scratch — no stale
          // Zustand slices from memory remain.
          window.location.replace(dest)
        }
      },
    }),
    {
      name: 'cms-auth',
      partialize: (state) => ({
        user:             state.user,
        isAuthenticated:  state.isAuthenticated,
        // Persist refresh data so the token-refresh hook survives page reloads.
        // The access_token itself is NOT persisted — it lives in the cookie.
        refreshToken:     state.refreshToken,
        expiresAt:        state.expiresAt,
        sessionExpiresAt: state.sessionExpiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

/**
 * Convenience helper that can be called from non-React code (e.g. the HTTP
 * interceptor). Equivalent to `useAuthStore.getState().fullLogout(redirectTo)`.
 */
export function evictSession(redirectTo?: string): void {
  useAuthStore.getState().fullLogout(redirectTo)
}
