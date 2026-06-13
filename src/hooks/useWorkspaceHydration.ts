/**
 * useWorkspaceHydration
 *
 * Auto-populates org and activeSite stores from the API when:
 *   - user.org_id is set (org membership exists in DB) but org store is null
 *   - org is set but activeSite store is null (picks first active/published site)
 *
 * This hook MUST be called near the top of DashboardLayout (inside the auth
 * gate, after _hasHydrated is true) so every protected page benefits.
 *
 * Returns isHydrating = true while any in-flight fetch is pending.
 */

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useOrgStore } from '@/stores/org.store'
import { useWebsiteStore } from '@/stores/website.store'
import { orgService } from '@/services/org.service'

export function useWorkspaceHydration(): { isHydrating: boolean } {
  const [isHydrating, setIsHydrating] = useState(false)
  const qc = useQueryClient()

  const { user } = useAuthStore()
  const { org, setOrg } = useOrgStore()
  const { activeSite, setActiveSite } = useWebsiteStore()

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      // Nothing to do if user not loaded
      if (!user) return

      // ── Step 1: Hydrate org store ─────────────────────────────────────────
      // user.org_id is set (they have an org in the DB) but Zustand store is
      // empty — fetch and persist.
      if (user.org_id && !org) {
        setIsHydrating(true)
        try {
          const fetched = await qc.fetchQuery({
            queryKey: ['org', 'current'],
            queryFn: orgService.getOrg,
            staleTime: 5 * 60 * 1000,
          })
          if (!cancelled && fetched) {
            setOrg(fetched)
          }
        } catch {
          // getOrg failed (e.g. 404 — org was deleted). Leave org null so
          // DashboardLayout will redirect to onboarding.
        } finally {
          if (!cancelled) setIsHydrating(false)
        }
        return // site hydration will run on the next render when org is set
      }

      // ── Step 2: Hydrate activeSite store ──────────────────────────────────
      // Org is known but no active site selected — fetch sites and auto-pick
      // the first active/published one.
      if (org && !activeSite) {
        setIsHydrating(true)
        try {
          const response = await qc.fetchQuery({
            queryKey: ['sites', org.id],
            queryFn: () => orgService.getSitesByOrg(org.id),
            staleTime: 2 * 60 * 1000,
          })
          if (!cancelled) {
            const sites = response?.data ?? []
            if (sites.length > 0) {
              // Prefer active/published; fall back to first in list
              const preferred =
                sites.find(s => s.status === 'active' || s.status === 'published') ??
                sites[0]
              setActiveSite(preferred)
            }
          }
        } catch {
          // Fetch failed — activeSite stays null; DashboardLayout will show
          // the no-site banner.
        } finally {
          if (!cancelled) setIsHydrating(false)
        }
      }
    }

    hydrate()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.org_id, org?.id, activeSite?.id])

  return { isHydrating }
}
