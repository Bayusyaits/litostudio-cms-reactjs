import { MessageCircle, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { SearchInput } from '@/components/molecules/SearchInput'
import { DataTable, type DataTableColumn as Column } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'
import type { Comment, CommentStatus } from '@/types/content.types'

const STATUS_STYLES: Record<CommentStatus, { bg: string; color: string; label: string }> = {
  pending:  { bg: 'rgba(212,168,83,0.12)',  color: 'var(--lito-gold-deep)', label: 'Pending' },
  approved: { bg: 'rgba(34,130,84,0.10)',   color: 'var(--s-pub-fg)',       label: 'Approved' },
  rejected: { bg: 'rgba(163,48,40,0.10)',   color: 'var(--s-danger)',       label: 'Rejected' },
  spam:     { bg: 'rgba(100,100,100,0.10)', color: 'var(--text-muted)',     label: 'Spam' },
}

interface Filter {
  search: string
  status: CommentStatus | ''
  page: number
  limit: number
}

interface Props {
  comments: Comment[]
  meta?: { total: number; page: number; limit: number }
  isLoading: boolean
  filter: Filter
  setFilter: (f: Partial<Filter>) => void
  selectedIds: string[]
  onSelect: (id: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onSpam: (id: string) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
}

export function CommentsPageView({
  comments, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onApprove, onReject, onSpam, onDelete, onBulkDelete,
}: Props) {
  const columns: Column<Comment>[] = [
    {
      key: 'author_name',
      header: 'Author',
      sortable: true,
      render: (c) => {
        const initials = c.author_name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
        return (
          <div className="flex items-center gap-3">
            {c.author_avatar ? (
              <img
                src={c.author_avatar}
                alt={c.author_name}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[rgba(212,168,83,0.12)] flex items-center justify-center text-[11px] font-semibold text-[var(--lito-gold-deep)] shrink-0 font-body">
                {initials}
              </div>
            )}
            <div>
              <p className="font-body text-sm font-medium text-[var(--text-muted)]">
                {c.author_name}
              </p>
              {c.author_email && (
                <p className="font-body text-xs text-[var(--text-muted)]">{c.author_email}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'body',
      header: 'Comment',
      render: (c) => (
        <p className="font-body text-xs text-[var(--text-muted)] truncate max-w-[300px]">
          {c.body}
        </p>
      ),
    },
    {
      key: 'entity_type',
      header: 'On',
      width: '110px',
      render: (c) => (
        <span className="px-[9px] py-[3px] rounded-full text-[11px] font-medium bg-[rgba(26,74,90,0.08)] text-[var(--lito-teal)] font-body">
          {c.entity_type}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (c) => {
        const s = STATUS_STYLES[c.status]
        return (
          <span
            style={{
              padding: '3px 9px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 500,
              background: s.bg,
              color: s.color,
              fontFamily: 'var(--font-body)',
            }}
          >
            {s.label}
          </span>
        )
      },
    },
    {
      key: 'created_at',
      header: 'Posted',
      sortable: true,
      width: '110px',
      render: (c) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {formatRelative(c.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '130px',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          {c.status === 'pending' && (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onApprove(c.id)}
                aria-label="Approve"
                title="Approve"
              >
                <CheckCircle className="w-3.5 h-3.5 text-[var(--s-pub-fg)]" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onReject(c.id)}
                aria-label="Reject"
                title="Reject"
              >
                <XCircle className="w-3.5 h-3.5 text-[var(--s-danger)]" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onSpam(c.id)}
                aria-label="Mark as spam"
                title="Spam"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </Button>
            </>
          )}
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
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Comments</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} comment${meta.total !== 1 ? 's' : ''}` : 'Moderate user comments'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search comments…"
          className="w-64"
        />
        <select
          className="cms-input h-9 text-sm w-44"
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value as CommentStatus | '', page: 1 })}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="spam">Spam</option>
        </select>
      </div>

      <div className="cms-card overflow-hidden">
        <DataTable
          data={comments}
          columns={columns}
          keyField="id"
          loading={isLoading}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          emptyTitle="No comments yet"
          emptyDescription="User comments will appear here once submitted"
          emptyIcon={<MessageCircle />}
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
