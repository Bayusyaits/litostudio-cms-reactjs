// ── Base API response shapes ───────────────────────────────────────────────
//
// ui-cms cutover (Phase 6) note: ContentStatus and OrgRole were migrated to
// @litostudio/ui-cms (their shapes there are identical string-literal unions).
// Everything else in this file (ApiResponse, PaginatedResponse, PaginationMeta,
// ApiError, ListParams, BulkUpdateRequest, BulkDeleteRequest, BulkUpdateResponse,
// BulkDeleteResponse) is deliberately NOT migrated: ui-cms's package barrel
// exports same-named types under these identifiers too, but they come from
// its ./http module (a verbatim port of this app's OWN now-deleted
// @/lib/http/types.ts) and have DIFFERENT, incompatible shapes — e.g.
// PaginationMeta.totalPages here vs .offset there, BulkUpdateRequest.data.status
// here vs a flat .status there. This divergence pre-existed in apps/cms's own
// codebase as two separate type files; swapping these names to ui-cms's
// versions would silently break every call site that reads .totalPages,
// .data.status, etc. Confirmed via direct diff before deciding to keep these
// local — not migrated, not a gap.

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
