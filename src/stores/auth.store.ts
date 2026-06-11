import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import type { User, LoginResponse } from '@/types/auth.types'
import { SESSION_COOKIE } from '@/lib/request'

type LoginUser = LoginResponse['user']

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean

  setAuth: (user: LoginUser, token: string, expiresAt: number) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,

      setAuth: (loginUser, token, expiresAt) => {
        const maxAge = expiresAt - Math.floor(Date.now() / 1000)
        // Guard against negative/zero maxAge (expired token edge-case)
        const safeDays = maxAge > 0 ? maxAge / 86400 : 1
        Cookies.set(SESSION_COOKIE, token, {
          expires:  safeDays,
          sameSite: 'Lax',
          secure:   location.protocol === 'https:',
        })
        // Normalise backend field `org_role` → store field `org_role`
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
    }),
    {
      name:    'cms-auth',
      partialize: (state) => ({
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
        // Do NOT persist token — read it from cookie on each request
      }),
    },
  ),
)
