// apps/cms/src/providers/AnalyticsProvider.tsx
// Auto-generated from .telemetry/instrument.md — 2026-06-21
//
// Initializes posthog-js once on mount.
// Exposes identify(), group(), track(), reset() via useAnalytics() hook.

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import posthog from 'posthog-js'
import type { OrgGroupTraits, SiteGroupTraits, TrackingGroups } from '@/tracking/types'
import type { EventName } from '@/tracking/events'

const POSTHOG_KEY  = import.meta.env.VITE_POSTHOG_API_KEY as string | undefined
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com'

// Internal user exclusion — matches backend analytics.ts
const INTERNAL_DOMAINS = ['litostudio.id', 'litostudio.com']
function isInternal(email: string | undefined): boolean {
  if (!email) return false
  const domain = email.split('@')[1]
  return Boolean(domain && INTERNAL_DOMAINS.includes(domain))
}

// ── Context ───────────────────────────────────────────────────────────────────

interface AnalyticsUser {
  id: string
  email?: string
  name?: string
  orgId?: string
  orgName?: string
  orgRole?: string
  orgPlan?: string
  locale?: string
  createdAt?: string
  signupMethod?: 'email' | 'google'
  sitesCount?: number
}

interface AnalyticsContextValue {
  isReady: boolean
  identify: (user: AnalyticsUser) => void
  groupOrg: (orgId: string, traits: OrgGroupTraits) => void
  groupSite: (siteId: string, traits: SiteGroupTraits) => void
  track: (event: EventName, properties: Record<string, unknown>, groups?: TrackingGroups) => void
  reset: () => void
}

const AnalyticsCtx = createContext<AnalyticsContextValue>({
  isReady:   false,
  identify:  () => undefined,
  groupOrg:  () => undefined,
  groupSite: () => undefined,
  track:     () => undefined,
  reset:     () => undefined,
})

// ── Provider ──────────────────────────────────────────────────────────────────

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const ready = useRef(false)

  useEffect(() => {
    if (!POSTHOG_KEY || ready.current) return
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      defaults: '2026-01-30',
      autocapture: false,       // Explicit events only — no click noise or PII leakage
      capture_pageview: false,  // Feature engagement events only (per tracking plan)
      capture_pageleave: false,
      session_recording: {
        maskAllInputs: true,    // Mask all form inputs — required for GDPR/privacy
      },
      loaded: (ph) => {
        // Disable tracking in dev unless explicitly enabled
        if (import.meta.env.DEV && import.meta.env.VITE_ANALYTICS_DEBUG !== 'true') {
          ph.opt_out_capturing()
        }
        if (import.meta.env.VITE_ANALYTICS_DEBUG === 'true') {
          ph.opt_in_capturing()
          ph.debug()
        }
      },
    })
    ready.current = true
  }, [])

  const ctx: AnalyticsContextValue = {
    isReady: ready.current,

    identify(user: AnalyticsUser) {
      try {
        if (!ready.current || isInternal(user.email)) return
        posthog.identify(user.id, {
          email:         user.email,
          name:          user.name,
          signup_method: user.signupMethod,
          org_id:        user.orgId,
          org_role:      user.orgRole,
          org_plan:      user.orgPlan,
          locale:        user.locale,
          created_at:    user.createdAt,
          sites_count:   user.sitesCount,
        })
        // Also set org group context so all subsequent events are attributed
        if (user.orgId) {
          posthog.group('organization', user.orgId, {
            name: user.orgName,
            plan: user.orgPlan,
          })
        }
      } catch { /* non-blocking */ }
    },

    groupOrg(orgId: string, traits: OrgGroupTraits) {
      try {
        if (!ready.current) return
        posthog.group('organization', orgId, traits as unknown as Record<string, unknown>)
      } catch { /* non-blocking */ }
    },

    groupSite(siteId: string, traits: SiteGroupTraits) {
      try {
        if (!ready.current) return
        posthog.group('site', siteId, traits as unknown as Record<string, unknown>)
      } catch { /* non-blocking */ }
    },

    track(event: EventName, properties: Record<string, unknown>, groups?: TrackingGroups) {
      try {
        if (!ready.current) return
        posthog.capture(event, {
          ...properties,
          // Always pass $groups explicitly — don't rely on stateful group context
          ...(groups ? { $groups: groups } : {}),
        })
      } catch { /* non-blocking */ }
    },

    reset() {
      try {
        if (!ready.current) return
        posthog.reset()
      } catch { /* non-blocking */ }
    },
  }

  return <AnalyticsCtx.Provider value={ctx}>{children}</AnalyticsCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs with its provider/context; splitting would require updating every import site for no runtime benefit
export function useAnalytics(): AnalyticsContextValue {
  return useContext(AnalyticsCtx)
}
