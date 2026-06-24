// apps/cms/src/tracking/tracking.ts
// Auto-generated from .telemetry/tracking-plan.yaml v1 — 2026-06-21
//
// Typed tracking functions for the CMS (React/posthog-js).
// Import useTracking() in your component/container, then call the typed function.
//
// DO NOT import posthog directly in feature code.
// DO NOT use raw event name strings — use EVENTS constants.

import { useAnalytics } from '@/providers/AnalyticsProvider'
import { EVENTS } from './events'
import type {
  MemberInvitedProps,
  SiteCreatedProps,
  TemplateSelectedProps,
  PageCreatedProps,
  EditorSessionEndedProps,
  PagePublishedProps,
  SitePublishedProps,
  DomainConnectedProps,
  AnalyticsScriptsConfiguredProps,
  ContentCreatedProps,
} from './types'

// ── useTracking hook ──────────────────────────────────────────────────────────
// Returns typed functions for all CMS-side events.
// Call once at the top of a container component.

export function useTracking() {
  const { track, groupOrg, groupSite } = useAnalytics()

  return {
    // ── Core value ────────────────────────────────────────────────────────────

    trackSiteCreated(props: SiteCreatedProps) {
      // Also establishes the site group in PostHog
      groupSite(props.site_id, {
        name:    props.site_name,
        org_id:  props.org_id,
        status:  'draft',
        pages_count: 0,
        published_pages_count: 0,
        has_custom_domain: false,
      })
      track(EVENTS.SITE_CREATED, {
        site_id:              props.site_id,
        org_id:               props.org_id,
        site_name:            props.site_name,
        locale:               props.locale,
        sites_total_for_org:  props.sites_total_for_org,
      }, { organization: props.org_id, site: props.site_id })
    },

    trackTemplateSelected(props: TemplateSelectedProps) {
      // Update site group trait so template_slug stays current
      groupSite(props.site_id, {
        org_id:        props.org_id,
        template_slug: props.template_slug,
      })
      track(EVENTS.TEMPLATE_SELECTED, {
        site_id:                props.site_id,
        org_id:                 props.org_id,
        template_slug:          props.template_slug,
        is_initial_selection:   props.is_initial_selection,
        previous_template_slug: props.previous_template_slug,
      }, { organization: props.org_id, site: props.site_id })
    },

    trackPageCreated(props: PageCreatedProps) {
      track(EVENTS.PAGE_CREATED, {
        site_id:              props.site_id,
        org_id:               props.org_id,
        page_id:              props.page_id,
        page_type:            props.page_type,
        pages_total_for_site: props.pages_total_for_site,
      }, { organization: props.org_id, site: props.site_id })
    },

    trackEditorSessionEnded(props: EditorSessionEndedProps) {
      // Skip no-op sessions (user opened editor but made no changes, <5s duration)
      if (!props.had_changes && props.session_duration_seconds < 5) return
      track(EVENTS.EDITOR_SESSION_ENDED, {
        site_id:                  props.site_id,
        org_id:                   props.org_id,
        page_id:                  props.page_id,
        session_duration_seconds: props.session_duration_seconds,
        blocks_added:             props.blocks_added,
        blocks_removed:           props.blocks_removed,
        blocks_total:             props.blocks_total,
        had_changes:              props.had_changes,
        template_slug:            props.template_slug,
      }, { organization: props.org_id, site: props.site_id })
    },

    trackPagePublished(props: PagePublishedProps) {
      track(EVENTS.PAGE_PUBLISHED, {
        site_id:        props.site_id,
        org_id:         props.org_id,
        page_id:        props.page_id,
        page_type:      props.page_type,
        blocks_count:   props.blocks_count,
        is_first_publish: props.is_first_publish,
        template_slug:  props.template_slug,
      }, { organization: props.org_id, site: props.site_id })
    },

    trackSitePublished(props: SitePublishedProps) {
      // Update site group: status → live, published_at set
      groupSite(props.site_id, {
        org_id:        props.org_id,
        template_slug: props.template_slug,
        status:        'live',
        published_at:  new Date().toISOString(),
        has_custom_domain: props.has_custom_domain,
      })
      // If first publish, update org group too
      if (props.is_first_publish) {
        groupOrg(props.org_id, {
          name:                    undefined as unknown as string, // preserve existing name
          plan:                    'free',
          has_published_site:      true,
          first_site_published_at: new Date().toISOString(),
        })
      }
      track(EVENTS.SITE_PUBLISHED, {
        site_id:               props.site_id,
        org_id:                props.org_id,
        template_slug:         props.template_slug,
        pages_published:       props.pages_published,
        pages_total:           props.pages_total,
        is_first_publish:      props.is_first_publish,
        days_since_site_created: props.days_since_site_created,
        days_since_signup:     props.days_since_signup,
        has_custom_domain:     props.has_custom_domain,
      }, { organization: props.org_id, site: props.site_id })
    },

    // ── Collaboration ─────────────────────────────────────────────────────────

    trackMemberInvited(props: MemberInvitedProps) {
      track(EVENTS.MEMBER_INVITED, {
        org_id:               props.org_id,
        invited_role:         props.invited_role,
        current_member_count: props.current_member_count,
      }, { organization: props.org_id })
    },

    // ── Configuration ─────────────────────────────────────────────────────────

    trackDomainConnected(props: DomainConnectedProps) {
      // Update site group: has_custom_domain
      groupSite(props.site_id, {
        org_id:            props.org_id,
        has_custom_domain: true,
      })
      track(EVENTS.DOMAIN_CONNECTED, {
        site_id:          props.site_id,
        org_id:           props.org_id,
        domain_type:      props.domain_type,
        is_site_published: props.is_site_published,
      }, { organization: props.org_id, site: props.site_id })
    },

    trackAnalyticsScriptsConfigured(props: AnalyticsScriptsConfiguredProps) {
      track(EVENTS.ANALYTICS_SCRIPTS_CONFIGURED, {
        site_id:    props.site_id,
        org_id:     props.org_id,
        provider:   props.provider,
        is_enabled: props.is_enabled,
      }, { organization: props.org_id, site: props.site_id })
    },

    // ── Content ───────────────────────────────────────────────────────────────

    trackContentCreated(props: ContentCreatedProps) {
      track(EVENTS.CONTENT_CREATED, {
        site_id:          props.site_id,
        org_id:           props.org_id,
        content_type:     props.content_type,
        is_first_of_type: props.is_first_of_type,
      }, { organization: props.org_id, site: props.site_id })
    },
  }
}
