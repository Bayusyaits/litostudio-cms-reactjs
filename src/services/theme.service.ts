import { apiClient } from '@/lib/axios'
import type { ApiResponse } from '@/types/api.types'

export interface Theme {
  id: string
  name: string
  slug: string
  description: string | null
  preview_image: string | null
  is_active: boolean
  settings_schema: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface SiteThemeSettings {
  id: string
  site_id: string
  theme_id: string
  settings: Record<string, unknown>
  theme?: Theme
}

export const themeService = {
  async listThemes() {
    const { data } = await apiClient.get<{ success: boolean; data: Theme[] }>('/api/v1/cms/themes')
    return data
  },

  async getTheme(themeId: string) {
    const { data } = await apiClient.get<ApiResponse<Theme>>(`/api/v1/cms/themes/${themeId}`)
    return data.data
  },

  async getSiteTheme(siteId: string) {
    const { data } = await apiClient.get<ApiResponse<SiteThemeSettings>>(
      `/api/v1/cms/themes/site/${siteId}`,
    )
    return data.data
  },

  async updateSiteTheme(siteId: string, themeId: string, settings: Record<string, unknown> = {}) {
    const { data } = await apiClient.put<ApiResponse<SiteThemeSettings>>(
      `/api/v1/cms/themes/site/${siteId}`,
      { theme_id: themeId, settings },
    )
    return data.data
  },
}
