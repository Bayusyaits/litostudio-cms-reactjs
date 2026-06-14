import { http } from '@/lib/request'
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
}

export interface PageCreateRequest {
  site_id: string
  slug: string
  template?: string
  status?: PageStatus
  translations?: PageTranslation[]
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

const BASE = '/api/v1/cms/content/pages'

export const pagesService = {
  async getList(params: PageListParams) {
    const q = new URLSearchParams()
    q.set('site_id', params.site_id)
    if (params.limit)   q.set('limit',   String(params.limit))
    if (params.offset)  q.set('offset',  String(params.offset))
    if (params.status)  q.set('status',  params.status)
    if (params.locale)  q.set('locale',  params.locale)
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
}
