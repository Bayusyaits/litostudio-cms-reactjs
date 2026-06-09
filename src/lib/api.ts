// apps/cms/src/lib/api.ts
// Authenticated API client — reads the JWT from the cms_token cookie.
// No Supabase dependency.
import { SESSION_COOKIE } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly detail?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = new RegExp(String.raw`(?:^|;\s*)${SESSION_COOKIE}=([^;]+)`).exec(document.cookie)
  return match ? decodeURIComponent(match[1]) : null
}

function buildAuthHeader(): Record<string, string> {
  const token = getTokenFromCookie()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeader(),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(
      res.status,
      (body as { code?: string }).code ?? 'UNKNOWN',
      (body as { title?: string }).title ?? res.statusText,
      (body as { detail?: string }).detail,
    )
  }

  return res.json() as Promise<T>
}

export const api = {
  get<T>(path: string) { return request<T>(path) },
  post<T>(path: string, body: unknown) { return request<T>(path, { method: 'POST', body: JSON.stringify(body) }) },
  patch<T>(path: string, body: unknown) { return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }) },
  put<T>(path: string, body: unknown) { return request<T>(path, { method: 'PUT', body: JSON.stringify(body) }) },
  delete<T>(path: string) { return request<T>(path, { method: 'DELETE' }) },
}
