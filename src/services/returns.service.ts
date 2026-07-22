// apps/cms/src/services/returns.service.ts
// Return Management (TASK-SHOPEE.md) — client for
// apps/backend/src/modules/orders/order-returns.cms.routes.ts.
import { http } from '@litostudio/ui-cms'
import type { ApiResponse } from '@/types/api.types'

export type OrderReturnStatus =
  | 'requested' | 'rejected' | 'approved' | 'shipment_created' | 'shipped'
  | 'in_transit' | 'received' | 'inspecting' | 'refund_approved' | 'refunded'
  | 'completed' | 'cancelled'

export interface OrderReturnItem {
  id: string
  order_item_id: string
  quantity: number
}

export interface OrderReturn {
  id: string
  order_id: string
  reason: string
  customer_note: string | null
  status: OrderReturnStatus
  review_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  inspection_passed: boolean | null
  inspection_note: string | null
  refund_id: string | null
  biteship_order_id: string | null
  biteship_waybill_id: string | null
  biteship_tracking_status: string | null
  shipping_courier: string | null
  shipping_service: string | null
  created_at: string
  updated_at: string
  items: OrderReturnItem[]
  order: { id: string; site_id: string; customer_name: string | null; customer_email: string | null; total_amount: number; currency: string } | null
}

const BASE = '/api/v1/cms/content/orders/returns'

export const returnsService = {
  async getList(params: { status?: string; site_id?: string } = {}): Promise<{ data: OrderReturn[]; meta: { total: number } }> {
    const q = new URLSearchParams()
    if (params.status) q.set('status', params.status)
    if (params.site_id) q.set('site_id', params.site_id)
    const query = q.toString()
    return http.get(`${BASE}${query ? `?${query}` : ''}`)
  },

  async getById(id: string): Promise<OrderReturn> {
    const data = await http.get<ApiResponse<OrderReturn>>(`${BASE}/${id}`)
    return data.data
  },

  async review(id: string, decision: 'approved' | 'rejected', note?: string): Promise<OrderReturn> {
    const data = await http.post<ApiResponse<OrderReturn>>(`${BASE}/${id}/review`, { decision, note })
    return data.data
  },

  async createShipment(id: string, courierCompany: string, courierType: string): Promise<OrderReturn> {
    const data = await http.post<ApiResponse<OrderReturn>>(`${BASE}/${id}/create-shipment`, { courier_company: courierCompany, courier_type: courierType })
    return data.data
  },

  async markReceived(id: string): Promise<OrderReturn> {
    const data = await http.post<ApiResponse<OrderReturn>>(`${BASE}/${id}/received`, {})
    return data.data
  },

  async startInspection(id: string): Promise<OrderReturn> {
    const data = await http.post<ApiResponse<OrderReturn>>(`${BASE}/${id}/start-inspection`, {})
    return data.data
  },

  async inspect(id: string, passed: boolean, note?: string): Promise<OrderReturn> {
    const data = await http.post<ApiResponse<OrderReturn>>(`${BASE}/${id}/inspect`, { passed, note })
    return data.data
  },

  async refund(id: string, amount?: number, reason?: string): Promise<OrderReturn> {
    const data = await http.post<ApiResponse<OrderReturn>>(`${BASE}/${id}/refund`, { amount, reason })
    return data.data
  },

  async complete(id: string): Promise<OrderReturn> {
    const data = await http.post<ApiResponse<OrderReturn>>(`${BASE}/${id}/complete`, {})
    return data.data
  },
}
