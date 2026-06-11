/**
 * request.ts — compatibility shim.
 *
 * All service files import `http` from here. This file re-exports from
 * the canonical `@/lib/http` module so existing imports continue to work
 * without changes.
 *
 * New code should import directly from '@/lib/http'.
 *
 * @deprecated Use `@/lib/http` directly for new code.
 */
export {
  http,
  SESSION_COOKIE,
  getErrorMessage,
  HttpError as RequestError,
  HttpError,
  isAuthPage,
  getStoredToken,
  removeStoredToken,
  handleUnauthorized,
  buildQueryString,
  buildUrl,
} from '@/lib/http'

export type {
  RequestOptions,
  QueryParams,
  QueryParamValue,
  ApiResponse,
  PaginatedResponse,
  ListParams,
} from '@/lib/http'
