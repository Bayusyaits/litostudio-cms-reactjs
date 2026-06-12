import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import type { User, LoginResponse } from '@/types/auth.types'
import { SESSION_COOKIE } from '@/lib/request'

type LoginUser = LoginResponse['user']

// Keys used by our persisted Zustand stores — cleared on full logout
const PERSISTED_STORE_KEYS = ['cms-auth', 'cms-org', 'cms-website'] as const

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  /** True once Zustand persist has finished rehydrating from localStorage */
  _hasHydrated: boolean

  setAuth: (user: LoginUser, token: string, expiresAt: number) => void
  setUser: (user: User) => void
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
      user:            null,
      token:           null,
      isAuthenticated: false,
      _hasHydrated:    false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setAuth: (loginUser, token, expiresAt) => {
        const maxAge  = expiresAt - Math.floor(Date.now() / 1000)
        const safeDays = maxAge > 0 ? maxAge / 86400 : 1
        Cookies.set(SESSION_COOKIE, token, {
          expires:  safeDays,
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
        set({ user, token, isAuthenticated: true })
      },

      setUser: (user) => set({ user }),

      logout: () => {
        Cookies.remove(SESSION_COOKIE)
        set({ user: null, token: null, isAuthenticated: false })
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
        set({ user: null, token: null, isAuthenticated: false })

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
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
        // Do NOT persist token — read it from cookie on each request
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
