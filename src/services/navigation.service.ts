import { apiClient } from '@/lib/axios'
import type { ApiResponse } from '@/types/api.types'

export interface NavItem {
  id: string
  label: string
  url: string
  target?: '_blank' | '_self'
  sort_order: number
  children?: NavItem[]
}

export interface NavigationMenu {
  id: string
  site_id: string
  location: string
  name: string
  items: NavItem[]
  created_at: string
  updated_at: string
}

export interface NavUpdateRequest {
  name?: string
  items?: NavItem[]
}

export const navigationService = {
  async getMenus(siteId: string) {
    const { data } = await apiClient.get<{ success: boolean; data: NavigationMenu[] }>(
      `/api/v1/cms/navigation?site_id=${siteId}`,
    )
    return data
  },

  async getMenu(siteId: string, location: string) {
    const { data } = await apiClient.get<ApiResponse<NavigationMenu>>(
      `/api/v1/cms/navigation/${location}?site_id=${siteId}`,
    )
    return data.data
  },

  async updateMenu(siteId: string, location: string, payload: NavUpdateRequest) {
    const { data } = await apiClient.put<ApiResponse<NavigationMenu>>(
      `/api/v1/cms/navigation/${location}?site_id=${siteId}`,
      payload,
    )
    return data.data
  },
}
