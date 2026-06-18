import { Tv2, Trash2, Pencil, Plus, ExternalLink } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { StatusBadge } from '@/components/atoms/StatusBadge'
import { SearchInput } from '@/components/molecules/SearchInput'
import { DataTable } from '@/components/molecules/DataTable'
import { formatRelative } from '@/lib/utils'
import type { Column } from '@/components/molecules/DataTable/types'
import type { HeroSlide, HeroStatus } from '@/types/content.types'

function getSlideTitle(s: HeroSlide): string {
  return s.translations?.[0]?.title ?? `Slide #${s.sort_order + 1}`
}

interface Filter {
  search: string
  status: HeroStatus | ''
  page: number
  limit: number
}

interface Props {
  slides: HeroSlide[]
  meta?: { total: number; page: number; limit: number }
  isLoading: boolean
  filter: Filter
  setFilter: (f: Partial<Filter>) => void
  selectedIds: string[]
  onSelect: (id: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onCreate: () => void
  onEdit: (slide: HeroSlide) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
}

export function HeroPageView({
  slides, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onCreate, onEdit, onDelete, onBulkDelete,
}: Props) {
  const columns: Column<HeroSlide>[] = [
    {
      key: 'title',
      header: 'Slide',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          {s.cover_image ? (
            <img
              src={s.cover_image}
              alt={getSlideTitle(s)}
              className="w-[52px] h-9 rounded object-cover shrink-0"
            />
          ) : (
            <div className="w-[52px] h-9 rounded bg-[var(--lito-cream-alt)] flex items-center justify-center shrink-0">
              <Tv2 className="w-4 h-4 text-[var(--text-muted)]" aria-hidden />
            </div>
          )}
          <div>
            <p className="font-body text-sm font-medium text-[var(--text-muted)] truncate max-w-[240px]">
              {getSlideTitle(s)}
            </p>
            <p className="font-body text-xs text-[var(--text-muted)]">Order: {s.sort_order}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'href',
      header: 'Link',
      width: '180px',
      render: (s) =>
        s.extra?.href ? (
          <div className="flex items-center gap-1.5">
            <span className="font-body text-xs text-[var(--text-secondary)] truncate max-w-[140px]">{s.extra.href}</span>
            <a
              href={s.extra.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
              aria-label="Open link"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <span className="font-body text-xs text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: 'location',
      header: 'Location',
      width: '140px',
      render: (s) => (
        <span className="font-body text-xs text-[var(--text-secondary)]">
          {s.location ?? '—'}
        </span>
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
      width: '80px',
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => onEdit(s)} aria-label="Edit slide">
            <Pencil className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(s.id)} aria-label="Delete slide">
            <Trash2 className="w-3.5 h-3.5 text-[var(--cms-danger)]" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Hero Slides</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} slide${meta.total !== 1 ? 's' : ''}` : 'Manage homepage hero slides'}
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          New Slide
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search slides…"
          className="w-64"
        />
        <select
          className="cms-input h-9 text-sm w-44"
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value as HeroStatus | '', page: 1 })}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="cms-card overflow-hidden">
        <DataTable
          data={slides}
          columns={columns}
          keyField="id"
          loading={isLoading}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          emptyTitle="No hero slides yet"
          emptyDescription="Create your first slide to power the homepage hero section"
          emptyIcon={Tv2}
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
