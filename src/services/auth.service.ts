/// <reference types="vite/client" />
import { apiClient } from '@/lib/axios'
import type { LoginResponse } from '@/types/auth.types'
import type { ApiResponse } from '@/types/api.types'

const BASE = '/api/v1/auth'

export const authService = {
  /** Email + password login */
  async login(email: string, password: string): Promise<LoginResponse['data']> {
    const { data } = await apiClient.post<LoginResponse>(`${BASE}/login`, { email, password })
    return data.data
  },

  /** Register new account */
  async register(params: {
    email: string
    password: string
    full_name: string
  }): Promise<{ message: string }> {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(`${BASE}/register`, params)
    return data.data
  },

  /** Send forgot-password email */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(`${BASE}/forgot-password`, { email })
    return data.data
  },

  /** Complete password reset */
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(`${BASE}/reset-password`, { token, password })
    return data.data
  },

  /** Verify email address */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(`${BASE}/verify-email`, { token })
    return data.data
  },

  /** Resend verification email */
  async resendVerification(email: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(`${BASE}/resend-verification`, { email })
    return data.data
  },

  /** Redirect to Google OAuth */
  async loginWithGoogle(): Promise<void> {
    window.location.href = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}${BASE}/google`
  },

  /** Get current session from cookie */
  async getSession(): Promise<LoginResponse['data'] | null> {
    try {
      const { data } = await apiClient.get<LoginResponse>(`${BASE}/session`)
      return data.data
    } catch {
      return null
    }
  },

  /** Get current user profile */
  async getMe() {
    const { data } = await apiClient.get<ApiResponse<LoginResponse['data']['user']>>(`${BASE}/me`)
    return data.data
  },

  /** Sign out and clear server cookie */
  async signOut(): Promise<void> {
    await apiClient.post(`${BASE}/sign-out`, {})
  },
}
