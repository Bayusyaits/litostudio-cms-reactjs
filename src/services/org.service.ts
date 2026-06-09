import { apiClient } from '@/lib/axios'
import type { ApiResponse } from '@/types/api.types'
import type { Organization, Site } from '@/types/auth.types'
import type { ContentStatus } from '@/types/api.types'

export interface DashboardStats {
  stories_published: number
  journal_published: number
  gallery_items: number
  total_views: number
  drafts: number
}

export interface DashboardRecentItem {
  id: string
  title: string
  status: ContentStatus
  updated_at: string
  cover_image?: string
}

export interface DashboardRecent {
  stories: DashboardRecentItem[]
  journal: DashboardRecentItem[]
}

export const orgService = {
  /** Single-org endpoint (legacy) */
  async getOrg() {
    const { data } = await apiClient.get<ApiResponse<Organization>>('/api/v1/cms/organizations/me')
    return data.data
  },

  /** All orgs — used by WorkspaceSwitcher step 1 */
  async getOrgs() {
    const { data } = await apiClient.get<ApiResponse<Organization[]>>('/api/v1/cms/organizations')
    return data
  },

  async updateOrg(payload: { name?: string; settings?: Record<string, unknown> }) {
    const { data } = await apiClient.patch<ApiResponse<Organization>>('/api/v1/cms/organizations/settings', payload)
    return data.data
  },

  /** Sites for current org */
  async getSites() {
    const { data } = await apiClient.get<ApiResponse<Site[]>>('/api/v1/cms/organizations/sites')
    return data.data
  },

  /** Sites for a specific org — used by WorkspaceSwitcher step 2 */
  async getSitesByOrg(orgId: string) {
    const { data } = await apiClient.get<ApiResponse<Site[]>>(`/api/v1/cms/organizations/${orgId}/sites`)
    return data
  },

  async createSite(payload: { name: string; slug?: string; domain?: string }) {
    const { data } = await apiClient.post<ApiResponse<Site>>('/api/v1/cms/organizations/sites', payload)
    return data.data
  },

  async updateSite(siteId: string, payload: { name?: string; domain?: string; settings?: Record<string, unknown> }) {
    const { data } = await apiClient.patch<ApiResponse<Site>>(`/api/v1/cms/organizations/sites/${siteId}`, payload)
    return data.data
  },

  async getDashboardStats(siteId: string) {
    const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/api/v1/cms/dashboard/stats', {
      params: { site_id: siteId },
    })
    return data.data
  },

  async getDashboardRecent(siteId: string) {
    const { data } = await apiClient.get<ApiResponse<DashboardRecent>>('/api/v1/cms/dashboard/recent', {
      params: { site_id: siteId },
    })
    return data.data
  },
}
