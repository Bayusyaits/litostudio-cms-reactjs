/**
 * types.ts — shared TypeScript types for the HTTP module.
 * No runtime code — pure type declarations.
 */

// ── HTTP Method ───────────────────────────────────────────────────────────

/** HTTP method const object (prefer over enum — tree-shakeable, no codegen) */
export const HTTP_METHODS = {
  GET:    'GET',
  POST:   'POST',
  PUT:    'PUT',
  PATCH:  'PATCH',
  DELETE: 'DELETE',
} as const

export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS]

// ── Request Options ───────────────────────────────────────────────────────

/** Safe query-parameter value — null/undefined are dropped during serialization */
export type QueryParamValue = string | number | boolean | null | undefined

/** Query parameters object — values may be scalar or arrays */
export type QueryParams = Record<string, QueryParamValue | readonly QueryParamValue[]>

/** Response body parsing strategy */
export type ResponseType = 'json' | 'text' | 'blob'

/** Options accepted by all http.* methods */
export interface RequestOptions {
  /**
   * Query parameters appended to the URL.
   * null/undefined values are silently dropped.
   * Arrays are expanded as repeated keys: { ids: ['a','b'] } → ?ids=a&ids=b
   */
  params?: QueryParams

  /**
   * Extra HTTP headers merged on top of the defaults.
   * An `Authorization` value here overrides the cookie token for this request.
   * Names or values that fail sanitization checks are silently dropped.
   */
  headers?: Record<string, string>

  /**
   * External AbortSignal — caller can cancel the request.
   * Cancellation is forwarded to the internal AbortController.
   */
  signal?: AbortSignal

  /**
   * Per-request timeout in milliseconds.
   * Defaults to DEFAULT_TIMEOUT_MS (30 s). Set to 0 to disable.
   */
  timeout?: number

  /** Response body parsing strategy (default: 'json') */
  responseType?: ResponseType
}

// ── API Response Envelopes ────────────────────────────────────────────────

/** Standard single-resource API response */
export interface ApiResponse<T> {
  readonly success: boolean
  readonly data: T
  readonly message: string
  readonly errors?: readonly string[]
}

/** Paginated API response */
export interface PaginatedResponse<T> {
  readonly success: boolean
  readonly data: readonly T[]
  readonly meta: PaginationMeta
  readonly message?: string
}

export interface PaginationMeta {
  readonly total:   number
  readonly page?:   number
  readonly limit:   number
  readonly offset:  number
}

// ── Bulk Operation Types ──────────────────────────────────────────────────

export interface BulkUpdateRequest {
  ids:    string[]
  status: string
}

export interface BulkDeleteRequest {
  ids: string[]
}

export interface BulkUpdateResponse {
  success: boolean
  updated: number
  message?: string
}

export interface BulkDeleteResponse {
  success: boolean
  deleted: number
  message?: string
}

// ── List/Query Params ─────────────────────────────────────────────────────

/** Standard list-query parameters shared across all CMS list endpoints */
export interface ListParams {
  page?:   number
  limit?:  number
  search?: string
  status?: string
  sort?:   string
  order?:  'asc' | 'desc'
}

// ── Org Types ─────────────────────────────────────────────────────────────

export type OrgRole = 'owner' | 'admin' | 'editor' | 'viewer'
