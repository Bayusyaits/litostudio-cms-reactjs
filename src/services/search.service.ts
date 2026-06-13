// apps/cms/src/services/search.service.ts
import { http } from '@/lib/request'
import type { ApiResponse } from '@/types/api.types'

export interface SearchResult {
  id: string
  type: string
  title: string
  subtitle?: string
  slug?: string
  status?: string
  url: string
}

export interface SearchResponse {
  data: SearchResult[]
  meta: { total: number; q: string }
}

export const searchService = {
  async search(q: string, params?: { site_id?: string; org_id?: string; limit?: number }) {
    const qs = new URLSearchParams({ q, ...(params?.site_id ? { site_id: params.site_id } : {}), ...(params?.org_id ? { org_id: params.org_id } : {}), ...(params?.limit ? { limit: String(params.limit) } : {}) }).toString()
    const res = await http.get<ApiResponse<SearchResult[]> & SearchResponse>(`/api/v1/cms/search?${qs}`)
    return res as unknown as SearchResponse
  },
}
