// services/languages.service.ts
// Tenant CMS read of an organization's enabled locales — backs the
// LabelsPageView locale filter (previously hardcoded, see
// superadmin-language-management-plan-2026-07-15.md Phase 4).
//
// Bug fix (2026-07): this previously called the PUBLIC route
// (`/api/v1/public/languages`) — but that whole /api/v1/public/* scope
// requires a website site-token (bootstrap/routes.ts's
// `pub.addHook('preHandler', requireSiteToken)`), which the CMS app never
// has (it authenticates with a Supabase user JWT). Every call 401'd, and
// the global http interceptor treats any 401 as session expiry, silently
// evicting the whole CMS session on every Labels-page load. Switched to a
// new CMS-scoped route (GET /api/v1/cms/organizations/locales,
// organization.routes.ts) gated by the CMS's own requireAuth and scoped to
// the caller's own org — no orgId param needed (or accepted) anymore.
import { http } from '@litostudio/ui-cms'
import type { ApiResponse } from '@/types/api.types'

export interface OrgLanguage {
  locale: string
  is_default: boolean
  is_active: boolean
}

export const languagesService = {
  async list(): Promise<ApiResponse<OrgLanguage[]>> {
    return http.get<ApiResponse<OrgLanguage[]>>('/api/v1/cms/organizations/locales')
  },
}
