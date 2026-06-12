import { Tv2, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { StatusBadge } from '@/components/atoms/StatusBadge'
import { SearchInput } from '@/components/molecules/SearchInput'
import { DataTable } from '@/components/molecules/DataTable'
import { formatRelative } from '@/lib/utils'
import type { Column } from '@/components/molecules/DataTable/types'
import type { HeroSlide } from '@/types/content.types'
import type { ContentStatus } from '@/types/api.types'

function getSlideTitle(s: HeroSlide): string {
  return s.translations?.[0]?.title ?? s.slug ?? '—'
}

interface Filter {
  search: string
  status: ContentStatus | ''
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
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
}

export function HeroPageView({
  slides, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onDelete, onBulkDelete,
}: Props) {
  const columns: Column<HeroSlide>[] = [
    {
      key: 'title',
      header: 'Slide',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          {s.image_url ? (
            <img
              src={s.image_url}
              alt={getSlideTitle(s)}
              style={{ width: 52, height: 36, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 52, height: 36,
                borderRadius: 4,
                background: 'var(--lito-cream-alt)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Tv2 className="w-4 h-4 text-[var(--text-muted)]" aria-hidden />
            </div>
          )}
          <div>
            <p className="font-body text-sm font-medium text-[var(--text-primary)] truncate max-w-[240px]">
              {getSlideTitle(s)}
            </p>
            <p className="font-body text-xs text-[var(--text-muted)]">Order: {s.sort_order}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'cta_label',
      header: 'CTA',
      width: '160px',
      render: (s) =>
        s.cta_label ? (
          <div className="flex items-center gap-1.5">
            <span className="font-body text-xs text-[var(--text-secondary)]">{s.cta_label}</span>
            {s.cta_url && (
              <a
                href={s.cta_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Open CTA link"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ) : (
          <span className="font-body text-xs text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: 'is_active',
      header: 'Active',
      width: '80px',
      render: (s) => (
        <span
          style={{
            padding: '3px 8px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 500,
            background: s.is_active ? 'rgba(34,130,84,0.1)' : 'rgba(163,48,40,0.1)',
            color: s.is_active ? 'var(--s-pub-fg)' : 'var(--s-danger)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {s.is_active ? 'Active' : 'Inactive'}
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
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Hero Slides</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} slide${meta.total !== 1 ? 's' : ''}` : 'Manage homepage hero slides'}
          </p>
        </div>
      </div>

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
          data={slides}
          columns={columns}
          keyField="id"
          loading={isLoading}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          emptyTitle="No hero slides yet"
          emptyDescription="Add slides to power your homepage hero section"
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
