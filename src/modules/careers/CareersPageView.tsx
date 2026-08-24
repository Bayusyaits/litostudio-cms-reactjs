import { Briefcase, Trash2, Plus, PenLine, Search, X, Star, ExternalLink } from 'lucide-react'
import { Button, StatusBadge, Badge, SearchInput, DataTable, Select, type DataTableColumn as Column } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'
import type { JobPosting } from '@/types/content.types'

function getTitle(j: JobPosting): string {
  return j.job_posting_translations?.[0]?.title ?? '—'
}

interface Filter {
  search: string
  status: string
  department: string
  page: number
  limit: number
}

interface Props {
  jobs: JobPosting[]
  meta?: { total: number; page: number; limit: number }
  isLoading: boolean
  filter: Filter
  setFilter: (f: Partial<Filter>) => void
  selectedIds: string[]
  onSelect: (id: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onNew: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
}

export function CareersPageView({
  jobs, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onNew, onEdit, onDelete, onBulkDelete,
}: Props) {
  const columns: Column<JobPosting>[] = [
    {
      key: 'title',
      header: 'Position',
      sortable: true,
      render: (j) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[var(--lito-cream-alt)] flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-4 h-4 text-[var(--text-muted)]" aria-hidden />
          </div>
          <div>
            <p className="font-body text-sm font-medium text-[var(--text-muted)] flex items-center gap-1.5">
              {getTitle(j)}
              {j.application_type === 'external' && (
                <ExternalLink className="w-3 h-3 text-[var(--text-faint)]" aria-label="External application" />
              )}
            </p>
            {j.location && <p className="font-body text-xs text-[var(--text-muted)]">{j.location}{j.is_remote ? ' · Remote' : ''}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      width: '140px',
      render: (j) => (
        j.department
          ? <Badge variant="default">{j.department}</Badge>
          : <span className="font-body text-xs text-[var(--text-faint)]">—</span>
      ),
    },
    {
      key: 'employment_type',
      header: 'Type',
      width: '110px',
      render: (j) => <span className="font-body text-xs text-[var(--text-muted)] capitalize">{j.employment_type.replace('_', ' ')}</span>,
    },
    {
      key: 'featured',
      header: '',
      width: '36px',
      render: (j) => (
        j.is_featured
          ? <Star className="w-4 h-4 text-[var(--s-warning,#d4a017)] fill-current" aria-label="Featured" />
          : null
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (j) => <StatusBadge skin="cms" status={j.status} />,
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      width: '120px',
      render: (j) => <span className="font-body text-xs text-[var(--text-muted)]">{formatRelative(j.updated_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (j) => (
        <div className="flex items-center justify-end gap-1">
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onEdit(j.id)} aria-label="Edit">
            <PenLine className="w-3.5 h-3.5" />
          </Button>
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onDelete(j.id)} aria-label="Delete">
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
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Careers</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} position${meta.total !== 1 ? 's' : ''}` : 'Manage open positions shown on your Careers page'}
          </p>
        </div>
        <Button skin="cms" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>
          New Job Posting
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          skin="cms"
          icon={<Search className="w-3.5 h-3.5" />}
          clearIcon={<X className="w-3.5 h-3.5" />}
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search job postings…"
          className="w-64"
        />
        <Select
          className="w-40"
          value={filter.status}
          onChange={(v) => setFilter({ status: v, page: 1 })}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'active', label: 'Published' },
            { value: 'draft', label: 'Draft' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
      </div>

      <div className="cms-card overflow-hidden">
        <DataTable
          data={jobs}
          columns={columns}
          keyField="id"
          loading={isLoading}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          emptyTitle="No job postings yet"
          emptyDescription="Add your open positions to start accepting applications"
          emptyIcon={<Briefcase />}
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
