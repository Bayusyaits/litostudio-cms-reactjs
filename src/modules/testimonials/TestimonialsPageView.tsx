import { Quote, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { StatusBadge } from '@litostudio/ui-cms'
import { SearchInput } from '@/components/molecules/SearchInput'
import { DataTable, type DataTableColumn as Column } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'
import type { Testimonial } from '@/types/content.types'
import type { ContentStatus } from '@/types/api.types'

function getBody(t: Testimonial): string | undefined {
  const body = t.translations?.[0]?.body
  if (typeof body === 'string') return body
  return undefined
}

interface Filter {
  search: string
  status: ContentStatus | ''
  page: number
  limit: number
}

interface Props {
  testimonials: Testimonial[]
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

export function TestimonialsPageView({
  testimonials, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onDelete, onBulkDelete,
}: Props) {
  const columns: Column<Testimonial>[] = [
    {
      key: 'author_name',
      header: 'Author',
      sortable: true,
      render: (t) => {
        const initials = t.author_name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
        return (
          <div className="flex items-center gap-3">
            {t.author_avatar ? (
              <img
                src={t.author_avatar}
                alt={t.author_name}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[rgba(212,168,83,0.12)] flex items-center justify-center text-[11px] font-semibold text-[var(--lito-gold-deep)] shrink-0 font-body">
                {initials}
              </div>
            )}
            <div>
              <p className="font-body text-sm font-medium text-[var(--text-muted)]">
                {t.author_name}
              </p>
              {(t.author_title || t.author_company) && (
                <p className="font-body text-xs text-[var(--text-muted)]">
                  {[t.author_title, t.author_company].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'body',
      header: 'Quote',
      render: (t) => {
        const body = getBody(t)
        return body ? (
          <p className="font-body text-xs text-[var(--text-muted)] truncate max-w-[280px] italic">
            "{body}"
          </p>
        ) : (
          <span className="font-body text-xs text-[var(--text-muted)]">—</span>
        )
      },
    },
    {
      key: 'rating',
      header: 'Rating',
      width: '80px',
      render: (t) =>
        t.rating != null ? (
          <span className="flex items-center gap-0.5 text-[var(--lito-gold)]">
            {Array.from({ length: Math.round(t.rating) }).map((_, i) => (
              <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
            ))}
          </span>
        ) : (
          <span className="font-body text-xs text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (t) => <StatusBadge skin="cms" status={t.status} />,
    },
    {
      key: 'created_at',
      header: 'Added',
      sortable: true,
      width: '120px',
      render: (t) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {formatRelative(t.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => onDelete(t.id)} aria-label="Delete">
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
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Testimonials</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} testimonial${meta.total !== 1 ? 's' : ''}` : 'Manage client testimonials'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search testimonials…"
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
          data={testimonials}
          columns={columns}
          keyField="id"
          loading={isLoading}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          emptyTitle="No testimonials yet"
          emptyDescription="Client testimonials will appear here once added"
          emptyIcon={<Quote />}
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
