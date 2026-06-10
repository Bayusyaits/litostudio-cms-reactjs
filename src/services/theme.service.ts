import { apiClient } from '@/lib/axios'
import type { ApiResponse } from '@/types/api.types'

export interface Theme {
  id: string
  name: string
  slug: string
  version: string
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
  theme_version: string
  site_name: string | null
  site_description: string | null
  logo_url: string | null
  dark_logo_url: string | null
  favicon_url: string | null
  og_image_url: string | null
  color_primary: string | null
  color_secondary: string | null
  color_accent: string | null
  color_background: string | null
  color_surface: string | null
  color_border: string | null
  color_text: string | null
  font_heading: string | null
  font_body: string | null
  font_menu: string | null
  font_button: string | null
  header_type: string | null
  footer_type: string | null
  container_width: string | null
  extra_settings: Record<string, unknown> | null
  themes?: Pick<Theme, 'id' | 'name' | 'slug' | 'version'>
}

export interface SiteThemeUpdateRequest {
  theme_id?: string
  site_name?: string
  site_description?: string
  logo_url?: string
  dark_logo_url?: string
  favicon_url?: string
  og_image_url?: string
  color_primary?: string
  color_secondary?: string
  color_accent?: string
  color_background?: string
  color_surface?: string
  color_border?: string
  color_text?: string
  font_heading?: string
  font_body?: string
  font_menu?: string
  font_button?: string
  header_type?: 'standard' | 'sticky' | 'transparent' | 'minimal'
  footer_type?: 'standard' | 'minimal' | 'extended'
  container_width?: string
  extra_settings?: Record<string, unknown>
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
      `/api/v1/cms/themes/sites/${siteId}/settings`,
    )
    return data.data
  },

  async updateSiteTheme(siteId: string, payload: SiteThemeUpdateRequest) {
    const { data } = await apiClient.put<ApiResponse<SiteThemeSettings>>(
      `/api/v1/cms/themes/sites/${siteId}/settings`,
      payload,
    )
    return data.data
  },
}
