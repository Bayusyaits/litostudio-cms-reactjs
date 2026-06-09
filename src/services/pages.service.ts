import { apiClient } from '@/lib/axios'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'

export type PageStatus = 'published' | 'draft' | 'scheduled' | 'archived'

export interface Page {
  id: string
  site_id: string
  title: string
  slug: string
  status: PageStatus
  template: string
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface PageListParams {
  site_id: string
  page?: number
  limit?: number
  status?: PageStatus | ''
  search?: string
}

export interface PageCreateRequest {
  site_id: string
  title: string
  slug: string
  status: PageStatus
  template?: string
  meta_title?: string
  meta_description?: string
}

export const pagesService = {
  async getList(params: PageListParams) {
    const q = new URLSearchParams()
    q.set('site_id', params.site_id)
    if (params.page)     q.set('page',     String(params.page))
    if (params.limit)    q.set('limit',    String(params.limit))
    if (params.status)   q.set('status',   params.status)
    if (params.search)   q.set('search',   params.search)
    const { data } = await apiClient.get<PaginatedResponse<Page>>(`/api/v1/cms/pages?${q}`)
    return data
  },

  async getOne(id: string) {
    const { data } = await apiClient.get<ApiResponse<Page>>(`/api/v1/cms/pages/${id}`)
    return data.data
  },

  async create(payload: PageCreateRequest) {
    const { data } = await apiClient.post<ApiResponse<Page>>('/api/v1/cms/pages', payload)
    return data.data
  },

  async update(id: string, payload: Partial<PageCreateRequest>) {
    const { data } = await apiClient.patch<ApiResponse<Page>>(`/api/v1/cms/pages/${id}`, payload)
    return data.data
  },

  async remove(id: string) {
    await apiClient.delete(`/api/v1/cms/pages/${id}`)
  },

  async bulkDelete(ids: string[]) {
    await apiClient.delete('/api/v1/cms/pages/bulk', { data: { ids } })
  },
}
