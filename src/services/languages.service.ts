// services/languages.service.ts
// Tenant CMS read+write of an organization's locales — backs the
// LabelsPageView locale filter (read-only usage, unchanged) and the new
// Settings > Languages management screen (2026-08-10,
// MULTIPLE-LANGUAGE-PLAN.md, org self-service language management).
//
// Bug fix (2026-07): this previously called the PUBLIC route
// (`/api/v1/public/languages`) — but that whole /api/v1/public/* scope
// requires a website site-token (bootstrap/routes.ts's
// `pub.addHook('preHandler', requireSiteToken)`), which the CMS app never
// has (it authenticates with a Supabase user JWT). Every call 401'd, and
// the global http interceptor treats any 401 as session expiry, silently
// evicting the whole CMS session. Switched to a CMS-scoped route
// (GET /api/v1/cms/organizations/locales, organization.routes.ts) gated by
// the CMS's own requireAuth and scoped to the caller's own org.
import { http } from '@litostudio/ui-cms'
import type { ApiResponse } from '@/types/api.types'

export interface OrgLanguage {
  locale: string
  name: string
  native_name: string
  is_default: boolean
  is_active: boolean
  currency_code: string
  currency_symbol: string
}

export interface OrgLanguagesResponse {
  languages: OrgLanguage[]
  /** Whether this org currently has the 'multi_language' add-on enabled
   * (org-wide grant OR any site-scoped grant) — see
   * apps/backend/src/shared/contentRepository.ts's isAddonEnabledForOrg(). */
  multi_language_addon_active: boolean
}

export interface UpdateLanguagePayload {
  is_active?: boolean
  is_default?: boolean
  currency_code?: string | null
  currency_symbol?: string | null
}

export interface PlatformLocale {
  code: string
  name: string
  native_name: string
  currency_code: string
  currency_symbol: string
  is_available: boolean
}

export const languagesService = {
  /** @param all - include disabled locales too (Settings > Languages screen). Defaults to active-only (LabelsPageView's existing usage). */
  async list(all = false): Promise<ApiResponse<OrgLanguagesResponse>> {
    return http.get<ApiResponse<OrgLanguagesResponse>>(`/api/v1/cms/organizations/locales${all ? '?all=true' : ''}`)
  },

  /** Full superadmin-managed locale catalog — for the "Add a language" picker. */
  async catalog(): Promise<ApiResponse<PlatformLocale[]>> {
    return http.get<ApiResponse<PlatformLocale[]>>('/api/v1/cms/organizations/locales/catalog')
  },

  /** Enable a language for the org. 402/403-style ForbiddenError if this
   * would be a 2nd+ active language and the org doesn't have the
   * 'multi_language' add-on. */
  async enable(locale: string, currencyCode?: string, currencySymbol?: string): Promise<ApiResponse<OrgLanguage>> {
    return http.post<ApiResponse<OrgLanguage>>('/api/v1/cms/organizations/locales', {
      locale, currency_code: currencyCode, currency_symbol: currencySymbol,
    })
  },

  async update(locale: string, payload: UpdateLanguagePayload): Promise<ApiResponse<OrgLanguage>> {
    return http.patch<ApiResponse<OrgLanguage>>(`/api/v1/cms/organizations/locales/${locale}`, payload)
  },
}
