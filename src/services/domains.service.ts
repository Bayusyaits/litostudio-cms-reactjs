import { http } from '@/lib/request'
import type { ApiResponse } from '@/types/api.types'

export interface DomainRecord {
  id?: string
  organization_id?: string
  domain: string
  is_primary?: boolean
  is_verified?: boolean
  verified_at?: string
  ssl_status?: 'pending' | 'active' | 'expired' | 'error'
  ssl_issued_at?: string
  ssl_expires_at?: string
  dns_records?: Array<{
    type: string
    name: string
    value: string
    verified: boolean
  }>
  dns_verified_at?: string
  verification_token?: string
  redirect_to_www?: boolean
  created_at?: string
  updated_at?: string
}

export const domainsService = {
  async list(orgId: string) {
    return http.get<ApiResponse<DomainRecord[]>>(
      `/api/v1/cms/organizations/${orgId}/domains`,
    )
  },
  async add(orgId: string, payload: Pick<DomainRecord, 'domain' | 'is_primary' | 'redirect_to_www'>) {
    return http.post<ApiResponse<DomainRecord>>(
      `/api/v1/cms/organizations/${orgId}/domains`,
      payload,
    )
  },
  async update(orgId: string, id: string, payload: Partial<DomainRecord>) {
    return http.patch<ApiResponse<DomainRecord>>(
      `/api/v1/cms/organizations/${orgId}/domains/${id}`,
      payload,
    )
  },
  async verify(orgId: string, id: string) {
    return http.post<ApiResponse<DomainRecord>>(
      `/api/v1/cms/organizations/${orgId}/domains/${id}/verify`,
      {},
    )
  },
  async remove(orgId: string, id: string) {
    return http.delete<ApiResponse<{ message: string }>>(
      `/api/v1/cms/organizations/${orgId}/domains/${id}`,
    )
  },
}
