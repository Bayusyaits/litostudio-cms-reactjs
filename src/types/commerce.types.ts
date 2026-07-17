// apps/cms/src/types/commerce.types.ts
// Order, newsletter subscriber types for CMS modules

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  name: string
  sku: string | null
  quantity: number
  unit_price: number
  total_price: number
  metadata: Record<string, unknown>
  created_at: string
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: OrderStatus
  note: string | null
  created_by: string | null
  created_at: string
}

export interface Order {
  id: string
  org_id: string
  site_id: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  status: OrderStatus
  // Verified against apps/backend/src/modules/payments/doku/doku.routes.ts
  // (webhook handlers) and apps/backend/src/modules/shipping/biteship/
  // biteship.routes.ts — these are real top-level `orders` columns, not
  // metadata JSON. fetchOrderDetail()'s `select('*, ...')` in
  // orders.routes.ts returns them on GET /:id (list endpoints select a
  // narrower column set and may omit them).
  payment_status?: string
  payment_method?: string | null
  gateway_transaction_id?: string | null
  biteship_order_id?: string | null
  biteship_waybill_id?: string | null
  biteship_tracking_status?: string | null
  currency: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  notes: string | null
  metadata: Record<string, unknown>
  items?: OrderItem[]
  status_history?: OrderStatusHistory[]
  created_at: string
  updated_at: string
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus
  note?: string
}

// ── Newsletter ────────────────────────────────────────────────────────────────

export type NewsletterStatus = 'pending' | 'subscribed' | 'unsubscribed' | 'bounced'

export interface NewsletterSubscriber {
  id: string
  org_id: string
  site_id: string
  email: string
  full_name: string | null
  status: NewsletterStatus
  source: string | null
  subscribed_at: string | null
  unsubscribed_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface UpdateNewsletterStatusRequest {
  status: NewsletterStatus
}

// ── Messages (contact_submissions alias) ─────────────────────────────────────

export interface ContactMessage {
  id: string
  site_id: string
  name: string
  email: string
  phone: string | null
  service_interest: string | null
  event_date: string | null
  subject: string | null
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  ip_address: string | null
  user_agent: string | null
  referrer: string | null
  created_at: string
  updated_at: string
}
