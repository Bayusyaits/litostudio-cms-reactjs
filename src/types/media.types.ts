export interface Media {
  id: string
  organization_id: string
  site_id: string | null
  file_name: string
  file_url: string
  cdn_url: string | null
  mime_type: string
  file_size: number
  width: number | null
  height: number | null
  alt_text: string | null
  caption: string | null
  folder: string | null
  provider: string | null
  provider_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface MediaPresignRequest {
  file_name: string
  mime_type: string
  file_size: number
  folder?: string
}

export interface MediaPresignResponse {
  success: boolean
  data: {
    upload_url: string
    key: string
    expires_in: number
  }
}

export interface MediaConfirmRequest {
  key: string
  file_name: string
  mime_type: string
  file_size: number
  width?: number
  height?: number
  alt_text?: string
  folder?: string
  site_id?: string
}

export type MediaFilter = {
  site_id?: string
  search?: string
  mime_type?: string
  folder?: string
  page?: number
  limit?: number
}
