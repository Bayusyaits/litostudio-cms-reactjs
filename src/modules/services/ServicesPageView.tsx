import { Briefcase, Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { StatusBadge } from '@/components/atoms/StatusBadge'
import { SearchInput } from '@/components/molecules/SearchInput'
import { DataTable } from '@/components/molecules/DataTable'
import { formatRelative } from '@/lib/utils'
import type { Column } from '@/components/molecules/DataTable/types'
import type { Service } from '@/types/content.types'
import type { ContentStatus } from '@/types/api.types'

function getServiceTitle(s: Service): string {
  return s.translations?.[0]?.title ?? s.slug ?? '—'
}

function getServiceExcerpt(s: Service): string | undefined {
  return s.translations?.[0]?.excerpt
}

interface Filter {
  search: string
  status: ContentStatus | ''
  page: number
  limit: number
}

interface Props {
  services: Service[]
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

export function ServicesPageView({
  services, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onDelete, onBulkDelete,
}: Props) {
  const columns: Column<Service>[] = [
    {
      key: 'title',
      header: 'Service',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          {s.cover_image ? (
            <img
              src={s.cover_image}
              alt={getServiceTitle(s)}
              style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div className="w-9 h-9 rounded bg-[var(--lito-cream-alt)] flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-4 h-4 text-[var(--text-muted)]" aria-hidden />
            </div>
          )}
          <div>
            <p className="font-body text-sm font-medium text-[var(--text-primary)] truncate max-w-[260px]">
              {getServiceTitle(s)}
            </p>
            {getServiceExcerpt(s) && (
              <p className="font-body text-xs text-[var(--text-muted)] truncate max-w-[260px]">
                {getServiceExcerpt(s)}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      width: '140px',
      render: (s) =>
        s.category ? (
          <span
            style={{
              padding: '3px 9px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 500,
              background: 'rgba(26,74,90,0.08)',
              color: 'var(--lito-teal)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {s.category}
          </span>
        ) : (
          <span className="font-body text-xs text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: 'price',
      header: 'Price',
      width: '120px',
      render: (s) =>
        s.price != null ? (
          <span className="font-body text-sm text-[var(--text-primary)]">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: s.currency ?? 'IDR', maximumFractionDigits: 0 }).format(s.price)}
          </span>
        ) : (
          <span className="font-body text-xs text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      width: '120px',
      render: (s) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {formatRelative(s.updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => onDelete(s.id)} aria-label="Delete">
            <Trash2 className="w-3.5 h-3.5 text-[var(--s-danger)]" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Services</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} service${meta.total !== 1 ? 's' : ''}` : 'Manage your service offerings'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search services…"
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
          data={services}
          columns={columns}
          keyField="id"
          loading={isLoading}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          emptyTitle="No services yet"
          emptyDescription="Add your photography services and packages"
          emptyIcon={Briefcase}
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
