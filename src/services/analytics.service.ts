import { http } from '@/lib/request'
import type { ApiResponse } from '@/types/api.types'

export interface AnalyticsSettings {
  id?: string
  site_id?: string
  ga4_measurement_id?: string
  ga4_enabled?: boolean
  gtm_container_id?: string
  gtm_enabled?: boolean
  meta_pixel_id?: string
  meta_enabled?: boolean
  meta_access_token?: string
  tiktok_pixel_id?: string
  tiktok_enabled?: boolean
  anonymize_ip?: boolean
  cookie_consent?: boolean
  updated_at?: string
}

export const analyticsService = {
  async getSettings(siteId: string) {
    return http.get<ApiResponse<AnalyticsSettings | null>>(
      `/api/v1/cms/sites/${siteId}/analytics`,
    )
  },
  async updateSettings(siteId: string, payload: Partial<AnalyticsSettings>) {
    return http.put<ApiResponse<AnalyticsSettings>>(
      `/api/v1/cms/sites/${siteId}/analytics`,
      payload,
    )
  },
}

export interface TrackingScript {
  id?: string
  site_id?: string
  name: string
  position: 'head' | 'body' | 'footer'
  content: string
  is_active?: boolean
  load_order?: number
  description?: string
  created_at?: string
  updated_at?: string
}

export const trackingService = {
  async listScripts(siteId: string) {
    return http.get<ApiResponse<TrackingScript[]>>(
      `/api/v1/cms/sites/${siteId}/tracking`,
    )
  },
  async createScript(siteId: string, payload: Omit<TrackingScript, 'id'>) {
    return http.post<ApiResponse<TrackingScript>>(
      `/api/v1/cms/sites/${siteId}/tracking`,
      payload,
    )
  },
  async updateScript(siteId: string, id: string, payload: Partial<TrackingScript>) {
    return http.patch<ApiResponse<TrackingScript>>(
      `/api/v1/cms/sites/${siteId}/tracking/${id}`,
      payload,
    )
  },
  async deleteScript(siteId: string, id: string) {
    return http.delete<ApiResponse<{ message: string }>>(
      `/api/v1/cms/sites/${siteId}/tracking/${id}`,
    )
  },
}
