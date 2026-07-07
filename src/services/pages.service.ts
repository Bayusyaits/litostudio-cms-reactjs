import { http } from '@/lib/request'
import { withIdempotencyKey } from '@litostudio/ui-cms'
import type { ApiResponse } from '@/types/api.types'

export type PageStatus = 'draft' | 'active' | 'inactive' | 'archived'

export interface PageTranslation {
  locale: string
  title: string
  body?: Record<string, unknown>
  meta_title?: string
  meta_description?: string
}

export interface Page {
  id: string
  site_id: string
  slug: string
  status: PageStatus
  template: string
  sort_order: number
  parent_id: string | null
  is_in_menu: boolean
  menu_label: string | null
  is_header: boolean
  is_footer: boolean
  is_mobile_menu: boolean
  title: string | null
  /** Computed depth in hierarchy (0 = root). Returned by list endpoint when tree=true. */
  level?: number
  created_at: string
  updated_at: string
  page_translations?: PageTranslation[]
}

export interface PageListMeta {
  total: number
  limit: number
  offset: number
}

export interface PageListParams {
  site_id: string
  limit?: number
  offset?: number
  status?: PageStatus | ''
  locale?: string
  search?: string
}

export interface PageCreateRequest {
  site_id: string
  slug: string
  template?: string
  status?: PageStatus
  parent_id?: string | null
  sort_order?: number
  translations?: PageTranslation[]
}

export interface PageReorderUpdate {
  id: string
  sort_order: number
}

export interface PageUpdateRequest {
  slug?: string
  template?: string
  status?: PageStatus
  sort_order?: number
  parent_id?: string | null
  is_in_menu?: boolean
  menu_label?: string | null
  is_header?: boolean
  is_footer?: boolean
  is_mobile_menu?: boolean
  translations?: PageTranslation[]
}

// ── Revision types ────────────────────────────────────────────────────────────

export type RevisionStatus = 'draft' | 'published' | 'archived'

export interface PageRevision {
  id:           string
  version:      number
  label:        string | null
  status:       RevisionStatus
  published_at: string | null
  created_at:   string
  created_by:   string | null
}

export interface CreateRevisionRequest {
  locale?: string
  label?:  string
  status?: RevisionStatus
}

export interface RestoreRevisionResult {
  restored_from_version: number
  restored_from_date:    string
  message:               string
}

const BASE = '/api/v1/cms/content/pages'

export const pagesService = {
  async getList(params: PageListParams) {
    const q = new URLSearchParams()
    q.set('site_id', params.site_id)
    if (params.limit)   q.set('limit',   String(params.limit))
    if (params.offset)  q.set('offset',  String(params.offset))
    if (params.status)  q.set('status',  params.status)
    if (params.locale)  q.set('locale',  params.locale)
    if (params.search)  q.set('search',  params.search)
    const data = await http.get<{ success: boolean; data: Page[]; meta: PageListMeta }>(`${BASE}?${q}`)
    return data
  },

  async getOne(pageId: string) {
    const data = await http.get<ApiResponse<Page>>(`${BASE}/${pageId}`)
    return data.data
  },

  async create(payload: PageCreateRequest) {
    const data = await http.post<ApiResponse<Page>>(BASE, payload)
    return data.data
  },

  async update(pageId: string, payload: PageUpdateRequest) {
    const data = await http.patch<ApiResponse<Page>>(`${BASE}/${pageId}`, payload)
    return data.data
  },

  async toggleMenu(pageId: string, is_in_menu: boolean) {
    const data = await http.patch<ApiResponse<Page>>(`${BASE}/${pageId}`, { is_in_menu })
    return data.data
  },

  async toggleHeader(pageId: string, is_header: boolean) {
    const data = await http.patch<ApiResponse<Page>>(`${BASE}/${pageId}`, { is_header })
    return data.data
  },

  async toggleFooter(pageId: string, is_footer: boolean) {
    const data = await http.patch<ApiResponse<Page>>(`${BASE}/${pageId}`, { is_footer })
    return data.data
  },

  async toggleMobileMenu(pageId: string, is_mobile_menu: boolean) {
    const data = await http.patch<ApiResponse<Page>>(`${BASE}/${pageId}`, { is_mobile_menu })
    return data.data
  },

  async remove(pageId: string) {
    await http.delete(`${BASE}/${pageId}`)
  },

  async bulkDelete(ids: string[]) {
    await http.delete(`${BASE}/bulk`, { ids })
  },

  async updateMenuLabel(pageId: string, menu_label: string | null) {
    const data = await http.patch<ApiResponse<Page>>(`${BASE}/${pageId}`, { menu_label })
    return data.data
  },

  async updateSortOrder(pageId: string, sort_order: number) {
    const data = await http.patch<ApiResponse<Page>>(`${BASE}/${pageId}`, { sort_order })
    return data.data
  },

  async updateParentId(pageId: string, parent_id: string | null) {
    const data = await http.patch<ApiResponse<Page>>(`${BASE}/${pageId}`, { parent_id })
    return data.data
  },

  /** Bulk-reorder: set sort_order for many pages at once. */
  async reorder(site_id: string, updates: PageReorderUpdate[]) {
    const data = await http.post<{ success: boolean; updated: number }>(`${BASE}/reorder`, { site_id, updates })
    return data
  },

  /** Check if a slug is available for a site. Returns { available: boolean }. */
  async checkSlug(site_id: string, slug: string, excludeId?: string) {
    const q = new URLSearchParams({ site_id, slug })
    if (excludeId) q.set('excludeId', excludeId)
    const data = await http.get<{ success: boolean; available: boolean }>(`${BASE}/check-slug?${q}`)
    return data
  },

  /** Fetch all pages for a site without pagination (for parent picker). */
  async getAllForSite(site_id: string) {
    const q = new URLSearchParams({ site_id, limit: '200', locale: 'id' })
    const data = await http.get<{ success: boolean; data: Page[]; meta: PageListMeta }>(`${BASE}?${q}`)
    return data.data ?? []
  },

  // ── Page sections sync (publish bridge) ───────────────────────────────────

  /**
   * Full-replace page_sections from block editor blocks.
   * Called by BlockEditorPage.publishFn after saveFn so the website's
   * DynamicSectionRenderer picks up the published content.
   *
   * @param pageId  - UUID of the page
   * @param blocks  - Block[] from useEditorStore().blockDoc.blocks
   */
  async syncSections(
    pageId: string,
    blocks: Array<{
      id: string
      type: string
      data?: Record<string, unknown>
      styles?: Record<string, unknown>
      animation?: Record<string, unknown>
      visibility?: { desktop?: boolean; mobile?: boolean; tablet?: boolean }
      name?: string
    }>,
  ): Promise<{ synced: number }> {
    const sections = blocks.map((block, idx) => {
      // Flatten block.styles into settings top-level so DynamicSectionRenderer.sectionStyle()
      // can read them directly (backgroundColor, textColor, padding*, margin*, etc.).
      // Also store animation + customId/visibility for future use.
      const settings: Record<string, unknown> = {
        ...(block.styles ?? {}),
      }
      if (block.animation && Object.keys(block.animation).length > 0) {
        settings['animation'] = block.animation
      }
      if (block.visibility) {
        settings['visibility'] = block.visibility
      }
      return {
        section_type: block.type,
        sort_order:   idx,
        props:        block.data ?? {},
        settings,
        is_visible:   block.visibility?.desktop !== false,
        name:         block.name    ?? null,
        anchor_id:    null,
      }
    })
    // 2026-07 idempotency: this IS the actual "Publish" action today (the
    // EditorShell Publish button calls syncSections directly — see
    // BlockEditorPage.tsx publishFn; createRevision below is not currently
    // called from anywhere in the CMS, despite its doc comment, so it isn't
    // wired here — the backend route protection stays in place regardless
    // for whenever it is wired up).
    return withIdempotencyKey(`publish:${pageId}`, async (headers) => {
      const data = await http.post<{ success: boolean; synced: number }>(
        `${BASE}/${pageId}/sections/sync`,
        { sections },
        { headers },
      )
      return { synced: data.synced ?? sections.length }
    })
  },

  // ── Revisions ──────────────────────────────────────────────────────────────

  /** List the last N revision snapshots for a page+locale (default 10). */
  async getRevisions(pageId: string, locale = 'id', limit = 10): Promise<PageRevision[]> {
    const q = new URLSearchParams({ locale, limit: String(limit) })
    const data = await http.get<ApiResponse<PageRevision[]>>(`${BASE}/${pageId}/revisions?${q}`)
    return data.data ?? []
  },

  /**
   * Snapshot the current draft body → new revision.
   * Call on Publish or explicit "Save version".
   */
  /** Not currently called from any CMS UI (see syncSections comment above),
   *  but idempotency-keyed regardless since the backend route already
   *  enforces it — this keeps the client ready if/when it's wired up. */
  async createRevision(pageId: string, payload: CreateRevisionRequest = {}): Promise<PageRevision> {
    return withIdempotencyKey(`publish-revision:${pageId}`, async (headers) => {
      const data = await http.post<ApiResponse<PageRevision>>(`${BASE}/${pageId}/revisions`, payload, { headers })
      return data.data!
    })
  },

  /**
   * Restore a historical revision: copies its body back into the draft.
   * The caller must then save/publish to apply the restored content.
   */
  async restoreRevision(pageId: string, revisionId: string, locale = 'id'): Promise<RestoreRevisionResult> {
    const data = await http.post<ApiResponse<RestoreRevisionResult>>(
      `${BASE}/${pageId}/revisions/${revisionId}/restore`,
      { locale },
    )
    return data.data!
  },
}
