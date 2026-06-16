// apps/cms/src/services/pageSectionsService.ts
// CMS service for page sections CRUD and reordering.
// Sections = the ordered list of content blocks that make up a page.
// Backend routes: /api/v1/cms/content/pages/:pageId/sections

import { http } from '@/lib/http'

// ── Types ────────────────────────────────────────────────────────────────────

export const SECTION_TYPES = [
  // ── Generic (all templates) ─────────────────────────────────────────────
  'hero', 'about', 'services', 'stories', 'destinations',
  'gallery', 'testimonials', 'pricing', 'journal', 'contact', 'custom_html',
  'faq', 'team', 'timeline', 'map',

  // ── Lito-specific ───────────────────────────────────────────────────────
  'featured_stories', 'featured_content',
  'selected_works', 'story_map', 'story_categories',
  'offerings', 'client_reviews', 'campaign', 'latest_journal',

  // ── Fashion-specific ────────────────────────────────────────────────────
  'new_arrival', 'promo_banners', 'campaign_banner', 'product_carousel',
  'marquee', 'brand_story', 'lookbook', 'about_cta',
  'collaborations', 'social_grid', 'philosophy',

  // ── Beauty-specific ─────────────────────────────────────────────────────
  'collection_banner', 'product_benefits', 'product_categories',
  'founder_quote', 'blog_highlight', 'newsletter', 'featured_products',
] as const

export type SectionType = typeof SECTION_TYPES[number]

export interface PageSection {
  id: string
  page_id: string
  section_type: SectionType | string
  sort_order: number
  props: Record<string, unknown>
  settings: Record<string, unknown>
  is_visible: boolean
  name: string | null
  anchor_id: string | null
  created_at?: string
  updated_at?: string
}

export interface CreateSectionBody {
  section_type: SectionType | string
  sort_order?: number
  is_visible?: boolean
  name?: string | null
  props?: Record<string, unknown>
  settings?: Record<string, unknown>
}

export interface UpdateSectionBody {
  sort_order?: number
  is_visible?: boolean
  props?: Record<string, unknown>
  settings?: Record<string, unknown>
  name?: string | null
  anchor_id?: string | null
}

export interface ReorderItem {
  id: string
  sort_order: number
}

// ── Service ──────────────────────────────────────────────────────────────────

const BASE = (pageId: string) => `/api/v1/cms/content/pages/${pageId}/sections`

export const pageSectionsService = {
  /** List all sections for a page, sorted by sort_order */
  async list(pageId: string): Promise<PageSection[]> {
    const res = await http.get<{ success: boolean; data: PageSection[] }>(BASE(pageId))
    return res.data
  },

  /** Add a section to a page */
  async create(pageId: string, body: CreateSectionBody): Promise<PageSection> {
    const res = await http.post<{ success: boolean; data: PageSection }>(BASE(pageId), body)
    return res.data
  },

  /** Update a section (visibility, sort_order, props, settings) */
  async update(pageId: string, sectionId: string, body: UpdateSectionBody): Promise<PageSection> {
    const res = await http.patch<{ success: boolean; data: PageSection }>(
      `${BASE(pageId)}/${sectionId}`,
      body,
    )
    return res.data
  },

  /** Delete a section */
  async remove(pageId: string, sectionId: string): Promise<void> {
    await http.delete<{ success: boolean }>(`${BASE(pageId)}/${sectionId}`)
  },

  /** Bulk reorder: set sort_order for multiple sections at once */
  async reorder(pageId: string, order: ReorderItem[]): Promise<void> {
    await http.patch<{ success: boolean }>(`${BASE(pageId)}/reorder`, { order })
  },

  /** Toggle visibility for a section */
  async toggleVisibility(pageId: string, sectionId: string, is_visible: boolean): Promise<PageSection> {
    return this.update(pageId, sectionId, { is_visible })
  },
}
