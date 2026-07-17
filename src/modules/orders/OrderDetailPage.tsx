// apps/cms/src/modules/orders/OrderDetailPage.tsx
//
// Tenant CMS order detail — items, payment/courier, status history, and
// status-change action. Previously there was NO detail page at all for
// tenant orders (status was only editable inline in the list table) — this
// was a real gap found during the grill-me review of
// dev-spec-promo-cms-ordermgmt-campaignfix-2026-07-15.md, Workstream B
// (Open Question 1), not something the original spec anticipated.
//
// Data comes from ordersService.getById() → GET /api/v1/cms/content/orders/:id,
// which now uses the shared fetchOrderDetail() helper (apps/backend/src/
// modules/orders/orders.routes.ts) — the same helper the superadmin order
// detail route uses, scoped here to the tenant's own site_id via the
// backend's siteIds check. Status-history notes prefixed "Superadmin
// override" (see admin-orders.routes.ts) surface here unmodified, so a
// tenant can see when the platform stepped in.
//
// Route: /orders/:id — see apps/cms/src/app/router.tsx.
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Select } from '@litostudio/ui-cms'
import { ArrowLeft, Loader2, Package, CreditCard, Truck, Clock } from 'lucide-react'
import { ordersService } from '@/services/content.service'
import type { OrderStatus } from '@/types/commerce.types'

const ORDER_STATUSES: OrderStatus[] = [
  'draft', 'pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded',
]

function formatCurrency(amount: number, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}
function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [pendingStatus, setPendingStatus] = useState('')

  const orderQuery = useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => ordersService.getById(id),
    enabled: !!id,
  })
  const order = orderQuery.data

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersService.updateStatus(id, { status }),
    onSuccess: () => {
      setPendingStatus('')
      void qc.invalidateQueries({ queryKey: ['orders', 'detail', id] })
      void qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  if (orderQuery.isLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-[var(--text-muted)]">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    )
  }
  if (orderQuery.error || !order) {
    return (
      <div className="p-8">
        <Link to="/orders" className="inline-flex items-center gap-1.5 font-body text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
        </Link>
        <div className="cms-card p-5 text-sm text-[var(--s-danger)]" role="alert">
          {orderQuery.error instanceof Error ? orderQuery.error.message : 'Order not found'}
        </div>
      </div>
    )
  }

  const items = order.items ?? []
  const history = order.status_history ?? []
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const paymentMethod = order.payment_method ?? null
  const gatewayTxnId = order.gateway_transaction_id ?? null
  const waybillId = order.biteship_waybill_id ?? null
  const trackingStatus = order.biteship_tracking_status ?? null

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div>
        <Link to="/orders" className="inline-flex items-center gap-1.5 font-body text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              {order.customer_name ?? 'Order'}
            </h1>
            <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
              {order.customer_email ?? order.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="cms-input h-8 inline-flex items-center px-3 text-xs font-medium capitalize">
              {order.status}
            </span>
            <Select
              className="w-40"
              value={pendingStatus}
              onChange={setPendingStatus}
              options={[
                { value: '', label: 'Change status…' },
                ...ORDER_STATUSES.filter((s) => s !== order.status).map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
              ]}
            />
            <button
              type="button"
              className="cms-btn cms-btn-primary h-9 text-sm px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!pendingStatus || statusMutation.isPending}
              onClick={() => pendingStatus && statusMutation.mutate(pendingStatus as OrderStatus)}
            >
              {statusMutation.isPending ? 'Updating…' : 'Update status'}
            </button>
          </div>
        </div>
      </div>

      {statusMutation.isError && (
        <div className="cms-card p-4 text-sm text-[var(--s-danger)]" role="alert">
          {statusMutation.error instanceof Error ? statusMutation.error.message : 'Failed to update status'}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="cms-card p-4">
          <p className="text-[11px] text-[var(--text-muted)] mb-1">Total</p>
          <p className="font-body text-sm font-semibold">{formatCurrency(order.total_amount, order.currency)}</p>
        </div>
        <div className="cms-card p-4">
          <p className="text-[11px] text-[var(--text-muted)] mb-1">Discount</p>
          <p className="font-body text-sm font-semibold">{order.discount_amount > 0 ? formatCurrency(order.discount_amount, order.currency) : '—'}</p>
        </div>
        <div className="cms-card p-4">
          <p className="text-[11px] text-[var(--text-muted)] mb-1">Payment</p>
          <p className="font-body text-sm font-semibold capitalize">{order.payment_status ?? 'unpaid'}</p>
        </div>
        <div className="cms-card p-4">
          <p className="text-[11px] text-[var(--text-muted)] mb-1">Items</p>
          <p className="font-body text-sm font-semibold">{itemCount}</p>
        </div>
        <div className="cms-card p-4">
          <p className="text-[11px] text-[var(--text-muted)] mb-1">Placed</p>
          <p className="font-body text-sm font-semibold">{fmtDateTime(order.created_at)}</p>
        </div>
      </div>

      <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
        <div className="cms-card p-5">
          <h3 className="font-body text-sm font-semibold mb-3.5 flex items-center gap-2">
            <Package className="w-4 h-4 text-[var(--text-muted)]" /> Items
          </h3>
          {items.length === 0 ? (
            <p className="text-[12px] text-[var(--text-muted)]">No line items recorded.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.name} <span className="text-[var(--text-muted)]">× {item.quantity}</span></span>
                  <span className="font-medium">{formatCurrency(item.total_price, order.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cms-card p-5">
          <h3 className="font-body text-sm font-semibold mb-3.5 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[var(--text-muted)]" /> Payment &amp; Courier
          </h3>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Gateway transaction</span>
              <span>{gatewayTxnId ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Payment method</span>
              <span>{paymentMethod ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Courier waybill</span>
              <span>{waybillId ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Courier status</span>
              <span>{trackingStatus ?? '—'}</span>
            </div>
          </div>
          {!waybillId && (
            <p className="text-[11px] text-[var(--text-muted)] mt-3 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> No shipment booked yet — courier tracking populates once the order is packed.
            </p>
          )}
        </div>
      </div>

      <div className="cms-card p-5">
        <h3 className="font-body text-sm font-semibold mb-3.5 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--text-muted)]" /> Status history
        </h3>
        {history.length === 0 ? (
          <p className="text-[12px] text-[var(--text-muted)]">No history yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] shrink-0" aria-hidden />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-medium">{entry.status}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">{fmtDateTime(entry.created_at)}</span>
                  </div>
                  {entry.note && <p className="text-[12px] text-[var(--text-muted)] mt-1">{entry.note}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {order.notes && (
        <div className="cms-card p-5">
          <h3 className="font-body text-sm font-semibold mb-2">Customer notes</h3>
          <p className="text-[12px] text-[var(--text-muted)]">{order.notes}</p>
        </div>
      )}
    </div>
  )
}
