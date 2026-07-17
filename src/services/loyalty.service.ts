// services/loyalty.service.ts
// CMS service for the tenant-facing loyalty module — accounts, manual
// adjustments, earn-rule settings, and tiers. Backend routes live at
// apps/backend/src/modules/loyalty/loyalty-admin.routes.ts, mounted at
// /api/v1/cms/loyalty/*. Org scoping happens server-side via req.user.org_id
// — this service never sends an org id from the client.
import { http } from '@litostudio/ui-cms'

export interface LoyaltyAccount {
  id: string
  email: string
  points_balance: number
  tier: string | null
  created_at: string
  updated_at: string
}

export type LoyaltyTransactionType = 'earn' | 'redeem' | 'expire' | 'manual_adjustment'

export interface LoyaltyTransaction {
  id: string
  order_id: string | null
  type: LoyaltyTransactionType
  points: number
  note: string | null
  created_by: string | null
  created_at: string
}

export interface LoyaltyAccountDetail extends LoyaltyAccount {
  org_id: string
  history: LoyaltyTransaction[]
}

export interface LoyaltyAccountsListMeta {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface LoyaltyAccountsListResponse {
  success: boolean
  data: LoyaltyAccount[]
  meta: LoyaltyAccountsListMeta
}

export interface LoyaltyAdjustPayload {
  points: number
  reason: string
}

export interface LoyaltyAdjustResult {
  account_id: string
  new_balance: number
  transaction: LoyaltyTransaction
}

export interface LoyaltyEarnRules {
  id: string
  org_id: string | null
  earn_rate_points: number
  earn_rate_currency: number
  min_order_amount_to_earn: number
  redemption_value_per_point: number
  max_balance: number
}

export interface LoyaltyTier {
  id: string
  org_id: string | null
  name: string
  min_points_threshold: number
  perk_description: string | null
  sort_order: number
}

export interface LoyaltySettings {
  rules: LoyaltyEarnRules
  tiers: LoyaltyTier[]
  is_override: boolean
}

export interface LoyaltySettingsUpdatePayload {
  earn_rate_points?: number
  earn_rate_currency?: number
  min_order_amount_to_earn?: number
  redemption_value_per_point?: number
  max_balance?: number
}

export interface LoyaltyTierCreatePayload {
  name: string
  min_points_threshold: number
  perk_description?: string
  sort_order?: number
}

export interface LoyaltyTierUpdatePayload {
  name?: string
  min_points_threshold?: number
  perk_description?: string | null
  sort_order?: number
}

// Backend envelope is { success, message, traceID, code, data } (see
// apps/backend/src/shared/response.ts's sendOk) — only the fields the UI
// actually reads are declared here, same convention as labels.service.ts's
// ApiResponse<T> usage elsewhere in this app.
interface Envelope<T> {
  success: boolean
  message: string
  data: T
}

const BASE = '/api/v1/cms/loyalty'

export const loyaltyService = {
  async listAccounts(params: {
    search?: string
    page?: number
    per_page?: number
  }): Promise<LoyaltyAccountsListResponse> {
    return http.get<LoyaltyAccountsListResponse>(`${BASE}/accounts`, { params })
  },

  async getAccount(id: string): Promise<Envelope<LoyaltyAccountDetail>> {
    return http.get<Envelope<LoyaltyAccountDetail>>(`${BASE}/accounts/${id}`)
  },

  async adjustAccount(id: string, payload: LoyaltyAdjustPayload): Promise<Envelope<LoyaltyAdjustResult>> {
    return http.post<Envelope<LoyaltyAdjustResult>>(`${BASE}/accounts/${id}/adjust`, payload)
  },

  async getSettings(): Promise<Envelope<LoyaltySettings>> {
    return http.get<Envelope<LoyaltySettings>>(`${BASE}/settings`)
  },

  // Returns only the updated earn-rules row (not the full settings envelope)
  // — matches loyalty-admin.routes.ts's PATCH /settings handler, which calls
  // sendOk(reply, req, data, ...) with `data` being the loyalty_earn_rules row.
  async updateSettings(payload: LoyaltySettingsUpdatePayload): Promise<Envelope<LoyaltyEarnRules>> {
    return http.patch<Envelope<LoyaltyEarnRules>>(`${BASE}/settings`, payload)
  },

  async listTiers(): Promise<Envelope<LoyaltyTier[]>> {
    return http.get<Envelope<LoyaltyTier[]>>(`${BASE}/tiers`)
  },

  async createTier(payload: LoyaltyTierCreatePayload): Promise<Envelope<LoyaltyTier>> {
    return http.post<Envelope<LoyaltyTier>>(`${BASE}/tiers`, payload)
  },

  async updateTier(id: string, payload: LoyaltyTierUpdatePayload): Promise<Envelope<LoyaltyTier>> {
    return http.patch<Envelope<LoyaltyTier>>(`${BASE}/tiers/${id}`, payload)
  },

  async removeTier(id: string): Promise<void> {
    await http.delete(`${BASE}/tiers/${id}`)
  },
}
