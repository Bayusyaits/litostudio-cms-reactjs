import { Megaphone, Trash2, Pencil, Plus, LayoutTemplate } from 'lucide-react'
import { Button }     from '@/components/atoms/Button'
import { StatusBadge } from '@litostudio/ui-cms'
import { SearchInput } from '@/components/molecules/SearchInput'
import { DataTable, type DataTableColumn as Column } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'
import type { Campaign } from '@/types/content.types'
import type { ContentStatus } from '@/types/api.types'

function getCampaignTitle(c: Campaign): string {
  return c.translations?.[0]?.title ?? c.slug ?? '—'
}

interface Filter {
  search: string
  status: ContentStatus | ''
  page: number
  limit: number
}

interface Props {
  campaigns: Campaign[]
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

export function CampaignsPageView({
  campaigns, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onNew, onEdit, onOpenEditor, onDelete, onBulkDelete,
}: Props) {
  const columns: Column<Campaign>[] = [
    {
      key: 'title',
      header: 'Campaign',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          {c.cover_image ? (
            <img
              src={c.cover_image}
              alt={getCampaignTitle(c)}
              className="w-9 h-9 rounded-md object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded bg-[var(--lito-cream-alt)] flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-4 h-4 text-[var(--text-muted)]" aria-hidden />
            </div>
          )}
          <div>
            <p className="font-body text-sm font-medium text-[var(--text-muted)] truncate max-w-[280px]">
              {getCampaignTitle(c)}
            </p>
            {c.slug && (
              <p className="font-body text-xs text-[var(--text-muted)]">{c.slug}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Schedule',
      width: '160px',
      render: (c) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {c.start_date ? new Date(c.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          {c.end_date ? ` → ${new Date(c.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
        </span>
      ),
    },
    {
      key: 'cta',
      header: 'CTA',
      width: '120px',
      render: (c) =>
        c.cta_label ? (
          <span className="font-body text-xs text-[var(--lito-teal)] truncate max-w-[110px] block">{c.cta_label}</span>
        ) : (
          <span className="font-body text-xs text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (c) => <StatusBadge skin="cms" status={c.status} />,
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      width: '110px',
      render: (c) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {formatRelative(c.updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '96px',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => onEdit(c.id)} aria-label="Edit" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onOpenEditor(c.id)} aria-label="Open editor" title="Open block editor">
            <LayoutTemplate className="w-3.5 h-3.5 text-[var(--lito-teal)]" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(c.id)} aria-label="Delete">
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
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Campaigns</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} campaign${meta.total !== 1 ? 's' : ''}` : 'Manage promotions and campaign pages'}
          </p>
        </div>
        <Button onClick={onNew} leftIcon={<Plus className="w-4 h-4" />}>
          New Campaign
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search campaigns…"
          className="w-64"
        />
        <select
          className="cms-input h-9 text-sm w-44"
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value as ContentStatus | '', page: 1 })}
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="cms-card overflow-hidden">
        <DataTable
          data={campaigns}
          columns={columns}
          keyField="id"
          loading={isLoading}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          emptyTitle="No campaigns yet"
          emptyDescription="Create promotions, landing pages and marketing campaigns"
          emptyIcon={<Megaphone />}
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
