// apps/cms/src/tracking/events.ts
// Auto-generated from .telemetry/tracking-plan.yaml v1 — 2026-06-21
//
// Central event name constants — import from here, never use raw strings.
// Matches the backend analytics.ts EVENTS constant exactly.

export const EVENTS = {
  // Lifecycle
  USER_SIGNED_UP:  'user.signed_up',
  USER_LOGGED_IN:  'user.logged_in',
  ORG_CREATED:     'org.created',
  MEMBER_INVITED:  'member.invited',
  // Core value
  SITE_CREATED:    'site.created',
  TEMPLATE_SELECTED: 'template.selected',
  PAGE_CREATED:    'page.created',
  EDITOR_SESSION_ENDED: 'editor.session_ended',
  PAGE_PUBLISHED:  'page.published',
  SITE_PUBLISHED:  'site.published',
  // Configuration
  DOMAIN_CONNECTED: 'domain.connected',
  ANALYTICS_SCRIPTS_CONFIGURED: 'analytics_scripts.configured',
  // Content
  CONTENT_CREATED: 'content.created',
} as const

export type EventName = typeof EVENTS[keyof typeof EVENTS]
