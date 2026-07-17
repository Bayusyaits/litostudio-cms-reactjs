import { Layers, Trash2, Plus, Pencil, LayoutTemplate, Search, X } from 'lucide-react'
import { Button, StatusBadge, SearchInput, DataTable, Select, type DataTableColumn as Column } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'
import type { Collection } from '@/types/content.types'

interface Filter {
  search: string
  status: string
  page: number
  limit: number
}

interface Props {
  collections: Collection[]
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

export function CollectionsPageView({
  collections, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onNew, onEdit, onOpenEditor, onDelete, onBulkDelete,
}: Props) {
  const columns: Column<Collection>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (col) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[var(--lito-cream-alt)] flex items-center justify-center flex-shrink-0">
            <Layers className="w-4 h-4 text-[var(--text-muted)]" aria-hidden />
          </div>
          <div>
            <p className="font-body text-sm font-medium text-[var(--text-muted)] truncate max-w-[260px]">
              {col.name}
            </p>
            <p className="font-body text-xs text-[var(--text-muted)]">{col.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'item_count',
      header: 'Items',
      width: '100px',
      render: (col) => (
        <span className="px-[9px] py-[3px] rounded-full text-[11px] font-medium bg-[rgba(26,74,90,0.08)] text-[var(--lito-teal)] font-body">
          {col.item_count ?? 0}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (col) => <StatusBadge skin="cms" status={col.status} />,
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      width: '120px',
      render: (col) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {formatRelative(col.updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '96px',
      render: (col) => (
        <div className="flex items-center justify-end gap-1">
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onEdit(col.id)} aria-label="Edit" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onOpenEditor(col.id)} aria-label="Open editor" title="Open block editor">
            <LayoutTemplate className="w-3.5 h-3.5 text-[var(--lito-teal)]" />
          </Button>
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onDelete(col.id)} aria-label="Delete">
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
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Collections</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} collection${meta.total !== 1 ? 's' : ''}` : 'Manage product collections'}
          </p>
        </div>
        <Button skin="cms" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>
          New Collection
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          skin="cms"
          icon={<Search className="w-3.5 h-3.5" />}
          clearIcon={<X className="w-3.5 h-3.5" />}
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search collections…"
          className="w-64"
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
          data={collections}
          columns={columns}
          keyField="id"
          loading={isLoading}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          emptyTitle="No collections yet"
          emptyDescription="Group your products into collections"
          emptyIcon={<Layers />}
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
