/**
 * errors.ts — typed HTTP error classes and normalization utilities.
 *
 * Uses discriminated unions and class-based errors so callers can use
 * both `instanceof` checks and the `code` discriminant interchangeably.
 */

// ── HTTP Status codes ─────────────────────────────────────────────────────

export const HTTP_STATUS = {
  BAD_REQUEST:       400,
  UNAUTHORIZED:      401,
  FORBIDDEN:         403,
  NOT_FOUND:         404,
  CONFLICT:          409,
  UNPROCESSABLE:     422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR:      500,
} as const

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS]

// ── Error codes (discriminant) ────────────────────────────────────────────

export type HttpErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE'
  | 'TOO_MANY_REQUESTS'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN'

/** Map an HTTP status integer to a semantic error code */
export function classifyStatus(status: number): HttpErrorCode {
  switch (true) {
    case status === 0:   return 'NETWORK_ERROR'
    case status === 400: return 'BAD_REQUEST'
    case status === 401: return 'UNAUTHORIZED'
    case status === 403: return 'FORBIDDEN'
    case status === 404: return 'NOT_FOUND'
    case status === 409: return 'CONFLICT'
    case status === 422: return 'UNPROCESSABLE'
    case status === 429: return 'TOO_MANY_REQUESTS'
    case status >= 500:  return 'SERVER_ERROR'
    default:             return 'UNKNOWN'
  }
}

// ── Error Classes ─────────────────────────────────────────────────────────

/**
 * Thrown for any non-2xx HTTP response.
 * `status` is the HTTP status code.
 * `code` is the semantic classification for switch-case handling.
 * `data` is the raw parsed response body (if available).
 */
export class HttpError extends Error {
  readonly name  = 'HttpError' as const
  readonly code:   HttpErrorCode
  readonly status: number
  readonly data:   unknown

  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.code   = classifyStatus(status)
    this.status = status
    this.data   = data
    Object.setPrototypeOf(this, HttpError.prototype)
  }

  get isUnauthorized(): boolean { return this.status === HTTP_STATUS.UNAUTHORIZED }
  get isForbidden():    boolean { return this.status === HTTP_STATUS.FORBIDDEN }
  get isNotFound():     boolean { return this.status === HTTP_STATUS.NOT_FOUND }
  get isConflict():     boolean { return this.status === HTTP_STATUS.CONFLICT }
  get isServerError():  boolean { return this.status >= HTTP_STATUS.SERVER_ERROR }
}

/**
 * Thrown when the request exceeds its timeout.
 * Distinct from HttpError so callers can retry without treating it as a
 * server-side error.
 */
export class TimeoutError extends Error {
  readonly name = 'TimeoutError' as const
  readonly code = 'TIMEOUT' as const

  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`)
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }
}

/**
 * Thrown for network-level failures (offline, DNS failure, CORS preflight
 * rejected, etc.) where no HTTP response was received.
 */
export class NetworkError extends Error {
  readonly name = 'NetworkError' as const
  readonly code = 'NETWORK_ERROR' as const

  constructor(cause?: string) {
    super(cause ?? 'Network request failed — check your connection')
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

/** Union of all typed HTTP errors */
export type AnyHttpError = HttpError | TimeoutError | NetworkError

// ── Error Utilities ───────────────────────────────────────────────────────

/**
 * Extract a human-readable message from any thrown value.
 * Handles our typed errors, plain Error objects, and unknown throws.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof HttpError)    return error.message
  if (error instanceof TimeoutError) return error.message
  if (error instanceof NetworkError) return error.message
  if (error instanceof Error)        return error.message
  return 'An unexpected error occurred'
}

/** Type guard — narrows to HttpError */
export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError
}

/** Type guard — narrows to TimeoutError */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError
}

/** Type guard — narrows to NetworkError */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}
