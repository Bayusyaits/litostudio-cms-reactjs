import { http } from '@/lib/request'
import type { ApiResponse } from '@/types/api.types'

export interface Theme {
  id: string
  name: string
  slug: string
  version: string
  description: string | null
  preview_image: string | null
  template_slug: string | null   // 'lito' | 'fashion' | 'beauty' — matches template dir
  category: string | null        // 'photography' | 'fashion' | 'beauty'
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
    const data = await http.get<{ success: boolean; data: Theme[] }>('/api/v1/cms/themes')
    return data
  },

  async getTheme(themeId: string) {
    const data = await http.get<ApiResponse<Theme>>(`/api/v1/cms/themes/${themeId}`)
    return data.data
  },

  async getSiteTheme(siteId: string) {
    const data = await http.get<ApiResponse<SiteThemeSettings>>(
      `/api/v1/cms/themes/sites/${siteId}/settings`,
    )
    return data.data
  },

  async updateSiteTheme(siteId: string, payload: SiteThemeUpdateRequest) {
    const data = await http.put<ApiResponse<SiteThemeSettings>>(
      `/api/v1/cms/themes/sites/${siteId}/settings`,
      payload,
    )
    return data.data
  },

  /**
   * Seed extra_settings with template default content.
   * Safe by default — only fills missing/empty keys (overwrite=false).
   * Call after switching a template so users don't start from zero.
   */
  async seedTemplateDefaults(
    siteId:        string,
    templateSlug:  'fashion' | 'beauty' | 'lito',
    locale?:       'en' | 'id',
    overwrite?:    boolean,
  ) {
    const data = await http.post<{
      success:    boolean
      message:    string
      keys_added: number
      overwrite:  boolean
    }>(`/api/v1/cms/themes/sites/${siteId}/seed-defaults`, {
      template_slug: templateSlug,
      locale:        locale ?? 'en',
      overwrite:     overwrite ?? false,
    })
    return data
  },

  /**
   * Republish all active pages for a site:
   *   1. Wipes each page's page_sections
   *   2. Re-seeds from the current template's DEFAULTS
   *   3. Records a 'staging' deployment row
   *
   * Returns a log array that can be streamed into a deployment-log UI.
   */
  async republishPages(siteId: string): Promise<{
    success:        boolean
    deployment_id:  string | null
    pages_updated:  number
    template_slug:  string
    log:            string[]
  }> {
    return http.post(`/api/v1/cms/themes/sites/${siteId}/republish-pages`, {})
  },
}
