/**
 * response.ts — type-safe HTTP response parsing.
 *
 * Parses the fetch Response body into the correct shape and throws
 * a typed HttpError for non-2xx responses.
 */

import type { ResponseType } from './types'
import { HttpError } from './errors'

// ── Error envelope extraction ─────────────────────────────────────────────

/**
 * Extract the best human-readable error message from a parsed response body.
 * Checks the standard backend error envelope ({ message, title, errors }) in order.
 */
function extractErrorMessage(body: unknown): string {
  if (typeof body !== 'object' || body === null) return 'Request failed'
  const b = body as Record<string, unknown>
  if (typeof b['message'] === 'string' && b['message']) return b['message']
  if (typeof b['title']   === 'string' && b['title'])   return b['title']
  if (Array.isArray(b['errors']) && typeof b['errors'][0] === 'string') {
    return b['errors'][0]
  }
  return 'Request failed'
}

// ── Response parser ───────────────────────────────────────────────────────

/**
 * Parse a fetch Response body according to the requested responseType.
 *
 * - 204 No Content returns null (typed as T — caller is responsible for knowing
 *   when endpoints return no body)
 * - Non-2xx responses throw HttpError with the message extracted from the body
 * - JSON parsing falls back to text when Content-Type is not application/json
 */
export async function parseResponse<T>(
  res: Response,
  responseType: ResponseType = 'json',
): Promise<T> {
  // 204 No Content — no body to parse
  if (res.status === 204) return null as T

  // ── Blob response ──────────────────────────────────────────────────────
  if (responseType === 'blob') {
    const blob = await res.blob()
    if (!res.ok) throw new HttpError(res.status, res.statusText, blob)
    return blob as T
  }

  // ── Text response ──────────────────────────────────────────────────────
  if (responseType === 'text') {
    const text = await res.text()
    if (!res.ok) throw new HttpError(res.status, text || res.statusText)
    return text as T
  }

  // ── JSON response (default) ────────────────────────────────────────────
  const contentType = res.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const body: unknown = await res.json()
    if (!res.ok) throw new HttpError(res.status, extractErrorMessage(body), body)
    return body as T
  }

  // Non-JSON content type — read as text, attempt JSON parse
  const text = await res.text()

  if (!text) {
    if (!res.ok) throw new HttpError(res.status, res.statusText)
    return null as T
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    if (!res.ok) throw new HttpError(res.status, text)
    return text as T
  }

  if (!res.ok) throw new HttpError(res.status, extractErrorMessage(parsed), parsed)
  return parsed as T
}
