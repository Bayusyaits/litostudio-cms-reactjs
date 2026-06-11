import type { OrgRole } from './api.types'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  // org_id and org_role are populated from the sign-in response (org membership
  // resolved server-side) and may be null for users with no org yet.
  org_id: string | null
  // Backend sign-in returns `org_role`; older code used `role`. Accept both.
  org_role?: OrgRole | null
  /** @deprecated Use org_role instead */
  role?: OrgRole | null
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

// Flat response from POST /api/v1/auth/sign-in
export interface LoginResponse {
  success: boolean
  access_token: string
  refresh_token: string
  expires_at: number
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    org_id: string | null
    org_role: OrgRole | null
  }
}

// Response from GET /api/v1/auth/session and GET /api/v1/auth/me
export interface SessionResponse {
  success: boolean
  data: {
    id: string
    email: string
    email_verified: boolean
    provider: string
    full_name: string | null
    avatar_url: string | null
    org_id: string | null
    org_role: OrgRole | null
  }
}
