/// <reference types="vite/client" />
import { apiClient } from '@/lib/axios'
import type { LoginResponse, SessionResponse } from '@/types/auth.types'
import type { ApiResponse } from '@/types/api.types'

const BASE = '/api/v1/auth'

export const authService = {
  /** Email + password login — returns flat response (access_token at top level) */
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(`${BASE}/sign-in`, { email, password })
    return data
  },

  /** Register new account — POST /api/v1/auth/sign-up */
  async register(params: {
    email: string
    password: string
    full_name: string
  }): Promise<{ id: string; email: string; email_confirmed: boolean }> {
    const { data } = await apiClient.post<ApiResponse<{ id: string; email: string; email_confirmed: boolean }>>(
      `${BASE}/sign-up`,
      params,
    )
    return data.data
  },

  /** Send forgot-password email */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(`${BASE}/forgot-password`, { email })
    return { message: data.message }
  },

  /**
   * Complete password reset.
   * token — the access_token obtained from the reset-password email redirect URL.
   * It is sent as the Authorization Bearer header; only { password } goes in the body.
   */
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      `${BASE}/reset-password`,
      { password },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    return { message: data.message }
  },

  /** Resend email verification — POST /api/v1/auth/verify-email */
  async verifyEmail(email: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(`${BASE}/verify-email`, { email })
    return { message: data.message }
  },

  /** Alias for verifyEmail — both map to POST /api/v1/auth/verify-email */
  async resendVerification(email: string): Promise<{ message: string }> {
    return authService.verifyEmail(email)
  },

  /** Redirect to Google OAuth */
  async loginWithGoogle(): Promise<void> {
    window.location.href = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}${BASE}/google`
  },

  /** Get current session user from cookie-backed token */
  async getSession(): Promise<SessionResponse['data'] | null> {
    try {
      const { data } = await apiClient.get<SessionResponse>(`${BASE}/session`)
      return data.data
    } catch {
      return null
    }
  },

  /** Get current user profile */
  async getMe(): Promise<SessionResponse['data']> {
    const { data } = await apiClient.get<SessionResponse>(`${BASE}/me`)
    return data.data
  },

  /** Sign out and clear server cookie */
  async signOut(): Promise<void> {
    await apiClient.post(`${BASE}/sign-out`, {})
  },
}
