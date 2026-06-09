import { apiClient } from '@/lib/axios'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { OrgRole } from '@/types/api.types'

export interface TeamMember {
  id: string
  user_id: string
  org_id: string
  role: OrgRole
  email: string
  full_name: string | null
  avatar_url: string | null
  joined_at: string
  status: 'active' | 'invited' | 'suspended'
}

export interface InvitePayload {
  email: string
  role: OrgRole
}

export const teamService = {
  async getMembers(params?: { page?: number; limit?: number; search?: string }) {
    const q = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
    ).toString() : ''
    const url = q ? `/api/v1/cms/team?${q}` : '/api/v1/cms/team'
    const { data } = await apiClient.get<PaginatedResponse<TeamMember>>(url)
    return data
  },

  async invite(payload: InvitePayload) {
    const { data } = await apiClient.post<ApiResponse<TeamMember>>('/api/v1/cms/team/invite', payload)
    return data.data
  },

  async updateRole(memberId: string, role: OrgRole) {
    const { data } = await apiClient.patch<ApiResponse<TeamMember>>(`/api/v1/cms/team/${memberId}/role`, { role })
    return data.data
  },

  async remove(memberId: string) {
    await apiClient.delete(`/api/v1/cms/team/${memberId}`)
  },
}
