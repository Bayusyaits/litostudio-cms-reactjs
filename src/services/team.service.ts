import { http } from '@/lib/request'
import { withIdempotencyKey } from '@litostudio/ui-cms'
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
    const data = await http.get<ApiResponse<TeamMember[]>>(`${BASE}/members`)
    return data
  },

  /** Idempotency-keyed per invited email — dedupes a double-click/retry for
   *  the same invite without blocking legitimately inviting someone else. */
  async invite(payload: InvitePayload) {
    return withIdempotencyKey(`invite-member:${payload.email.toLowerCase()}`, async (headers) => {
      const data = await http.post<ApiResponse<{ message: string }>>(`${BASE}/invites`, payload, { headers })
      return data.data
    })
  },

  async updateRole(userId: string, role: OrgRole) {
    const data = await http.patch<ApiResponse<TeamMember>>(`${BASE}/members/${userId}/role`, { role })
    return data.data
  },

  async remove(userId: string) {
    await http.delete(`${BASE}/members/${userId}`)
  },
}
