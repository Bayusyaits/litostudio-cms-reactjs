import { ShoppingBag } from 'lucide-react'
import { SearchInput } from '@/components/molecules/SearchInput'
import { DataTable, type DataTableColumn as Column } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types/commerce.types'

const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
]

interface Filter {
  search: string
  status: OrderStatus | ''
  page: number
  limit: number
}

interface Props {
  orders: Order[]
  meta?: { total: number; page: number; limit: number; total_pages?: number }
  isLoading: boolean
  filter: Filter
  setFilter: (f: Partial<Filter>) => void
  onStatusChange: (id: string, status: OrderStatus) => void
}

function formatCurrency(amount: number, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function OrdersPageView({ orders, meta, isLoading, filter, setFilter, onStatusChange }: Props) {
  const columns: Column<Order>[] = [
    {
      key: 'customer_name',
      header: 'Customer',
      render: (order) => (
        <div>
          <p className="font-body text-sm font-medium text-[var(--text-muted)]">
            {order.customer_name ?? '—'}
          </p>
          {order.customer_email && (
            <p className="font-body text-xs text-[var(--text-muted)]">{order.customer_email}</p>
          )}
        </div>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total',
      width: '120px',
      render: (order) => (
        <span className="font-body text-sm font-semibold text-[var(--text-primary)]">
          {formatCurrency(order.total_amount, order.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '160px',
      render: (order) => (
        <select
          className="cms-input h-8 text-xs w-36"
          value={order.status}
          onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
          aria-label="Change order status"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      width: '110px',
      render: (order) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {formatRelative(order.created_at)}
        </span>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Orders</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} order${meta.total !== 1 ? 's' : ''}` : 'Manage customer orders'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search by name or email…"
          className="w-64"
        />
        <select
          className="cms-input h-9 text-sm w-44"
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value as OrderStatus | '', page: 1 })}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="cms-card overflow-hidden">
        <DataTable
          data={orders}
          columns={columns}
          keyField="id"
          loading={isLoading}
          emptyTitle="No orders yet"
          emptyDescription="Customer orders will appear here once placed"
          emptyIcon={<ShoppingBag />}
        />
      </div>
    </div>
  )
}
