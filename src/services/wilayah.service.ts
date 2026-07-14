// apps/cms/src/services/wilayah.service.ts
// Cascading province -> regency -> district -> village lookups for address
// forms (Task #27's shipping-origins form is the first consumer). Hits the
// CMS-authenticated mount of apps/backend/src/modules/wilayah/wilayah.routes.ts
// (there's also a /api/v1/public/wilayah/* mount for the storefront, for the
// checkout address form built in a later task).

import { http } from '@litostudio/ui-cms'
import type { ApiResponse } from '@/types/api.types'

export interface WilayahOption {
  id: number
  name: string
  code: string | number
}

export const wilayahService = {
  async getProvinces() {
    const data = await http.get<ApiResponse<WilayahOption[]>>('/api/v1/cms/wilayah/provinces')
    return data.data
  },
  async getRegencies(provinceId: number) {
    const data = await http.get<ApiResponse<WilayahOption[]>>(`/api/v1/cms/wilayah/regencies?province_id=${provinceId}`)
    return data.data
  },
  async getDistricts(regencyId: number) {
    const data = await http.get<ApiResponse<WilayahOption[]>>(`/api/v1/cms/wilayah/districts?regency_id=${regencyId}`)
    return data.data
  },
  async getVillages(districtId: number) {
    const data = await http.get<ApiResponse<WilayahOption[]>>(`/api/v1/cms/wilayah/villages?district_id=${districtId}`)
    return data.data
  },
}
