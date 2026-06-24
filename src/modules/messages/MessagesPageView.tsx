import { Trash2, Inbox, MailOpen, Reply } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { StatusBadge } from '@/components/atoms/StatusBadge'
import { SearchInput } from '@/components/molecules/SearchInput'
import { DataTable } from '@/components/molecules/DataTable'
import { formatRelative } from '@/lib/utils'
import type { Column } from '@/components/molecules/DataTable/types'
import type { ContactMessage } from '@/types/commerce.types'

const MESSAGE_STATUSES = ['new', 'read', 'replied', 'archived'] as const

interface Filter {
  search: string
  status: string
  page: number
  limit: number
}

interface Props {
  messages: ContactMessage[]
  meta?: { total: number; page: number; limit: number; total_pages?: number }
  isLoading: boolean
  filter: Filter
  setFilter: (f: Partial<Filter>) => void
  onMarkRead: (id: string) => void
  onMarkReplied?: (id: string) => void
  onReply?: (msg: ContactMessage) => void
  onDelete: (id: string) => void
}

export function MessagesPageView({ messages, meta, isLoading, filter, setFilter, onMarkRead, onReply, onDelete }: Props) {
  const columns: Column<ContactMessage>[] = [
    {
      key: 'name',
      header: 'From',
      render: (msg) => (
        <div>
          <p className="font-body text-sm font-medium text-[var(--text-muted)]">{msg.name}</p>
          <p className="font-body text-xs text-[var(--text-muted)]">{msg.email}</p>
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Message',
      render: (msg) => (
        <p className="font-body text-xs text-[var(--text-secondary)] truncate max-w-[320px]">
          {msg.message}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (msg) => <StatusBadge status={msg.status} />,
    },
    {
      key: 'created_at',
      header: 'Received',
      sortable: true,
      width: '110px',
      render: (msg) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {formatRelative(msg.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (msg) => (
        <div className="flex items-center justify-end gap-1">
          {msg.status === 'new' && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onMarkRead(msg.id)}
              aria-label="Mark as read"
              title="Mark as read"
            >
              <MailOpen className="w-3.5 h-3.5 text-[var(--lito-teal)]" />
            </Button>
          )}
          {onReply && msg.status !== 'replied' && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onReply(msg)}
              aria-label="Reply via email"
              title="Reply via email"
            >
              <Reply className="w-3.5 h-3.5 text-[var(--lito-teal)]" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => onDelete(msg.id)} aria-label="Delete">
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
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Messages</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} message${meta.total !== 1 ? 's' : ''}` : 'View contact form submissions'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search by name or email…"
          className="w-64"
        />
        <select
          className="cms-input h-9 text-sm w-40"
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value, page: 1 })}
        >
          <option value="">All statuses</option>
          {MESSAGE_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="cms-card overflow-hidden">
        <DataTable
          data={messages}
          columns={columns}
          keyField="id"
          loading={isLoading}
          emptyTitle="No messages yet"
          emptyDescription="Contact form submissions will appear here"
          emptyIcon={Inbox}
        />
      </div>
    </div>
  )
}
