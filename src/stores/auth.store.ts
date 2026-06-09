import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import type { User } from '@/types/auth.types'
import { SESSION_COOKIE } from '@/lib/axios'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean

  setAuth: (user: User, token: string, expiresAt: number) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,

      setAuth: (user, token, expiresAt) => {
        const maxAge = expiresAt - Math.floor(Date.now() / 1000)
        Cookies.set(SESSION_COOKIE, token, {
          expires:  maxAge / 86400,
          sameSite: 'Lax',
          secure:   location.protocol === 'https:',
        })
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
        // Do NOT persist token — read it from cookie
      }),
    },
  ),
)
