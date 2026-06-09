import type { OrgRole } from './api.types'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  org_id: string | null
  role: OrgRole | null
}

export interface Organization {
  id: string
  slug: string
  name: string
  plan: string
  status: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Site {
  id: string
  organization_id: string
  slug: string
  name: string
  domain: string | null
  status: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  data: {
    access_token: string
    expires_at: number
    user: User
  }
}
