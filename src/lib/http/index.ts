/**
 * index.ts — public API of the @/lib/http module.
 *
 * Import from here, not from individual sub-modules:
 *
 *   import { http, getErrorMessage, SESSION_COOKIE } from '@/lib/http'
 *   import type { ApiResponse, RequestOptions }      from '@/lib/http'
 */

// ── HTTP Client ───────────────────────────────────────────────────────────
export { http } from './client'

// ── Auth utilities ────────────────────────────────────────────────────────
export {
  SESSION_COOKIE,
  isAuthPage,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  handleUnauthorized,
} from './auth'

// ── Error classes & utilities ─────────────────────────────────────────────
export {
  HttpError,
  TimeoutError,
  NetworkError,
  getErrorMessage,
  isHttpError,
  isTimeoutError,
  isNetworkError,
  classifyStatus,
  HTTP_STATUS,
} from './errors'

// ── URL/query utilities ───────────────────────────────────────────────────
export { buildQueryString, buildUrl, executeRequest } from './request'

// ── Upload utilities ──────────────────────────────────────────────────────
export { uploadFile, uploadFormData, buildFormData } from './upload'

// ── Types ─────────────────────────────────────────────────────────────────
export type {
  HttpMethod,
  QueryParamValue,
  QueryParams,
  ResponseType,
  RequestOptions,
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
  BulkUpdateRequest,
  BulkDeleteRequest,
  BulkUpdateResponse,
  BulkDeleteResponse,
  ListParams,
  OrgRole,
} from './types'

export { HTTP_METHODS } from './types'

export type {
  HttpErrorCode,
  AnyHttpError,
} from './errors'

export type {
  UploadProgressEvent,
  UploadProgressCallback,
  DirectUploadOptions,
} from './upload'
