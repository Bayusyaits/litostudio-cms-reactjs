/// <reference types="vite/client" />
/**
 * request.ts — core fetch execution layer.
 *
 * Responsibilities:
 *  - URL composition (base URL + endpoint + query string)
 *  - Request header building (auth token, Content-Type, caller extras)
 *  - Request body serialization (JSON, FormData, Blob, plain string)
 *  - AbortController timeout + external signal forwarding
 *  - Inflight GET deduplication (prevents redundant concurrent requests)
 *  - Header + URL sanitization (injection prevention)
 *  - Auth guard: 401 redirect only on protected pages
 */

import type { HttpMethod, QueryParams, QueryParamValue, RequestOptions } from './types'
import { HTTP_METHODS } from './types'
import { TimeoutError, NetworkError } from './errors'
import { parseResponse } from './response'
import { getStoredToken, handleUnauthorized, handleForbidden } from './auth'

// ── Defaults ──────────────────────────────────────────────────────────────

/** Per-request timeout in milliseconds when no explicit timeout is set */
const DEFAULT_TIMEOUT_MS = 30_000

// ── Inflight GET deduplication ─────────────────────────────────────────────
//
// Prevents the same GET being sent twice concurrently (e.g. StrictMode double-
// effect or multiple components mounting at once). The map is keyed on
// method + URL + auth token so different users never share results.

const inflightGets = new Map<string, Promise<unknown>>()

function getInflightKey(
  method: HttpMethod,
  url: string,
  authHeader: string | undefined,
): string {
  // Only deduplicate GETs — mutations must always go through
  if (method !== HTTP_METHODS.GET) return ''
  return `${url}||${authHeader ?? ''}`
}

// ── Security: sanitization helpers ───────────────────────────────────────
//
// Lightweight guards against header injection and query-string injection.
// Note: URLSearchParams in buildQueryString already handles percent-encoding.

/**
 * A header name is safe when it contains only token characters as defined by
 * RFC 7230 §3.2.6. Prevents CR/LF injection via forged header names.
 */
function isSafeHeaderName(name: string): boolean {
  return /^[\w!#$%&'*+\-.^`|~]+$/.test(name)
}

/**
 * A header value is safe when it contains no CR or LF characters.
 * These are the characters used in HTTP response splitting attacks.
 */
function isSafeHeaderValue(value: string): boolean {
  return !/[\r\n]/.test(value)
}

/** Coerce a query-param scalar value to a plain string */
function coerceParamValue(value: QueryParamValue): string {
  return String(value)
}

// ── URL helpers ───────────────────────────────────────────────────────────

/**
 * Resolve the API base URL.
 * In Vite (browser + SSR-via-vite-node), VITE_API_URL is inlined at build time.
 * When unset, an empty string is returned, making all URLs relative — this
 * lets the Vite dev proxy handle /api/* without CORS.
 */
function resolveBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? ''
}

/**
 * Serialize a QueryParams map into a URL query string.
 * Uses URLSearchParams for correct percent-encoding.
 * Null/undefined values are skipped. Arrays expand as repeated keys.
 */
export function buildQueryString(params: QueryParams): string {
  const usp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue
    if (Array.isArray(value)) {
      // value is readonly QueryParamValue[] — iterate and append each item
      for (const item of value as readonly QueryParamValue[]) {
        if (item != null) usp.append(key, coerceParamValue(item))
      }
    } else {
      // value is QueryParamValue (scalar) after excluding arrays and nullish
      usp.set(key, coerceParamValue(value as QueryParamValue))
    }
  }
  return usp.toString()
}

/** Build the full request URL from endpoint + optional query params */
export function buildUrl(endpoint: string, params?: QueryParams): string {
  const qs = params ? buildQueryString(params) : ''
  return `${resolveBaseUrl()}${endpoint}${qs ? `?${qs}` : ''}`
}

// ── Header helpers ────────────────────────────────────────────────────────

/**
 * Build the merged request headers.
 *
 * Order of precedence:
 *  1. Default headers (Content-Type: application/json)
 *  2. Bearer token from cookie (or `tokenOverride` when caller supplies one)
 *  3. Caller-supplied extra headers (sanitized)
 *
 * @param extra         - Additional headers from RequestOptions.headers
 * @param tokenOverride - When the caller passes an Authorization header,
 *                        the token is extracted from it and used here
 *                        instead of reading from the cookie.
 */
function buildHeaders(
  extra: Record<string, string> | undefined,
  tokenOverride: string | undefined,
): Record<string, string> {
  const token = tokenOverride ?? getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  if (extra) {
    for (const [name, value] of Object.entries(extra)) {
      if (!isSafeHeaderName(name))   continue // drop unsafe header names
      if (!isSafeHeaderValue(value)) continue // drop CR/LF values
      headers[name] = value
    }
  }

  return headers
}

// ── Body helpers ──────────────────────────────────────────────────────────

/** Serialize the request body for the given HTTP method */
function buildBody(method: HttpMethod, data: unknown): BodyInit | undefined {
  // GET has no body
  if (method === HTTP_METHODS.GET || data === undefined || data === null) return undefined
  // Pass-through types that fetch understands natively
  if (data instanceof FormData)     return data
  if (data instanceof Blob)         return data
  if (data instanceof ArrayBuffer)  return data
  if (typeof data === 'string')     return data
  // Everything else: JSON-serialize
  return JSON.stringify(data)
}

/**
 * When the body is FormData, remove the Content-Type header so the browser
 * can set it with the correct multipart/form-data boundary.
 */
function patchHeadersForBody(
  headers: Record<string, string>,
  body: BodyInit | undefined,
): Record<string, string> {
  if (!(body instanceof FormData)) return headers
  const { 'Content-Type': _omit, ...rest } = headers
  void _omit // explicitly discarded
  return rest
}

// ── Core execution ────────────────────────────────────────────────────────

/**
 * Execute an HTTP request using the native Fetch API.
 *
 * Features:
 *  - Automatic Bearer token injection from session cookie
 *  - AbortController-based timeout (merged with optional external signal)
 *  - Inflight GET deduplication
 *  - Header/value sanitization
 *  - Auth-page aware 401 redirect
 *  - Typed error throwing (HttpError, TimeoutError, NetworkError)
 */
export async function executeRequest<T>(
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS

  // Extract token override when caller supplies an Authorization header
  const callerAuth    = options?.headers?.['Authorization']
  const tokenOverride = callerAuth?.startsWith('Bearer ') ? callerAuth.slice(7) : undefined

  const rawHeaders  = buildHeaders(options?.headers, tokenOverride)
  const requestBody = buildBody(method, body)
  const headers     = patchHeadersForBody(rawHeaders, requestBody)
  const url         = buildUrl(endpoint, options?.params)

  // Return an existing inflight GET promise when available
  const inflightKey = getInflightKey(method, url, headers['Authorization'])
  if (inflightKey) {
    const existing = inflightGets.get(inflightKey)
    if (existing) return existing as Promise<T>
  }

  // ── Set up AbortController + timeout ───────────────────────────────────
  const controller = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  }

  // Forward external cancellation signal
  let externalListener: (() => void) | undefined
  if (options?.signal) {
    externalListener = (): void => { controller.abort() }
    options.signal.addEventListener('abort', externalListener)
  }

  const run = async (): Promise<T> => {
    let res: Response
    try {
      res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body:         requestBody,
        signal:       controller.signal,
      })
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        throw new TimeoutError(timeoutMs)
      }
      throw new NetworkError(err instanceof Error ? err.message : undefined)
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      if (externalListener && options?.signal) {
        options.signal.removeEventListener('abort', externalListener)
      }
    }

    handleUnauthorized(res.status)
    handleForbidden(res.status)
    return parseResponse<T>(res, options?.responseType)
  }

  // Non-GET requests: run directly
  if (!inflightKey) return run()

  // GET requests: register in inflight map; clean up on completion
  const pending = run().finally((): void => {
    inflightGets.delete(inflightKey)
  }) as Promise<T>

  inflightGets.set(inflightKey, pending)
  return pending
}
