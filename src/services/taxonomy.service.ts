import { http } from '@litostudio/ui-cms'
import type { ApiResponse } from '@/types/api.types'

// ── Category ─────────────────────────────────────────────────────────────────
//
// `categories` is a flat/hierarchical taxonomy table (plain `name` column —
// NOT translated via a join table, unlike stories/journal/products). This
// used to be modeled here with a `translations[]` shape that never matched
// the real backend response (categories.routes.ts selects `*` — `name` is
// top-level) — the "Add category" form silently 400'd (missing required
// `name`) and the list always rendered blank names. Fixed 2026-07-13
// alongside wiring products.category_id to this same table/module
// (migration 085) — no new categories module was created, this one was
// repaired and reused instead.

export interface Category {
  id: string
  site_id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  icon: string | null
  parent_id: string | null
  sort_order: number
  is_active?: boolean
  created_at: string
  updated_at: string
  // Index signature — lets this satisfy EnterpriseDataTable's
  // `T extends Record<string, unknown>` generic constraint (an `interface`
  // without one isn't structurally assignable to a Record type, even though
  // every declared property already is). Same convention as
  // apps/cms-superadmin/src/types/api.types.ts's SAOrganization/SAUser.
  [key: string]: unknown
}

export interface CategoryCreateRequest {
  site_id: string
  name: string
  slug?: string
  description?: string
  color?: string
  icon?: string
  parent_id?: string | null
  sort_order?: number
}

export interface CategoryUpdateRequest extends Partial<Omit<CategoryCreateRequest, 'site_id'>> {
  is_active?: boolean
}

export const categoryService = {
  async getList(siteId: string, parentId?: string | null) {
    const params = new URLSearchParams({ site_id: siteId, limit: '200' })
    if (parentId !== undefined) params.set('parent_id', parentId ?? '')
    const data = await http.get<{ success: boolean; data: Category[]; meta: { total: number; limit: number; offset: number } }>(
      `/api/v1/cms/content/categories?${params}`,
    )
    return data
  },

  async create(payload: CategoryCreateRequest) {
    const data = await http.post<ApiResponse<Category>>('/api/v1/cms/content/categories', payload)
    return data.data
  },

  async update(id: string, payload: CategoryUpdateRequest) {
    const data = await http.patch<ApiResponse<Category>>(`/api/v1/cms/content/categories/${id}`, payload)
    return data.data
  },

  async remove(id: string) {
    await http.delete(`/api/v1/cms/content/categories/${id}`)
  },
}

// ── Tag ───────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string
  site_id: string
  slug: string
  name: string
  post_count: number
  created_at: string
  updated_at: string
}

export interface TagCreateRequest {
  site_id: string
  slug: string
  name: string
}

export const tagService = {
  async getList(siteId: string) {
    const data = await http.get<{ success: boolean; data: Tag[]; total: number }>(
      `/api/v1/cms/content/tags?site_id=${siteId}&limit=500`,
    )
    return data
  },

  async create(payload: TagCreateRequest) {
    const data = await http.post<ApiResponse<Tag>>('/api/v1/cms/content/tags', payload)
    return data.data
  },

  async remove(id: string) {
    await http.delete(`/api/v1/cms/content/tags/${id}`)
  },

  /** Links existing tag rows to a piece of content via the real
   * content_tags join table (migration 011) — this is what actually makes
   * a tag "count" as used/appear consistently, as opposed to products.tags'
   * free-text array which has no relation to the canonical `tags` table at
   * all. `replace: true` fully syncs content's tag set to exactly `tag_ids`. */
  async assign(payload: { tag_ids: string[]; content_type: string; content_id: string; replace?: boolean }) {
    await http.post<ApiResponse<null>>('/api/v1/cms/content/tags/assign', payload)
  },
}
