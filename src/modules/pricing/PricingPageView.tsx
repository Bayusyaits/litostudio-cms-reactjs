import { Tag, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { StatusBadge } from '@/components/atoms/StatusBadge'
import { SearchInput } from '@/components/molecules/SearchInput'
import { DataTable } from '@/components/molecules/DataTable'
import { formatRelative } from '@/lib/utils'
import type { Column } from '@/components/molecules/DataTable/types'
import type { PricingPackage } from '@/types/content.types'
import type { ContentStatus } from '@/types/api.types'

function getPkgTitle(p: PricingPackage): string {
  return p.translations?.[0]?.title ?? p.slug ?? '—'
}

function formatPrice(price: number | null, priceMax: number | null, currency: string | null): string {
  if (price == null) return '—'
  const cur = currency ?? 'IDR'
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n)
  return priceMax != null ? `${fmt(price)} – ${fmt(priceMax)}` : fmt(price)
}

interface Filter {
  search: string
  status: ContentStatus | ''
  page: number
  limit: number
}

interface Props {
  packages: PricingPackage[]
  meta?: { total: number; page: number; limit: number }
  isLoading: boolean
  filter: Filter
  setFilter: (f: Partial<Filter>) => void
  selectedIds: string[]
  onSelect: (id: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
}

export function PricingPageView({
  packages, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onDelete, onBulkDelete,
}: Props) {
  const columns: Column<PricingPackage>[] = [
    {
      key: 'title',
      header: 'Package',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[var(--lito-cream-alt)] flex items-center justify-center flex-shrink-0">
            <Tag className="w-4 h-4 text-[var(--text-muted)]" aria-hidden />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-body text-sm font-medium text-[var(--text-muted)]">
                {getPkgTitle(p)}
              </p>
              {p.is_popular && (
                <span className="px-[7px] py-[2px] rounded-full text-[10px] font-semibold bg-[rgba(212,168,83,0.15)] text-[var(--lito-gold-deep)] font-body">
                  Popular
                </span>
              )}
            </div>
            {p.billing_period && (
              <p className="font-body text-xs text-[var(--text-muted)]">{p.billing_period}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      width: '180px',
      render: (p) => (
        <span className="font-body text-sm font-medium text-[var(--text-muted)]">
          {formatPrice(p.price, p.price_max, p.currency)}
        </span>
      ),
    },
    {
      key: 'is_featured',
      header: 'Featured',
      width: '90px',
      render: (p) =>
        p.is_featured ? (
          <Star className="w-4 h-4 text-[var(--lito-gold)]" fill="currentColor" />
        ) : (
          <span className="font-body text-xs text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      width: '120px',
      render: (p) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {formatRelative(p.updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => onDelete(p.id)} aria-label="Delete">
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
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Pricing</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} package${meta.total !== 1 ? 's' : ''}` : 'Manage pricing packages'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search packages…"
          className="w-64"
        />
        <select
          className="cms-input h-9 text-sm w-44"
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value as ContentStatus | '', page: 1 })}
        >
          <option value="">All statuses</option>
          <option value="active">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="cms-card overflow-hidden">
        <DataTable
          data={packages}
          columns={columns}
          keyField="id"
          loading={isLoading}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          emptyTitle="No pricing packages yet"
          emptyDescription="Create packages to display on your pricing page"
          emptyIcon={Tag}
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
