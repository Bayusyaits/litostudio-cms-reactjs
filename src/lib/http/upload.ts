/**
 * upload.ts — file upload utilities.
 *
 * Two upload strategies:
 *
 *  1. Direct upload to presigned URL (Cloudflare R2 / S3 compatible)
 *     PUT presigned-url ← file bytes
 *     Used by the media module: presign → PUT → confirm.
 *
 *  2. Multipart/form-data POST to a CMS API endpoint
 *     Used when the API itself handles storage.
 *
 * Progress tracking uses XMLHttpRequest (fetch has no upload progress API).
 * When no progress callback is provided, fetch is used (cleaner, supports
 * AbortSignal with correct cancellation semantics).
 */

import type { RequestOptions } from './types'
import { HTTP_METHODS } from './types'
import { executeRequest } from './request'
import { NetworkError, TimeoutError } from './errors'

// ── Progress types ─────────────────────────────────────────────────────────

export interface UploadProgressEvent {
  /** Bytes transferred so far */
  readonly loaded:   number
  /** Total file size in bytes (0 if unknown) */
  readonly total:    number
  /** 0–100 percentage (0 if total is unknown) */
  readonly percent:  number
}

export type UploadProgressCallback = (event: UploadProgressEvent) => void

// ── Direct upload (presigned PUT) ─────────────────────────────────────────

export interface DirectUploadOptions {
  /** External abort signal for cancellation */
  signal?:     AbortSignal
  /** Timeout in ms (default: 5 min — accommodates large media files) */
  timeout?:    number
  /** Called during upload to report byte progress */
  onProgress?: UploadProgressCallback
}

/** Default timeout for direct uploads: 5 minutes */
const UPLOAD_TIMEOUT_MS = 5 * 60 * 1_000

/**
 * Upload a `File` directly to a presigned URL (Cloudflare R2 / S3).
 *
 * Uses XMLHttpRequest when `onProgress` is provided (only XHR exposes
 * upload.onprogress). Falls back to fetch otherwise.
 */
export async function uploadFile(
  presignedUrl: string,
  file: File,
  contentType: string,
  options?: DirectUploadOptions,
): Promise<void> {
  const timeoutMs = options?.timeout ?? UPLOAD_TIMEOUT_MS

  if (options?.onProgress) {
    return uploadWithXhr(presignedUrl, file, contentType, options.onProgress, timeoutMs, options.signal)
  }

  return uploadWithFetch(presignedUrl, file, contentType, timeoutMs, options?.signal)
}

// ── Internal: fetch-based upload (no progress) ────────────────────────────

async function uploadWithFetch(
  url: string,
  file: File,
  contentType: string,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<void> {
  const controller = new AbortController()
  const timeoutId  = timeoutMs > 0 ? setTimeout(() => { controller.abort() }, timeoutMs) : undefined

  let externalListener: (() => void) | undefined
  if (signal) {
    externalListener = (): void => { controller.abort() }
    signal.addEventListener('abort', externalListener)
  }

  try {
    const res = await fetch(url, {
      method:  'PUT',
      headers: { 'Content-Type': contentType },
      body:    file,
      signal:  controller.signal,
    })
    if (!res.ok) {
      throw new NetworkError(`Direct upload failed — HTTP ${res.status}`)
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw new TimeoutError(timeoutMs)
    if (err instanceof NetworkError) throw err
    throw new NetworkError(err instanceof Error ? err.message : undefined)
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
    if (externalListener && signal) {
      signal.removeEventListener('abort', externalListener)
    }
  }
}

// ── Internal: XHR-based upload (with progress) ────────────────────────────

function uploadWithXhr(
  url: string,
  file: File,
  contentType: string,
  onProgress: UploadProgressCallback,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)
    if (timeoutMs > 0) xhr.timeout = timeoutMs

    xhr.upload.onprogress = (e: ProgressEvent): void => {
      const total   = e.total ?? 0
      const loaded  = e.loaded ?? 0
      const percent = total > 0 ? Math.round((loaded / total) * 100) : 0
      onProgress({ loaded, total, percent })
    }

    xhr.ontimeout = (): void => { reject(new TimeoutError(timeoutMs)) }
    xhr.onerror   = (): void => { reject(new NetworkError('XHR upload error')) }
    xhr.onabort   = (): void => { reject(new NetworkError('Upload cancelled')) }

    xhr.onload = (): void => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new NetworkError(`Direct upload failed — HTTP ${xhr.status}`))
      }
    }

    if (signal) {
      signal.addEventListener('abort', (): void => {
        xhr.abort()
        reject(new NetworkError('Upload cancelled'))
      })
    }

    xhr.send(file)
  })
}

// ── FormData upload (to CMS API) ──────────────────────────────────────────

/**
 * POST multipart/form-data to a CMS API endpoint.
 *
 * The Content-Type header is intentionally omitted so the browser can set
 * it with the correct multipart/form-data boundary string.
 */
export async function uploadFormData<T>(
  endpoint: string,
  formData: FormData,
  options?: RequestOptions,
): Promise<T> {
  // Passing FormData as body — executeRequest detects it, skips JSON.stringify,
  // and patchHeadersForBody drops Content-Type so the browser sets the boundary.
  return executeRequest<T>(HTTP_METHODS.POST, endpoint, formData, options)
}

/**
 * Build a FormData instance from a flat fields record.
 * Useful for constructing multipart uploads programmatically.
 *
 * @example
 * const fd = buildFormData({ file, alt_text: 'Photo', site_id: siteId })
 * await http.upload('/api/v1/cms/media/upload', fd)
 */
export function buildFormData(
  fields: Record<string, string | File | Blob>,
): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}
