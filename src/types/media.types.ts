export interface Media {
  id: string
  organization_id: string
  site_id: string | null
  filename: string
  original_url: string | null
  cdn_url: string | null
  media_type: 'image' | 'video' | 'document' | 'audio'
  mime_type: string
  size_bytes: number
  dimensions: { width: number; height: number } | null
  alt_text: string | null
  caption: string | null
  folder: string | null
  provider: string | null
  provider_id: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface MediaPresignRequest {
  filename: string
  content_type: string
  size_bytes: number
  folder?: string
  alt_text?: string
}

export interface MediaPresignResponse {
  success: boolean
  data: {
    upload_url: string
    cdn_url: string
    key: string
    expires_in: number
  }
}

export interface MediaConfirmRequest {
  key: string
  cdn_url: string
  filename: string
  media_type: 'image' | 'video' | 'document' | 'audio'
  mime_type: string
  size_bytes: number
  width?: number
  height?: number
  alt_text?: string
  caption?: string
  folder?: string
  tags?: string[]
}

export type MediaFilter = {
  site_id?: string
  q?: string
  media_type?: 'image' | 'video' | 'document' | 'audio'
  folder?: string
  page?: number
  per_page?: number
}

export interface MediaPaginationMeta {
  total: number
  page: number
  per_page: number
  total_pages: number
  has_more: boolean
}
