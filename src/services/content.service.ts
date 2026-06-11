import { http } from '@/lib/request'
import type { ApiResponse, PaginatedResponse, ListParams, BulkUpdateRequest, BulkDeleteRequest, BulkUpdateResponse, BulkDeleteResponse } from '@/types/api.types'
import type { Story, StoryCreateRequest, StoryUpdateRequest, JournalPost, JournalCreateRequest, JournalUpdateRequest, GalleryItem, GalleryCreateRequest, GalleryUpdateRequest, Destination } from '@/types/content.types'

// ── Generic content service factory ─────────────────────────────────────

function buildParams(params: ListParams & { site_id?: string }): Record<string, string> {
  const q: Record<string, string> = {}
  if (params.page)    q.page    = String(params.page)
  if (params.limit)   q.limit   = String(params.limit)
  if (params.search)  q.search  = params.search
  if (params.status)  q.status  = params.status
  if (params.sort)    q.sort    = params.sort
  if (params.order)   q.order   = params.order
  if (params.site_id) q.site_id = params.site_id
  return q
}

function createContentService<Entity, CreateDTO, UpdateDTO>(basePath: string) {
  return {
    async getList(params?: ListParams & { site_id?: string }) {
      const query = params ? new URLSearchParams(buildParams(params)).toString() : ''
      const url = query ? `${basePath}?${query}` : basePath
      const data = await http.get<PaginatedResponse<Entity>>(url)
      return data
    },

    async getById(id: string) {
      const data = await http.get<ApiResponse<Entity>>(`${basePath}/${id}`)
      return data.data
    },

    async create(payload: CreateDTO) {
      const data = await http.post<ApiResponse<Entity>>(basePath, payload)
      return data.data
    },

    async update(id: string, payload: UpdateDTO) {
      const data = await http.patch<ApiResponse<Entity>>(`${basePath}/${id}`, payload)
      return data.data
    },

    async remove(id: string) {
      await http.delete(`${basePath}/${id}`)
    },

    async bulkUpdate(payload: BulkUpdateRequest) {
      const data = await http.patch<BulkUpdateResponse>(`${basePath}/bulk`, payload)
      return data
    },

    async bulkDelete(payload: BulkDeleteRequest) {
      const data = await http.delete<BulkDeleteResponse>(`${basePath}/bulk`, payload)
      return data
    },

    async upsertTranslation(id: string, locale: string, payload: Record<string, unknown>) {
      const data = await http.put<ApiResponse<unknown>>(`${basePath}/${id}/translations/${locale}`, payload)
      return data.data
    },
  }
}

// ── Module-specific services ──────────────────────────────────────────────

export const storiesService    = createContentService<Story,       StoryCreateRequest,   StoryUpdateRequest>(  '/api/v1/cms/content/stories')
export const journalService    = createContentService<JournalPost, JournalCreateRequest, JournalUpdateRequest>('/api/v1/cms/content/journal')
export const galleryService    = createContentService<GalleryItem, GalleryCreateRequest, GalleryUpdateRequest>('/api/v1/cms/content/gallery')
export const destinationsService = createContentService<Destination, Record<string,unknown>, Record<string,unknown>>('/api/v1/cms/content/destinations')
