import { http } from '@/lib/request'
import type { ApiResponse } from '@/types/api.types'

// ── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  site_id: string
  slug: string
  parent_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
  translations: { locale: string; name: string; description?: string }[]
}

export interface CategoryCreateRequest {
  site_id: string
  slug: string
  parent_id?: string | null
  sort_order?: number
  translation: { locale: string; name: string; description?: string }
}

export interface CategoryUpdateRequest extends Partial<CategoryCreateRequest> {}

export const categoryService = {
  async getList(siteId: string, parentId?: string | null) {
    const params = new URLSearchParams({ site_id: siteId, limit: '200' })
    if (parentId !== undefined) params.set('parent_id', parentId ?? '')
    const data = await http.get<{ success: boolean; data: Category[]; total: number }>(
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
}
