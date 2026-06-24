// apps/cms/src/tracking/types.ts
// Auto-generated from .telemetry/tracking-plan.yaml v1 — 2026-06-21
// Regenerate: run /product-tracking-skills:product-tracking-implement-tracking

// ── Group types ───────────────────────────────────────────────────────────────

export type GroupType = 'organization' | 'site'

export interface OrgGroupTraits {
  name: string
  plan: string
  member_count?: number
  sites_count?: number
  locale?: string
  created_at?: string
  has_published_site?: boolean
  first_site_published_at?: string
}

export interface SiteGroupTraits {
  name?: string
  org_id: string
  template_slug?: TemplateName
  status?: 'draft' | 'live'
  pages_count?: number
  published_pages_count?: number
  has_custom_domain?: boolean
  created_at?: string
  published_at?: string
}

// ── Shared enums ──────────────────────────────────────────────────────────────

export type TemplateName = 'lito' | 'beauty' | 'fashion'
export type SignupMethod  = 'email' | 'google'
export type LoginMethod   = 'email' | 'google' | 'magic_link'
export type OrgRole       = 'owner' | 'admin' | 'editor' | 'viewer'
export type PageType      = 'home' | 'about' | 'contact' | 'products' | 'blog' | 'custom' | 'legal'
export type ContentType   = 'product' | 'collection' | 'blog_post' | 'campaign' | 'faq' | 'testimonial' | 'form' | 'category'
export type AnalyticsProvider = 'ga4' | 'gtm' | 'meta_pixel' | 'tiktok_pixel' | 'custom_script'
export type DomainType    = 'custom' | 'subdomain'

// ── Event property interfaces ─────────────────────────────────────────────────

// Lifecycle
export interface UserSignedUpProps {
  signup_method: SignupMethod
  has_invite: boolean
  locale?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

export interface UserLoggedInProps {
  login_method: LoginMethod
  days_since_signup?: number
}

export interface OrgCreatedProps {
  org_id: string
  org_name: string
  plan: string
  locale?: string
  member_count: number
}

export interface MemberInvitedProps {
  org_id: string
  invited_role: OrgRole
  current_member_count?: number
}

// Core value
export interface SiteCreatedProps {
  site_id: string
  org_id: string
  site_name?: string
  locale?: string
  sites_total_for_org?: number
}

export interface TemplateSelectedProps {
  site_id: string
  org_id: string
  template_slug: TemplateName
  is_initial_selection: boolean
  previous_template_slug?: TemplateName
}

export interface PageCreatedProps {
  site_id: string
  org_id: string
  page_id: string
  page_type?: PageType
  pages_total_for_site?: number
}

export interface EditorSessionEndedProps {
  site_id: string
  org_id: string
  page_id: string
  session_duration_seconds: number
  blocks_added: number
  blocks_removed: number
  blocks_total: number
  had_changes: boolean
  template_slug?: TemplateName
}

export interface PagePublishedProps {
  site_id: string
  org_id: string
  page_id: string
  page_type?: PageType
  blocks_count: number
  is_first_publish: boolean
  template_slug?: TemplateName
}

export interface SitePublishedProps {
  site_id: string
  org_id: string
  template_slug: TemplateName
  pages_published: number
  pages_total: number
  is_first_publish: boolean
  days_since_site_created?: number
  days_since_signup?: number
  has_custom_domain: boolean
}

// Configuration
export interface DomainConnectedProps {
  site_id: string
  org_id: string
  domain_type: DomainType
  is_site_published?: boolean
}

export interface AnalyticsScriptsConfiguredProps {
  site_id: string
  org_id: string
  provider: AnalyticsProvider
  is_enabled: boolean
}

// Content
export interface ContentCreatedProps {
  site_id: string
  org_id: string
  content_type: ContentType
  is_first_of_type?: boolean
}

// ── Groups context ────────────────────────────────────────────────────────────

export interface TrackingGroups {
  organization: string
  site?: string
}
