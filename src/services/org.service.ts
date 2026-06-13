import { http } from '@/lib/request'
import type { ApiResponse } from '@/types/api.types'
import type { Organization, Site } from '@/types/auth.types'

export interface DashboardStats {
  sites: number
  pages: number
  media: number
  deployments: number
}

export interface DashboardRecentItem {
  id: string
  type: 'story' | 'page' | 'media'
  title: string
  status: string
  updated_at: string
}

export const orgService = {
  /** Get own organization */
  async getOrg() {
    const data = await http.get<ApiResponse<Organization>>('/api/v1/cms/organizations')
    return data.data
  },

  /** All orgs — used by WorkspaceSwitcher (backend returns one org; wrap in array) */
  async getOrgs() {
    const data = await http.get<ApiResponse<Organization>>('/api/v1/cms/organizations')
    const org = data.data
    return { ...data, data: org ? [org] : [] } as ApiResponse<Organization[]>
  },

  /** Create a new organization */
  async createOrg(payload: { name: string; slug?: string; plan?: string }) {
    const data = await http.post<ApiResponse<Organization>>('/api/v1/cms/organizations', payload)
    return data.data
  },

  async updateOrg(payload: { name?: string; settings?: Record<string, unknown> }) {
    const data = await http.patch<ApiResponse<Organization>>('/api/v1/cms/organizations/settings', payload)
    return data.data
  },

  /** Update organization by ID */
  async updateOrgById(orgId: string, payload: { name?: string; settings?: Record<string, unknown> }) {
    const data = await http.patch<ApiResponse<Organization>>(`/api/v1/cms/organizations/${orgId}`, payload)
    return data.data
  },

  /** Delete organization */
  async deleteOrg(orgId: string) {
    await http.delete<ApiResponse<null>>(`/api/v1/cms/organizations/${orgId}`)
  },

  /** Sites for current org */
  async getSites() {
    const data = await http.get<ApiResponse<Site[]>>('/api/v1/cms/organizations/sites')
    return data.data
  },

  /** Sites for current org (alias, ignores orgId — backend scopes to the authenticated user's org) */
  async getSitesByOrg(_orgId?: string) {
    const data = await http.get<ApiResponse<Site[]>>('/api/v1/cms/organizations/sites')
    return data
  },

  async createSite(payload: { name: string; slug?: string; domain?: string }) {
    const data = await http.post<ApiResponse<Site>>('/api/v1/cms/organizations/sites', payload)
    return data.data
  },

  async updateSite(siteId: string, payload: { name?: string; domain?: string; settings?: Record<string, unknown> }) {
    const data = await http.patch<ApiResponse<Site>>(`/api/v1/cms/organizations/sites/${siteId}`, payload)
    return data.data
  },

  async getDashboardStats(_siteId?: string) {
    const data = await http.get<ApiResponse<DashboardStats>>('/api/v1/cms/dashboard/stats')
    return data.data
  },

  async getDashboardRecent(_siteId?: string) {
    const data = await http.get<ApiResponse<DashboardRecentItem[]>>('/api/v1/cms/dashboard/recent')
    return data.data
  },
}
