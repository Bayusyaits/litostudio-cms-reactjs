/// <reference types="vite/client" />
import axios, { AxiosError } from 'axios'
import Cookies from 'js-cookie'

const SESSION_COOKIE = 'cms_token'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ── Request interceptor: attach Bearer token ──────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get(SESSION_COOKIE)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: normalise errors ────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove(SESSION_COOKIE)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// ── Typed helpers ─────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Record<string, unknown> | undefined
    if (typeof data?.title === 'string') return data.title
    if (typeof data?.message === 'string') return data.message
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}

export { SESSION_COOKIE }
