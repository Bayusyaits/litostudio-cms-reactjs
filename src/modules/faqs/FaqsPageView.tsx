import { HelpCircle, Trash2, Plus, PenLine, Search, X, Star } from 'lucide-react'
import { Button, StatusBadge, Badge, SearchInput, DataTable, type DataTableColumn as Column } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'
import type { Faq, FaqCategory } from '@/types/content.types'

// NOTE: the backend relation is `faq_translations` (see content.types.ts —
// this used to read the nonexistent `.translations`, which always resolved
// to undefined, so every row in this table silently rendered "—").
function getFaqQuestion(faq: Faq): string {
  return faq.faq_translations?.[0]?.question ?? '—'
}

function getFaqAnswer(faq: Faq): string | undefined {
  return faq.faq_translations?.[0]?.answer
}

interface Filter {
  search: string
  status: string
  category_id: string
  page: number
  limit: number
}

interface Props {
  faqs: Faq[]
  categories: FaqCategory[]
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

export function FaqsPageView({
  faqs, categories, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onNew, onEdit, onDelete, onBulkDelete,
}: Props) {
  const columns: Column<Faq>[] = [
    {
      key: 'question',
      header: 'Question',
      sortable: true,
      render: (faq) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[var(--lito-cream-alt)] flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-4 h-4 text-[var(--text-muted)]" aria-hidden />
          </div>
          <div>
            <p className="font-body text-sm font-medium text-[var(--text-muted)] truncate max-w-[300px]">
              {getFaqQuestion(faq)}
            </p>
            {getFaqAnswer(faq) && (
              <p className="font-body text-xs text-[var(--text-muted)] truncate max-w-[300px]">
                {getFaqAnswer(faq)}
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
      render: (faq) => (
        faq.faq_categories
          ? <Badge variant="default">{faq.faq_categories.name}</Badge>
          : <span className="font-body text-xs text-[var(--text-faint)]">—</span>
      ),
    },
    {
      key: 'featured',
      header: '',
      width: '36px',
      render: (faq) => (
        faq.is_featured
          ? <Star className="w-4 h-4 text-[var(--s-warning,#d4a017)] fill-current" aria-label="Featured" />
          : null
      ),
    },
    {
      key: 'sort_order',
      header: 'Order',
      width: '80px',
      render: (faq) => (
        <span className="font-body text-xs text-[var(--text-muted)]">{faq.sort_order}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (faq) => <StatusBadge skin="cms" status={faq.status} />,
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      width: '120px',
      render: (faq) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {formatRelative(faq.updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (faq) => (
        <div className="flex items-center justify-end gap-1">
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onEdit(faq.id)} aria-label="Edit">
            <PenLine className="w-3.5 h-3.5" />
          </Button>
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onDelete(faq.id)} aria-label="Delete">
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
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">FAQs</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} FAQ${meta.total !== 1 ? 's' : ''}` : 'Manage frequently asked questions'}
          </p>
        </div>
        <Button skin="cms" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>
          New FAQ
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          skin="cms"
          icon={<Search className="w-3.5 h-3.5" />}
          clearIcon={<X className="w-3.5 h-3.5" />}
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search FAQs…"
          className="w-64"
        />
        <select
          className="cms-input h-9 text-sm w-40"
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value, page: 1 })}
        >
          <option value="">All statuses</option>
          <option value="active">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          className="cms-input h-9 text-sm w-44"
          value={filter.category_id}
          onChange={(e) => setFilter({ category_id: e.target.value, page: 1 })}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="cms-card overflow-hidden">
        <DataTable
          data={faqs}
          columns={columns}
          keyField="id"
          loading={isLoading}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          emptyTitle="No FAQs yet"
          emptyDescription="Add frequently asked questions to help your visitors"
          emptyIcon={<HelpCircle />}
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
