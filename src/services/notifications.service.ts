// apps/cms/src/services/notifications.service.ts
import { http } from '@/lib/request'

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  data: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

export interface NotificationsResponse {
  success: boolean
  data: Notification[]
  meta: { total: number; unread: number; limit: number; offset: number }
}

const BASE = '/api/v1/auth/notifications'

export const notificationsService = {
  async list(params?: { limit?: number; offset?: number; unread?: boolean }) {
    const q = new URLSearchParams()
    if (params?.limit)  q.set('limit',  String(params.limit))
    if (params?.offset) q.set('offset', String(params.offset))
    if (params?.unread) q.set('unread', 'true')
    const url = q.toString() ? `${BASE}?${q}` : BASE
    return http.get<NotificationsResponse>(url)
  },

  async markRead(id: string) {
    return http.patch<{ success: boolean }>(`${BASE}/${id}/read`, {})
  },

  async markAllRead() {
    return http.post<{ success: boolean }>(`${BASE}/read-all`, {})
  },

  async remove(id: string) {
    return http.delete<{ success: boolean }>(`${BASE}/${id}`)
  },
}
