import { Package, Trash2, Plus, Pencil, LayoutTemplate, Search, X } from 'lucide-react'
import { Button, StatusBadge, SearchInput, DataTable, type DataTableColumn as Column } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'
import type { Product, ProductType } from '@/types/content.types'

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  product: 'Product',
  service: 'Service',
  package: 'Package',
}

const PRODUCT_TYPE_COLORS: Record<ProductType, string> = {
  product: 'rgba(26,74,90,0.08)',
  service: 'rgba(212,168,83,0.12)',
  package: 'rgba(107,101,96,0.10)',
}

const PRODUCT_TYPE_TEXT: Record<ProductType, string> = {
  product: 'var(--lito-teal)',
  service: 'var(--lito-gold-deep)',
  package: 'var(--text-muted)',
}

function ProductTypeBadge({ type }: { type: ProductType }) {
  return (
    <span
      className="py-[3px] px-[9px] rounded-full text-[11px] font-medium font-body"
      style={{
        background: PRODUCT_TYPE_COLORS[type] ?? 'rgba(107,101,96,0.10)',
        color: PRODUCT_TYPE_TEXT[type] ?? 'var(--text-muted)',
      }}
    >
      {PRODUCT_TYPE_LABELS[type] ?? type}
    </span>
  )
}

function formatPrice(price: number | null): string {
  if (price === null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

/** Warning at <5, danger at <3 — same thresholds as the buyer-facing
 * "Only N left" message on the storefront, just applied per-product here
 * instead of per-variant. */
function StockCell({ product }: { product: Product }) {
  if (!product.stock_tracked || product.stock_total == null) {
    return <span className="font-body text-xs text-[var(--text-muted)]">—</span>
  }
  const stock = product.stock_total
  const color = stock < 3 ? 'var(--s-danger, #c0392b)' : stock < 5 ? '#b8860b' : 'var(--text-primary)'
  const weight = stock < 5 ? 600 : 400
  return (
    <span className="font-body text-sm" style={{ color, fontWeight: weight }}>
      {stock}
      {stock < 3 && <span className="ml-1 text-[10px] uppercase tracking-[0.05em]">Critical</span>}
      {stock >= 3 && stock < 5 && <span className="ml-1 text-[10px] uppercase tracking-[0.05em]">Low</span>}
    </span>
  )
}

interface Filter {
  search: string
  status: string
  product_type: ProductType | ''
  page: number
  limit: number
}

interface Props {
  products: Product[]
  meta?: { total: number; page: number; limit: number }
  isLoading: boolean
  filter: Filter
  setFilter: (f: Partial<Filter>) => void
  selectedIds: string[]
  onSelect: (id: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onNew: () => void
  onEdit: (id: string) => void
  onOpenEditor: (id: string) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
}

export function ProductsPageView({
  products, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onNew, onEdit, onOpenEditor, onDelete, onBulkDelete,
}: Props) {
  const filtered =
    filter.product_type
      ? products.filter((p) => p.product_type === filter.product_type)
      : products

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (product) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[var(--lito-cream-alt)] flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-[var(--text-muted)]" aria-hidden />
          </div>
          <div>
            <p className="font-body text-sm font-medium text-[var(--text-muted)] truncate max-w-[260px]">
              {product.name}
            </p>
            <p className="font-body text-xs text-[var(--text-muted)]">{product.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'product_type',
      header: 'Type',
      width: '110px',
      render: (product) => <ProductTypeBadge type={product.product_type} />,
    },
    {
      key: 'price',
      header: 'Price',
      width: '110px',
      render: (product) => (
        <span className="font-body text-sm text-[var(--text-primary)]">
          {formatPrice(product.price)}
        </span>
      ),
    },
    {
      key: 'stock_total',
      header: 'Stock',
      width: '90px',
      render: (product) => <StockCell product={product} />,
    },
    {
      key: 'sort_order',
      header: 'Order',
      width: '80px',
      render: (product) => (
        <span className="font-body text-xs text-[var(--text-muted)]">{product.sort_order}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (product) => <StatusBadge skin="cms" status={product.status} />,
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      width: '120px',
      render: (product) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {formatRelative(product.updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '96px',
      render: (product) => (
        <div className="flex items-center justify-end gap-1">
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onEdit(product.id)} aria-label="Edit" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onOpenEditor(product.id)} aria-label="Open editor" title="Open block editor">
            <LayoutTemplate className="w-3.5 h-3.5 text-[var(--lito-teal)]" />
          </Button>
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onDelete(product.id)} aria-label="Delete">
            <Trash2 className="w-3.5 h-3.5 text-[var(--s-danger)]" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Products</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} product${meta.total !== 1 ? 's' : ''}` : 'Manage products, services and packages'}
          </p>
        </div>
        <Button skin="cms" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>
          New Product
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          skin="cms"
          icon={<Search className="w-3.5 h-3.5" />}
          clearIcon={<X className="w-3.5 h-3.5" />}
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search products…"
          className="w-64"
        />
        <select
          className="cms-input h-9 text-sm w-44"
          value={filter.product_type}
          onChange={(e) => setFilter({ product_type: e.target.value as ProductType | '', page: 1 })}
        >
          <option value="">All types</option>
          <option value="product">Product</option>
          <option value="service">Service</option>
          <option value="package">Package</option>
        </select>
        <select
          className="cms-input h-9 text-sm w-40"
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value, page: 1 })}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="cms-card overflow-hidden">
        <DataTable
          data={filtered}
          columns={columns}
          keyField="id"
          loading={isLoading}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          emptyTitle="No products yet"
          emptyDescription="Create your first product, service or package"
          emptyIcon={<Package />}
          bulkActions={[
            {
              key: 'delete',
              label: 'Delete',
              icon: <Trash2 className="w-3.5 h-3.5" />,
              variant: 'danger',
              onClick: onBulkDelete,
            },
          ]}
        />
      </div>
    </div>
  )
}
