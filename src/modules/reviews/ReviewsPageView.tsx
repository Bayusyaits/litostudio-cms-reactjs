import { MessageSquare, Trash2, CheckCircle, XCircle, Search, X } from 'lucide-react'
import { Button, StatusBadge, SearchInput, DataTable, Select, type DataTableColumn as Column } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'
import type { Review, ReviewStatus } from '@/types/content.types'

function StarRating({ rating }: { rating: number }) {
  const clamped = Math.max(1, Math.min(5, Math.round(rating)))
  return (
    <div className="flex items-center gap-0.5" aria-label={`${clamped} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={i < clamped ? 'var(--lito-gold)' : 'none'}
          stroke={i < clamped ? 'var(--lito-gold)' : 'var(--lito-border)'}
          strokeWidth="2"
          aria-hidden
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

interface Filter {
  search: string
  status: ReviewStatus | ''
  page: number
  limit: number
}

interface Props {
  reviews: Review[]
  meta?: { total: number; page: number; limit: number }
  isLoading: boolean
  filter: Filter
  setFilter: (f: Partial<Filter>) => void
  selectedIds: string[]
  onSelect: (id: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
}

export function ReviewsPageView({
  reviews, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onApprove, onReject, onDelete, onBulkDelete,
}: Props) {
  const columns: Column<Review>[] = [
    {
      key: 'author_name',
      header: 'Author',
      sortable: true,
      render: (review) => {
        const initials = review.author_name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[rgba(212,168,83,0.12)] flex items-center justify-center text-[11px] font-semibold text-[var(--lito-gold-deep)] shrink-0 font-body">
              {initials}
            </div>
            <div>
              <p className="font-body text-sm font-medium text-[var(--text-muted)]">
                {review.author_name}
              </p>
              {review.body && (
                <p className="font-body text-xs text-[var(--text-muted)] truncate max-w-[220px]">
                  {review.body}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'rating',
      header: 'Rating',
      width: '120px',
      render: (review) => <StarRating rating={review.rating} />,
    },
    {
      key: 'reviewable_type',
      header: 'Type',
      width: '120px',
      render: (review) =>
        review.reviewable_type ? (
          <span className="px-[9px] py-[3px] rounded-full text-[11px] font-medium bg-[rgba(26,74,90,0.08)] text-[var(--lito-teal)] font-body">
            {review.reviewable_type}
          </span>
        ) : (
          <span className="font-body text-xs text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (review) => <StatusBadge skin="cms" status={review.status} />,
    },
    {
      key: 'created_at',
      header: 'Received',
      sortable: true,
      width: '120px',
      render: (review) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {formatRelative(review.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (review) => (
        <div className="flex items-center justify-end gap-1">
          {review.status === 'pending' && (
            <>
              <Button skin="cms"
                size="icon"
                variant="ghost"
                onClick={() => onApprove(review.id)}
                aria-label="Approve"
                title="Approve"
              >
                <CheckCircle className="w-3.5 h-3.5 text-[var(--s-pub-fg)]" />
              </Button>
              <Button skin="cms"
                size="icon"
                variant="ghost"
                onClick={() => onReject(review.id)}
                aria-label="Reject"
                title="Reject"
              >
                <XCircle className="w-3.5 h-3.5 text-[var(--s-danger)]" />
              </Button>
            </>
          )}
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onDelete(review.id)} aria-label="Delete">
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
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Reviews</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} review${meta.total !== 1 ? 's' : ''}` : 'Moderate customer reviews'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          skin="cms"
          icon={<Search className="w-3.5 h-3.5" />}
          clearIcon={<X className="w-3.5 h-3.5" />}
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search reviews…"
          className="w-64"
        />
        <Select
          className="w-44"
          value={filter.status}
          onChange={(v) => setFilter({ status: v as ReviewStatus | '', page: 1 })}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
      </div>

      <div className="cms-card overflow-hidden">
        <DataTable
          data={reviews}
          columns={columns}
          keyField="id"
          loading={isLoading}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          emptyTitle="No reviews yet"
          emptyDescription="Customer reviews will appear here once submitted"
          emptyIcon={<MessageSquare />}
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
