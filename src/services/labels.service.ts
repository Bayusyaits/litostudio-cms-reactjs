// services/labels.service.ts
// CMS service for settings_labels CRUD + bulk import.
import { http } from '@/lib/request'
import type { ApiResponse } from '@/types/api.types'

export interface Label {
  id: string
  organization_id: string
  locale: string
  key: string
  group_name: string
  value: string
  description: string | null
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface LabelUpsertPayload {
  organization_id: string
  locale?: string
  key: string
  group_name?: string
  value: string
  description?: string | null
}

export interface LabelUpdatePayload {
  value?: string
  group_name?: string
  description?: string | null
}

export interface BulkImportPayload {
  organization_id: string
  locale?: string
  labels: Array<{
    key: string
    value: string
    group_name?: string
    description?: string
  }>
}

const BASE = '/api/v1/cms/settings/labels'

export const labelsService = {
  async list(params: {
    organization_id: string
    locale?: string
    group_name?: string
    search?: string
  }): Promise<ApiResponse<Label[]>> {
    return http.get<ApiResponse<Label[]>>(BASE, { params })
  },

  async groups(organization_id: string): Promise<ApiResponse<string[]>> {
    return http.get<ApiResponse<string[]>>(`${BASE}/groups`, { params: { organization_id } })
  },

  async upsert(payload: LabelUpsertPayload): Promise<ApiResponse<Label>> {
    return http.post<ApiResponse<Label>>(BASE, payload)
  },

  async update(id: string, payload: LabelUpdatePayload): Promise<ApiResponse<Label>> {
    return http.patch<ApiResponse<Label>>(`${BASE}/${id}`, payload)
  },

  async remove(id: string): Promise<void> {
    await http.delete(`${BASE}/${id}`)
  },

  async bulkImport(payload: BulkImportPayload): Promise<ApiResponse<{ id: string; key: string }[]>> {
    return http.post<ApiResponse<{ id: string; key: string }[]>>(`${BASE}/bulk`, payload)
  },
}
