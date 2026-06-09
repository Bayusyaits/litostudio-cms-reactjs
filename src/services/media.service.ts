import { apiClient } from '@/lib/axios'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { Media, MediaPresignRequest, MediaPresignResponse, MediaConfirmRequest, MediaFilter } from '@/types/media.types'

export const mediaService = {
  async getList(params?: MediaFilter) {
    const query = params ? new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      )
    ).toString() : ''
    const url = query ? `/api/v1/cms/media?${query}` : '/api/v1/cms/media'
    const { data } = await apiClient.get<PaginatedResponse<Media>>(url)
    return data
  },

  async presign(payload: MediaPresignRequest) {
    const { data } = await apiClient.post<MediaPresignResponse>('/api/v1/cms/media/presign', payload)
    return data.data
  },

  async confirm(payload: MediaConfirmRequest) {
    const { data } = await apiClient.post<ApiResponse<Media>>('/api/v1/cms/media/confirm', payload)
    return data.data
  },

  async remove(mediaId: string) {
    await apiClient.delete(`/api/v1/cms/media/${mediaId}`)
  },

  /** Upload a file: presign → put to S3/R2 → confirm */
  async upload(file: File, options?: { folder?: string; site_id?: string; alt_text?: string }): Promise<Media> {
    const presign = await mediaService.presign({
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      folder:    options?.folder,
    })

    await fetch(presign.upload_url, {
      method:  'PUT',
      headers: { 'Content-Type': file.type },
      body:    file,
    })

    const dims = await getImageDimensions(file)

    return mediaService.confirm({
      key:       presign.key,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      ...dims,
      alt_text: options?.alt_text ?? file.name.replace(/\.[^.]+$/, ''),
      folder:   options?.folder,
      site_id:  options?.site_id,
    })
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
