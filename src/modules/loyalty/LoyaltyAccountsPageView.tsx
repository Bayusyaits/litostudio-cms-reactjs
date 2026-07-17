// modules/loyalty/LoyaltyAccountsPageView.tsx
import { Link } from 'react-router-dom'
import { Award, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { SearchInput, DataTable, Button, type DataTableColumn as Column } from '@litostudio/ui-cms'
import type { LoyaltyAccount, LoyaltyAccountsListMeta } from '@/services/loyalty.service'

interface Filter {
  search: string
  page: number
  per_page: number
}

interface Props {
  accounts: LoyaltyAccount[]
  meta?: LoyaltyAccountsListMeta
  isLoading: boolean
  error: string | null
  filter: Filter
  setFilter: (f: Partial<Filter>) => void
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function LoyaltyAccountsPageView({ accounts, meta, isLoading, error, filter, setFilter }: Props) {
  const columns: Column<LoyaltyAccount>[] = [
    {
      key: 'email',
      header: 'Email',
      render: (account) => (
        <Link
          to={`/loyalty/accounts/${account.id}`}
          className="font-body text-sm font-medium text-[var(--text-primary)] underline decoration-transparent hover:decoration-current"
        >
          {account.email}
        </Link>
      ),
    },
    {
      key: 'points_balance',
      header: 'Points balance',
      width: '160px',
      render: (account) => (
        <span className="font-body text-sm font-semibold text-[var(--text-primary)]">
          {account.points_balance.toLocaleString('id-ID')}
        </span>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      width: '140px',
      render: (account) => (
        account.tier ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--lito-gold-soft)] text-[var(--lito-gold)]">
            {account.tier}
          </span>
        ) : (
          <span className="font-body text-xs text-[var(--text-muted)]">—</span>
        )
      ),
    },
    {
      key: 'updated_at',
      header: 'Updated',
      width: '160px',
      render: (account) => (
        <span className="font-body text-xs text-[var(--text-muted)]">{fmtDateTime(account.updated_at)}</span>
      ),
    },
  ]

  const page = meta?.page ?? filter.page
  const totalPages = meta?.total_pages ?? 1

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Award className="w-6 h-6 text-[var(--lito-gold)]" />
            Loyalty Accounts
          </h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} account${meta.total !== 1 ? 's' : ''}` : 'Customer loyalty balances'}
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
          placeholder="Search by email…"
          className="w-64"
        />
      </div>

      {error && (
        <div className="cms-card border-[var(--s-danger)] p-3">
          <p className="font-body text-sm text-[var(--s-danger)]">{error}</p>
        </div>
      )}

      <div className="cms-card overflow-hidden">
        <DataTable
          data={accounts}
          columns={columns}
          keyField="id"
          loading={isLoading}
          emptyTitle="No loyalty accounts yet"
          emptyDescription="Customer loyalty accounts will appear here once they start earning points"
          emptyIcon={<Award />}
        />
      </div>

      {!isLoading && accounts.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="font-body text-xs text-[var(--text-muted)]">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              skin="cms"
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setFilter({ page: page - 1 })}
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />Prev
            </Button>
            <Button
              skin="cms"
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setFilter({ page: page + 1 })}
            >
              Next<ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
