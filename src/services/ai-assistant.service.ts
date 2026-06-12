import { http } from '@/lib/request'
import type { ApiResponse } from '@/types/api.types'

export interface AiAssistantSettings {
  id?: string
  organization_id?: string
  is_enabled?: boolean
  model?: string
  system_prompt?: string
  temperature?: number
  max_tokens?: number
  widget_enabled?: boolean
  widget_position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  widget_theme?: 'light' | 'dark' | 'auto'
  welcome_message?: string
  rate_limit_per_hour?: number
  updated_at?: string
}

export interface KnowledgeEntry {
  id?: string
  organization_id?: string
  site_id?: string | null
  content_type: 'products' | 'collections' | 'services' | 'blogs' | 'stories' | 'faq' | 'custom' | 'policies' | 'about'
  title: string
  content: string
  metadata?: Record<string, unknown>
  source_table?: string
  source_id?: string
  is_active?: boolean
  priority?: number
  created_at?: string
  updated_at?: string
}

export const aiAssistantService = {
  async getSettings(orgId: string) {
    return http.get<ApiResponse<AiAssistantSettings | null>>(
      `/api/v1/cms/organizations/${orgId}/ai-assistant`,
    )
  },
  async updateSettings(orgId: string, payload: Partial<AiAssistantSettings>) {
    return http.put<ApiResponse<AiAssistantSettings>>(
      `/api/v1/cms/organizations/${orgId}/ai-assistant`,
      payload,
    )
  },
  async listKnowledge(orgId: string, params?: { content_type?: string; site_id?: string; limit?: number; offset?: number }) {
    const qs = new URLSearchParams()
    if (params?.content_type) qs.set('content_type', params.content_type)
    if (params?.site_id) qs.set('site_id', params.site_id)
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    return http.get<ApiResponse<KnowledgeEntry[]>>(
      `/api/v1/cms/organizations/${orgId}/ai-assistant/knowledge?${qs.toString()}`,
    )
  },
  async createKnowledge(orgId: string, payload: Omit<KnowledgeEntry, 'id'>) {
    return http.post<ApiResponse<KnowledgeEntry>>(
      `/api/v1/cms/organizations/${orgId}/ai-assistant/knowledge`,
      payload,
    )
  },
  async updateKnowledge(orgId: string, id: string, payload: Partial<KnowledgeEntry>) {
    return http.patch<ApiResponse<KnowledgeEntry>>(
      `/api/v1/cms/organizations/${orgId}/ai-assistant/knowledge/${id}`,
      payload,
    )
  },
  async deleteKnowledge(orgId: string, id: string) {
    return http.delete<ApiResponse<{ message: string }>>(
      `/api/v1/cms/organizations/${orgId}/ai-assistant/knowledge/${id}`,
    )
  },

  async generate(orgId: string, payload: GenerateRequest) {
    return http.post<ApiResponse<GenerateResult>>(
      `/api/v1/cms/organizations/${orgId}/ai-assistant/generate`,
      payload,
    )
  },
}

export interface GenerateRequest {
  content_type: string
  topic?: string
  description?: string
  tone?: 'professional' | 'friendly' | 'casual' | 'luxury' | 'modern'
  locale?: string
  use_knowledge_base?: boolean
}

export interface GenerateResult {
  blocks: unknown[]
}
