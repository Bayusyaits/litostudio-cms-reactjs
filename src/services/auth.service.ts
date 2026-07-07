/// <reference types="vite/client" />
import { http } from '@litostudio/ui-cms'
import { withIdempotencyKey } from '@litostudio/ui-cms'
import type { LoginResponse, SessionResponse } from '@/types/auth.types'
import type { ApiResponse } from '@/types/api.types'

const BASE = '/api/v1/auth'

export const authService = {
  /** Email + password login — returns flat response (access_token at top level) */
  async login(email: string, password: string): Promise<LoginResponse> {
    return http.post<LoginResponse>(`${BASE}/sign-in`, { email, password })
  },

  /**
   * Register new account — POST /api/v1/auth/sign-up
   * Idempotency-keyed per email — a double-submitted signup form (or a
   * lost-response retry) reuses the same key instead of risking a confusing
   * second attempt.
   */
  async register(params: {
    email: string
    password: string
    full_name: string
  }): Promise<{ id: string; email: string; email_confirmed: boolean }> {
    return withIdempotencyKey(`sign-up:${params.email.toLowerCase()}`, async (headers) => {
      const res = await http.post<ApiResponse<{ id: string; email: string; email_confirmed: boolean }>>(
        `${BASE}/sign-up`,
        params,
        { headers },
      )
      return res.data
    })
  },

  /** Send forgot-password email. Idempotency-keyed per email — prevents a
   *  double-click on "Forgot password" sending two reset emails. */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return withIdempotencyKey(`forgot-password:${email.toLowerCase()}`, async (headers) => {
      const res = await http.post<{ success: boolean; message: string }>(`${BASE}/forgot-password`, { email }, { headers })
      return { message: res.message }
    })
  },

  /**
   * Complete password reset.
   * token — the access_token obtained from the reset-password email redirect URL.
   * It is sent as the Authorization Bearer header; only { password } goes in the body.
   */
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return withIdempotencyKey(`reset-password:${token}`, async (idempotencyHeaders) => {
      const res = await http.post<{ success: boolean; message: string }>(
        `${BASE}/reset-password`,
        { password },
        { headers: { Authorization: `Bearer ${token}`, ...idempotencyHeaders } },
      )
      return { message: res.message }
    })
  },

  /** Resend email verification — POST /api/v1/auth/verify-email */
  async verifyEmail(email: string): Promise<{ message: string }> {
    const res = await http.post<{ success: boolean; message: string }>(`${BASE}/verify-email`, { email })
    return { message: res.message }
  },

  /** Alias for verifyEmail — both map to POST /api/v1/auth/verify-email */
  async resendVerification(email: string): Promise<{ message: string }> {
    return authService.verifyEmail(email)
  },

  /**
   * Initiate Google OAuth (PKCE flow).
   * 1. Fetch the OAuth URL + code_verifier from the backend.
   * 2. Persist the verifier in sessionStorage (callback page retrieves it).
   * 3. Redirect the browser to Google's OAuth URL.
   */
  async loginWithGoogle(): Promise<void> {
    const callbackUrl = `${window.location.origin}/auth/callback`
    const res = await http.get<{
      success: boolean
      data: { url: string; code_verifier: string | null }
    }>(`${BASE}/google`, { params: { redirect_to: callbackUrl } })

    if (res.data.code_verifier) {
      sessionStorage.setItem('oauth_code_verifier', res.data.code_verifier)
    }

    window.location.href = res.data.url
  },

  /**
   * Exchange the OAuth authorization code for a session.
   * Called by the /auth/callback page after Google redirects back.
   */
  async exchangeOAuthCode(
    code: string,
    codeVerifier: string,
  ): Promise<{ access_token: string; refresh_token: string | null; expires_at: number; user: { id: string; email: string; full_name: string | null; avatar_url: string | null } }> {
    const res = await http.post<{
      success: boolean
      data: { access_token: string; refresh_token: string | null; expires_at: number; user: { id: string; email: string; full_name: string | null; avatar_url: string | null } }
    }>(`${BASE}/exchange-code`, { code, code_verifier: codeVerifier })
    return res.data
  },

  /**
   * Exchange a Supabase refresh_token for a new access_token + refresh_token pair.
   * Called by useTokenRefresh before the current access_token expires.
   */
  async refresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_at: number }> {
    return http.post<{ success: boolean; access_token: string; refresh_token: string; expires_at: number }>(
      `${BASE}/refresh`,
      { refresh_token: refreshToken },
    )
  },

  /** Get current session user from cookie-backed token */
  async getSession(): Promise<SessionResponse['data'] | null> {
    try {
      const res = await http.get<SessionResponse>(`${BASE}/session`)
      return res.data
    } catch {
      return null
    }
  },

  /** Get current user profile */
  async getMe(): Promise<SessionResponse['data']> {
    const res = await http.get<SessionResponse>(`${BASE}/me`)
    return res.data
  },

  /** Sign out and clear server cookie */
  async signOut(): Promise<void> {
    await http.post(`${BASE}/sign-out`, {})
  },

  /**
   * Patch user_metadata on the server (Supabase admin.updateUserById).
   * Only the supplied fields are changed — existing metadata is preserved.
   */
  async updateProfile(payload: { full_name?: string; onboarding_tasks?: string[] }): Promise<void> {
    await http.patch(`${BASE}/me`, payload)
  },
}
