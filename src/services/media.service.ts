import { http } from '@/lib/request'
import { getOrCreateIdempotencyKey, clearIdempotencyKey } from '@/lib/idempotency'
import type { ApiResponse } from '@/types/api.types'
import type {
  Media,
  MediaPresignRequest,
  MediaPresignResponse,
  MediaConfirmRequest,
  MediaFilter,
  MediaPaginationMeta,
} from '@/types/media.types'

export const mediaService = {
  async getList(params?: MediaFilter) {
    const query = params
      ? new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v != null)
              .map(([k, v]) => [k, String(v)]),
          ),
        ).toString()
      : ''
    const url = query ? `/api/v1/cms/media?${query}` : '/api/v1/cms/media'
    const data = await http.get<{ success: boolean; data: Media[]; meta: MediaPaginationMeta }>(url)
    return data
  },

  /**
   * `idempotencyKey`, when supplied, is sent as the Idempotency-Key header
   * and used by the backend to derive a deterministic storage key (see
   * storage.provider.ts generateKey()) instead of Date.now() — this route
   * is deliberately NOT gated by the shared idempotencyGuard/table (see the
   * backend route comment), so passing the same key here on a retry is
   * what actually prevents a second, different storage key from being
   * minted for the same upload attempt.
   */
  async presign(payload: MediaPresignRequest, idempotencyKey?: string) {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined
    const data = await http.post<MediaPresignResponse>('/api/v1/cms/media/presign', payload, { headers })
    return data.data
  },

  /** `idempotencyKey` here IS checked against the shared idempotency table
   *  (this route creates the DB media record — the real "duplicate asset"
   *  risk) — see media.routes.ts POST /confirm. */
  async confirm(payload: MediaConfirmRequest, idempotencyKey?: string) {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined
    const data = await http.post<ApiResponse<Media>>('/api/v1/cms/media/confirm', payload, { headers })
    return data.data
  },

  async remove(mediaId: string) {
    await http.delete(`/api/v1/cms/media/${mediaId}`)
  },

  /**
   * Upload a file: presign → PUT to R2 → confirm.
   * One Idempotency-Key spans both the presign and confirm calls — see the
   * doc comments on those two methods for why that's safe (different
   * endpoints/bodies never collide in the shared table) and necessary
   * (retrying presign alone must not mint a second storage key).
   */
  async upload(
    file: File,
    options?: { folder?: string; site_id?: string; alt_text?: string },
  ): Promise<Media> {
    const actionId = `upload:${file.name}:${file.size}:${file.lastModified}`
    const idempotencyKey = getOrCreateIdempotencyKey(actionId)

    try {
      const presign = await mediaService.presign({
        filename:     file.name,
        content_type: file.type,
        size_bytes:   file.size,
        folder:       options?.folder,
      }, idempotencyKey)

      await fetch(presign.upload_url, {
        method:  'PUT',
        headers: { 'Content-Type': file.type },
        body:    file,
      })

      const dims = await getImageDimensions(file)
      const mediaType = resolveMediaType(file.type)

      return await mediaService.confirm({
        key:        presign.key,
        cdn_url:    presign.cdn_url,
        filename:   file.name,
        media_type: mediaType,
        mime_type:  file.type,
        size_bytes: file.size,
        ...dims,
        alt_text: options?.alt_text ?? file.name.replace(/\.[^.]+$/, ''),
        folder:   options?.folder,
      }, idempotencyKey)
    } finally {
      clearIdempotencyKey(actionId)
    }
  },
}

async function getImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith('image/')) return {}
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => resolve({})
    img.src = url
  })
}

function resolveMediaType(mimeType: string): MediaConfirmRequest['media_type'] {
  if (mimeType.startsWith('image/'))  return 'image'
  if (mimeType.startsWith('video/'))  return 'video'
  if (mimeType.startsWith('audio/'))  return 'audio'
  return 'document'
}
