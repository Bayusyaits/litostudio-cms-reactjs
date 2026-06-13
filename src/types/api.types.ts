// ── Base API response shapes ───────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: PaginationMeta
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  status: number
  code: string
  title: string
  detail?: string
}

// ── Common filter/pagination params ───────────────────────────────────────

export interface ListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sort?: string
  order?: 'asc' | 'desc'
}

// ── Bulk operation types ───────────────────────────────────────────────────

export interface BulkUpdateRequest {
  ids: string[]
  data: {
    status?: ContentStatus
    sort_order?: number
    is_featured?: boolean
  }
}

export interface BulkDeleteRequest {
  ids: string[]
}

export interface BulkUpdateResponse {
  success: boolean
  updated: number
  ids: string[]
}

export interface BulkDeleteResponse {
  success: boolean
  deleted: number
  ids: string[]
}

// ── Shared content status ──────────────────────────────────────────────────

export type ContentStatus = 'published' | 'draft' | 'scheduled' | 'archived'

export type OrgRole = 'owner' | 'admin' | 'editor' | 'viewer'

export type SiteStatus = 'active' | 'inactive' | 'maintenance'
