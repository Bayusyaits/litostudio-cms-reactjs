// apps/cms/src/hooks/useAnalyticsIdentify.ts
// Wires identify() and site group() to auth + org + website stores.
// Call once in the root authenticated layout (e.g. DashboardLayout).

import { useEffect } from 'react'
import { useAnalytics } from '@/providers/AnalyticsProvider'
import { useAuthStore }    from '@/stores/auth.store'
import { useOrgStore } from '@litostudio/ui-cms'
import { useWebsiteStore } from '@litostudio/ui-cms'

export function useAnalyticsIdentify() {
  const { identify, groupSite, reset } = useAnalytics()

  const user = useAuthStore((s) => s.user)
  const org  = useOrgStore((s) => s.org)
  const site = useWebsiteStore((s) => s.activeSite)

  // Re-identify when user or org plan/role changes
  useEffect(() => {
    if (!user?.id) return
    identify({
      id:           user.id,
      email:        user.email,
      name:         user.full_name ?? undefined,
      orgId:        user.org_id ?? org?.id,
      orgName:      org?.name,
      orgRole:      user.org_role ?? user.role ?? undefined,
      orgPlan:      org?.plan ?? 'free',
      createdAt:    org?.created_at,
      // provider field is on the login response metadata, not persisted to User —
      // default to 'email'; update when OAuth sign-in flow is available
      signupMethod: 'email',
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.org_role, org?.plan])

  // Update site group context when active site changes
  useEffect(() => {
    if (!site?.id || !org?.id) return
    groupSite(site.id, {
      name:              site.name,
      org_id:            org.id,
      template_slug:     site.template_slug as 'lito' | 'beauty' | 'fashion' | undefined,
      status:            site.status === 'active' ? 'live' : 'draft',
      has_custom_domain: false, // updated via domain.connected event
      created_at:        site.created_at,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site?.id, site?.template_slug, site?.status])

  // Return reset so caller can invoke on logout
  return { resetAnalytics: reset }
}
