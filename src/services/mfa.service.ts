// apps/cms/src/services/mfa.service.ts
// TOTP MFA — same /api/v1/auth/mfa/* routes cms-superadmin's LoginPage.tsx
// already uses (auth.mfa.routes.ts is "not SA-specific by construction").
// Tenant CMS doesn't gate LOGIN on MFA (that's cms-superadmin-only), but
// dev-spec-promo-tier1-display-multisite-mfa-2026-07-15.md, Workstream H
// (Requirement #11) requires a step-up confirmation on high-impact
// promotion actions (activate, org-wide, delete) — this service backs that
// confirm dialog, not the login flow.
import { http } from '@litostudio/ui-cms'
import type { MfaFactor, MfaChallenge, MfaEnrollment, MfaVerifyResponse } from '@litostudio/ui-cms'

const BASE = '/api/v1/auth'

export const mfaService = {
  factors(accessToken: string, refreshToken: string): Promise<MfaFactor[]> {
    return http
      .post<{ success: boolean; data: { factors: MfaFactor[] } }>(`${BASE}/mfa/factors`, {
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      .then((res) => res.data.factors)
  },

  enroll(accessToken: string, refreshToken: string): Promise<MfaEnrollment> {
    return http
      .post<{ success: boolean; data: MfaEnrollment }>(`${BASE}/mfa/enroll`, {
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      .then((res) => res.data)
  },

  challenge(accessToken: string, refreshToken: string, factorId: string): Promise<MfaChallenge> {
    return http
      .post<{ success: boolean; data: MfaChallenge }>(`${BASE}/mfa/challenge`, {
        access_token: accessToken,
        refresh_token: refreshToken,
        factor_id: factorId,
      })
      .then((res) => res.data)
  },

  /** Verify the TOTP code — returns an aal2-elevated session (tokens only). */
  verify(
    accessToken: string,
    refreshToken: string,
    factorId: string,
    challengeId: string,
    code: string,
  ): Promise<MfaVerifyResponse> {
    return http.post<MfaVerifyResponse>(`${BASE}/mfa/verify`, {
      access_token: accessToken,
      refresh_token: refreshToken,
      factor_id: factorId,
      challenge_id: challengeId,
      code,
    })
  },
}
