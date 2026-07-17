import { Trash2, Mail, Search, X } from 'lucide-react'
import { Button, SearchInput, DataTable, Select, type DataTableColumn as Column } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'
import type { NewsletterSubscriber, NewsletterStatus } from '@/types/commerce.types'

const STATUSES: NewsletterStatus[] = ['pending', 'subscribed', 'unsubscribed', 'bounced']

interface Filter {
  search: string
  status: NewsletterStatus | ''
  page: number
  limit: number
}

interface Props {
  subscribers: NewsletterSubscriber[]
  meta?: { total: number; page: number; limit: number; total_pages?: number }
  isLoading: boolean
  filter: Filter
  setFilter: (f: Partial<Filter>) => void
  onUpdateStatus: (id: string, status: NewsletterStatus) => void
  onDelete: (id: string) => void
}

export function NewsletterPageView({ subscribers, meta, isLoading, filter, setFilter, onUpdateStatus, onDelete }: Props) {
  const columns: Column<NewsletterSubscriber>[] = [
    {
      key: 'email',
      header: 'Email',
      render: (sub) => (
        <div>
          <p className="font-body text-sm font-medium text-[var(--text-muted)]">{sub.email}</p>
          {sub.full_name && (
            <p className="font-body text-xs text-[var(--text-muted)]">{sub.full_name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      width: '120px',
      render: (sub) => (
        <span className="font-body text-xs text-[var(--text-muted)]">{sub.source ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (sub) => (
        <Select
          size="sm"
          className="w-36"
          value={sub.status}
          onChange={(v) => onUpdateStatus(sub.id, v as NewsletterStatus)}
          aria-label="Change subscriber status"
          options={STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
        />
      ),
    },
    {
      key: 'subscribed_at',
      header: 'Subscribed',
      width: '110px',
      render: (sub) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {sub.subscribed_at ? formatRelative(sub.subscribed_at) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (sub) => (
        <div className="flex justify-end">
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onDelete(sub.id)} aria-label="Delete subscriber">
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
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Newsletter</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} subscriber${meta.total !== 1 ? 's' : ''}` : 'Manage newsletter subscribers'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          skin="cms"
          icon={<Search className="w-3.5 h-3.5" />}
          clearIcon={<X className="w-3.5 h-3.5" />}
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search by email or name…"
          className="w-64"
        />
        <Select
          className="w-44"
          value={filter.status}
          onChange={(v) => setFilter({ status: v as NewsletterStatus | '', page: 1 })}
          options={[
            { value: '', label: 'All statuses' },
            ...STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
          ]}
        />
      </div>

      <div className="cms-card overflow-hidden">
        <DataTable
          data={subscribers}
          columns={columns}
          keyField="id"
          loading={isLoading}
          emptyTitle="No subscribers yet"
          emptyDescription="Newsletter subscribers will appear here once they sign up"
          emptyIcon={<Mail />}
        />
      </div>
    </div>
  )
}
