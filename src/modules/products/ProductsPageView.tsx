import { useState } from 'react'
import { Package, Trash2, Plus, Pencil, LayoutTemplate, Search, X, Upload } from 'lucide-react'
import { Button, StatusBadge, SearchInput, DataTable, Select, type DataTableColumn as Column } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'
import type { Product, ProductType } from '@/types/content.types'
import { ProductsReportsPanel } from './ProductsReportsPanel'

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

// 2026-07-25 bug fix (QA audit, Medium-High #9): hardcoded to USD regardless
// of the product's actual currency — the rest of the platform (storefront,
// pricing forms) treats IDR as the default and products carry their own
// `currency` field. A normally-IDR-priced product previously rendered as
// e.g. "$150,000.00" in this list.
function formatPrice(price: number | null, currency?: string | null): string {
  if (price === null) return '—'
  const cur = currency || 'IDR'
  return new Intl.NumberFormat(cur === 'IDR' ? 'id-ID' : 'en-US', { style: 'currency', currency: cur }).format(price)
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
  onImport: () => void
  onEdit: (id: string) => void
  onOpenEditor: (id: string) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
}

export function ProductsPageView({
  products, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onNew, onImport, onEdit, onOpenEditor, onDelete, onBulkDelete,
}: Props) {
  const [tab, setTab] = useState<'products' | 'reports'>('products')

  // 2026-07-25 bug fix (QA audit, High #6): this used to filter only the
  // already-fetched page client-side, silently losing rows outside the
  // current page while `meta.total` kept reporting the unfiltered count.
  // `product_type` is now sent to the backend (ProductsPageContainer) and
  // filtered/paginated there, so the list here is already correct — no
  // client-side re-filtering needed or wanted.

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
          {formatPrice(product.price, product.currency)}
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
        <div className="flex items-center gap-2">
          <Button skin="cms" variant="secondary" leftIcon={<Upload className="w-4 h-4" />} onClick={onImport}>
            Import
          </Button>
          <Button skin="cms" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>
            New Product
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[var(--lito-border)]">
        <button type="button" className={`cms-tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>
          Products
        </button>
        <button type="button" className={`cms-tab ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>
          Reports
        </button>
      </div>

      {tab === 'products' && (
        <>
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
            <Select
              className="w-44"
              value={filter.product_type}
              onChange={(v) => setFilter({ product_type: v as ProductType | '', page: 1 })}
              options={[
                { value: '', label: 'All types' },
                { value: 'product', label: 'Product' },
                { value: 'service', label: 'Service' },
                { value: 'package', label: 'Package' },
              ]}
            />
            <Select
              className="w-40"
              value={filter.status}
              onChange={(v) => setFilter({ status: v, page: 1 })}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          </div>

          <div className="cms-card overflow-hidden">
            <DataTable
              data={products}
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
        </>
      )}

      {tab === 'reports' && <ProductsReportsPanel />}
    </div>
  )
}
