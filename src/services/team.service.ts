import { apiClient } from '@/lib/axios'
import type { ApiResponse, OrgRole } from '@/types/api.types'

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

const BASE = '/api/v1/cms/organizations'

export const teamService = {
  async getMembers(_params?: { page?: number; limit?: number; search?: string }) {
    const { data } = await apiClient.get<ApiResponse<TeamMember[]>>(`${BASE}/members`)
    return data
  },

  async invite(payload: InvitePayload) {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(`${BASE}/invites`, payload)
    return data.data
  },

  async updateRole(userId: string, role: OrgRole) {
    const { data } = await apiClient.patch<ApiResponse<TeamMember>>(`${BASE}/members/${userId}/role`, { role })
    return data.data
  },

  async remove(userId: string) {
    await apiClient.delete(`${BASE}/members/${userId}`)
  },
}
