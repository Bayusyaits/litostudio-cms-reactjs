// apps/cms/src/modules/returns/ReturnsPage.tsx
// Return Management (TASK-SHOPEE.md) — Shopee-style flow: Customer Request
// -> Seller Review -> Approve/Reject -> Create Return Shipment -> Customer
// Ships -> Track Shipment -> Seller Receives -> Inspection -> Refund ->
// Completed. One page: list + a detail/action modal, since each status only
// ever exposes one or two next actions (no need for a separate route).
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DataTable, Select, Modal, type DataTableColumn as Column } from '@litostudio/ui-cms'
import { returnsService, type OrderReturn, type OrderReturnStatus } from '@/services/returns.service'

const STATUSES: OrderReturnStatus[] = [
  'requested', 'approved', 'rejected', 'shipment_created', 'shipped', 'in_transit',
  'received', 'inspecting', 'refund_approved', 'refunded', 'completed', 'cancelled',
]

function statusLabel(s: string): string {
  return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatCurrency(amount: number, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export default function ReturnsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<OrderReturnStatus | ''>('')
  const [selected, setSelected] = useState<OrderReturn | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['returns', statusFilter],
    queryFn: () => returnsService.getList({ status: statusFilter || undefined }),
  })
  const returns = data?.data ?? []

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['returns'] })

  const reviewMutation = useMutation({
    mutationFn: (vars: { decision: 'approved' | 'rejected' }) => returnsService.review(selected!.id, vars.decision),
    onSuccess: (r) => { setSelected(r); invalidate() },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Failed'),
  })
  const shipmentMutation = useMutation({
    mutationFn: (vars: { courier: string; service: string }) => returnsService.createShipment(selected!.id, vars.courier, vars.service),
    onSuccess: (r) => { setSelected(r); invalidate() },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Failed'),
  })
  const receivedMutation = useMutation({
    mutationFn: () => returnsService.markReceived(selected!.id),
    onSuccess: (r) => { setSelected(r); invalidate() },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Failed'),
  })
  const startInspectionMutation = useMutation({
    mutationFn: () => returnsService.startInspection(selected!.id),
    onSuccess: (r) => { setSelected(r); invalidate() },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Failed'),
  })
  const inspectMutation = useMutation({
    mutationFn: (vars: { passed: boolean }) => returnsService.inspect(selected!.id, vars.passed),
    onSuccess: (r) => { setSelected(r); invalidate() },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Failed'),
  })
  const refundMutation = useMutation({
    mutationFn: () => returnsService.refund(selected!.id),
    onSuccess: (r) => { setSelected(r); invalidate() },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Failed'),
  })
  const completeMutation = useMutation({
    mutationFn: () => returnsService.complete(selected!.id),
    onSuccess: (r) => { setSelected(r); invalidate() },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Failed'),
  })

  const [courier, setCourier] = useState('jne')
  const [courierService, setCourierService] = useState('reg')

  const columns: Column<OrderReturn>[] = [
    {
      key: 'order', header: 'Customer',
      render: (r) => (
        <div>
          <p className="font-body text-sm font-medium text-[var(--text-primary)]">{r.order?.customer_name ?? '—'}</p>
          <p className="font-body text-xs text-[var(--text-muted)]">{r.order?.customer_email}</p>
        </div>
      ),
    },
    { key: 'reason', header: 'Reason', render: (r) => <span className="font-body text-sm">{r.reason}</span> },
    {
      key: 'status', header: 'Status', width: '160px',
      render: (r) => <span className="cms-btn cms-btn-ghost cms-btn-sm cursor-default">{statusLabel(r.status)}</span>,
    },
    {
      key: 'total', header: 'Order Total', width: '120px',
      render: (r) => <span className="font-body text-sm">{r.order ? formatCurrency(r.order.total_amount, r.order.currency) : '—'}</span>,
    },
    {
      key: 'created_at', header: 'Requested', width: '110px',
      render: (r) => <span className="font-body text-xs text-[var(--text-muted)]">{new Date(r.created_at).toLocaleDateString()}</span>,
    },
    {
      key: 'actions', header: '', width: '100px',
      render: (r) => (
        <button type="button" className="cms-btn cms-btn-ghost cms-btn-sm" onClick={() => { setActionError(null); setSelected(r) }}>
          Review
        </button>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Returns</h1>
        <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
          {data ? `${data.meta.total} return${data.meta.total !== 1 ? 's' : ''}` : 'Manage return requests'}
        </p>
      </div>

      <Select
        className="w-52"
        value={statusFilter}
        onChange={(v) => setStatusFilter(v as OrderReturnStatus | '')}
        options={[{ value: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))]}
      />

      <div className="cms-card overflow-hidden">
        <DataTable
          data={returns}
          columns={columns}
          keyField="id"
          loading={isLoading}
          emptyTitle="No return requests yet"
          emptyDescription="Customer return requests will appear here"
        />
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Return — ${statusLabel(selected.status)}` : ''} closeIcon={<span aria-hidden>×</span>}>
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="font-body text-sm"><strong>Reason:</strong> {selected.reason}</p>
              {selected.customer_note && <p className="font-body text-xs text-[var(--text-muted)] mt-1">Note: {selected.customer_note}</p>}
              <p className="font-body text-xs text-[var(--text-muted)] mt-1">{selected.items.length} item(s) &middot; Order total {selected.order ? formatCurrency(selected.order.total_amount, selected.order.currency) : '—'}</p>
            </div>

            {selected.biteship_waybill_id && (
              <div className="cms-card p-3">
                <p className="font-body text-xs text-[var(--text-muted)]">Return shipment: {selected.shipping_courier} &middot; Waybill {selected.biteship_waybill_id} &middot; {selected.biteship_tracking_status ?? 'pending'}</p>
              </div>
            )}

            {actionError && <p className="font-body text-xs text-[var(--s-danger)]">{actionError}</p>}

            {selected.status === 'requested' && (
              <div className="flex gap-2">
                <button type="button" className="cms-btn cms-btn-primary cms-btn-sm" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ decision: 'approved' })}>Approve</button>
                <button type="button" className="cms-btn cms-btn-danger cms-btn-sm" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ decision: 'rejected' })}>Reject</button>
              </div>
            )}

            {selected.status === 'approved' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="text" className="cms-input w-28" value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="courier e.g. jne" />
                  <input type="text" className="cms-input w-28" value={courierService} onChange={(e) => setCourierService(e.target.value)} placeholder="service e.g. reg" />
                </div>
                <button type="button" className="cms-btn cms-btn-primary cms-btn-sm" disabled={shipmentMutation.isPending} onClick={() => shipmentMutation.mutate({ courier, service: courierService })}>
                  Create Return Shipment
                </button>
              </div>
            )}

            {['shipment_created', 'shipped', 'in_transit'].includes(selected.status) && (
              <button type="button" className="cms-btn cms-btn-primary cms-btn-sm" disabled={receivedMutation.isPending} onClick={() => receivedMutation.mutate()}>
                Mark as Received
              </button>
            )}

            {selected.status === 'received' && (
              <button type="button" className="cms-btn cms-btn-primary cms-btn-sm" disabled={startInspectionMutation.isPending} onClick={() => startInspectionMutation.mutate()}>
                Start Inspection
              </button>
            )}

            {selected.status === 'inspecting' && (
              <div className="flex gap-2">
                <button type="button" className="cms-btn cms-btn-primary cms-btn-sm" disabled={inspectMutation.isPending} onClick={() => inspectMutation.mutate({ passed: true })}>Passed</button>
                <button type="button" className="cms-btn cms-btn-danger cms-btn-sm" disabled={inspectMutation.isPending} onClick={() => inspectMutation.mutate({ passed: false })}>Failed</button>
              </div>
            )}

            {selected.status === 'refund_approved' && (
              <button type="button" className="cms-btn cms-btn-primary cms-btn-sm" disabled={refundMutation.isPending} onClick={() => refundMutation.mutate()}>
                Process Refund
              </button>
            )}

            {selected.status === 'refunded' && (
              <button type="button" className="cms-btn cms-btn-primary cms-btn-sm" disabled={completeMutation.isPending} onClick={() => completeMutation.mutate()}>
                Mark Completed
              </button>
            )}

            {['completed', 'rejected', 'cancelled'].includes(selected.status) && (
              <p className="font-body text-xs text-[var(--text-muted)]">This return is closed.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
