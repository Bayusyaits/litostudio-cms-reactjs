import { apiClient } from '@/lib/axios'
import type { ApiResponse } from '@/types/api.types'

export interface NavItem {
  id?: string
  label: string
  url: string
  target?: '_blank' | '_self'
  nav_type?: string
  sort_order?: number
  children?: NavItem[]
  nav_translations?: Array<{ locale: string; label: string }>
}

export const navigationService = {
  /** Get all navigation items for a site */
  async getNavigation(siteId: string) {
    const { data } = await apiClient.get<{ success: boolean; data: NavItem[] }>(
      `/api/v1/cms/sites/${siteId}/navigation`,
    )
    return data
  },

  /** Replace all navigation items for a site */
  async updateNavigation(siteId: string, items: NavItem[]) {
    const { data } = await apiClient.put<ApiResponse<{ message: string }>>(
      `/api/v1/cms/sites/${siteId}/navigation`,
      { items },
    )
    return data
  },
}
