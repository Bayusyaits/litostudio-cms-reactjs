import { Plus, FileText, Trash2, LayoutTemplate, PenLine, Search, X } from 'lucide-react'
import { Button, StatusBadge, SearchInput, DataTable, type DataTableColumn as Column, AppImageThumb } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'
import { getTitle } from '@/types/content.types'
import type { JournalPost } from '@/types/content.types'

interface Props {
  posts: JournalPost[]
  meta?: { total: number; page: number; limit: number }
  isLoading: boolean
  filter: { search: string; status: string; page: number; limit: number }
  setFilter: (f: Partial<{ search: string; status: string; page: number }>) => void
  selectedIds: string[]
  onSelect: (id: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onNew: () => void
  onEdit: (id: string) => void
  onOpenEditor: (id: string) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
}

export function JournalPageView({
  posts, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onNew, onEdit, onOpenEditor, onDelete, onBulkDelete,
}: Props) {
  const columns: Column<JournalPost>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (post) => (
        <div className="flex items-center gap-3">
          {post.cover_image ? (
            <AppImageThumb src={post.cover_image} alt={getTitle(post)} size={36} radius={4} />
          ) : (
            <div className="w-9 h-9 rounded bg-[var(--lito-gold-soft)] flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-[var(--lito-gold)]" aria-hidden />
            </div>
          )}
          <p className="font-body text-sm font-medium text-[var(--text-muted)] truncate max-w-[300px]">
            {getTitle(post)}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (post) => <StatusBadge skin="cms" status={post.status} />,
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      width: '120px',
      render: (post) => <span className="font-body text-xs text-[var(--text-muted)]">{formatRelative(post.updated_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (post) => (
        <div className="flex items-center justify-end gap-1">
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onEdit(post.id)} aria-label="Edit" title="Edit fields"><PenLine className="w-3.5 h-3.5" /></Button>
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onOpenEditor(post.id)} aria-label="Open in editor" title="Open in editor">
            <LayoutTemplate className="w-3.5 h-3.5" />
          </Button>
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onDelete(post.id)} aria-label="Delete">
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
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Journal</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} posts` : 'Manage journal posts'}
          </p>
        </div>
        <Button skin="cms" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>New Post</Button>
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          skin="cms"
          icon={<Search className="w-3.5 h-3.5" />}
          clearIcon={<X className="w-3.5 h-3.5" />}
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search journal…"
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
      </div>

      <div className="cms-card overflow-hidden">
        <DataTable
          data={posts}
          columns={columns}
          keyField="id"
          loading={isLoading}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          emptyTitle="No journal posts yet"
          emptyDescription="Start writing to build your journal"
          emptyIcon={<FileText />}
          bulkActions={[
            { key: 'delete', label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, variant: 'danger', onClick: onBulkDelete },
          ]}
        />
      </div>
    </div>
  )
}
