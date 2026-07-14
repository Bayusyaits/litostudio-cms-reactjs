// apps/cms/src/services/shipping-origins.service.ts
// CMS client for /api/v1/cms/sites/:siteId/shipping-origins (Task #27) —
// site_shipping_origins CRUD, matching the shape returned by
// apps/backend/src/modules/shipping/origins/origins.routes.ts (wilayah
// names embedded via province/regency/district/village relations, not just
// their ids, so the list view doesn't need a second round-trip per row).

import { http } from '@litostudio/ui-cms'
import type { ApiResponse } from '@/types/api.types'

export interface ShippingOrigin {
  id: string
  label: string
  address_line: string
  postal_code: string
  contact_name: string | null
  contact_phone: string | null
  latitude: number | null
  longitude: number | null
  biteship_location_id: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  province: { id: number; name: string } | null
  regency:  { id: number; name: string } | null
  district: { id: number; name: string } | null
  village:  { id: number; name: string } | null
}

export interface ShippingOriginPayload {
  label: string
  address_line: string
  province_id: number
  regency_id: number
  district_id: number
  village_id?: number | null
  postal_code: string
  contact_name?: string
  contact_phone?: string
  latitude?: number | null
  longitude?: number | null
  is_default?: boolean
}

export const shippingOriginsService = {
  async getList(siteId: string) {
    const data = await http.get<ApiResponse<ShippingOrigin[]>>(`/api/v1/cms/sites/${siteId}/shipping-origins`)
    return data.data
  },
  async create(siteId: string, payload: ShippingOriginPayload) {
    const data = await http.post<ApiResponse<ShippingOrigin> & { message: string }>(`/api/v1/cms/sites/${siteId}/shipping-origins`, payload)
    return data
  },
  async update(siteId: string, id: string, payload: Partial<ShippingOriginPayload>) {
    const data = await http.patch<ApiResponse<ShippingOrigin>>(`/api/v1/cms/sites/${siteId}/shipping-origins/${id}`, payload)
    return data.data
  },
  async remove(siteId: string, id: string) {
    await http.delete(`/api/v1/cms/sites/${siteId}/shipping-origins/${id}`)
  },
}
