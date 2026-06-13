import { MessageSquare, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { StatusBadge } from '@/components/atoms/StatusBadge'
import { SearchInput } from '@/components/molecules/SearchInput'
import { DataTable } from '@/components/molecules/DataTable'
import { formatRelative } from '@/lib/utils'
import type { Column } from '@/components/molecules/DataTable/types'
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
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(212,168,83,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--lito-gold-deep)',
                flexShrink: 0,
                fontFamily: 'var(--font-body)',
              }}
            >
              {initials}
            </div>
            <div>
              <p className="font-body text-sm font-medium text-[var(--text-primary)]">
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
          <span
            style={{
              padding: '3px 9px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 500,
              background: 'rgba(26,74,90,0.08)',
              color: 'var(--lito-teal)',
              fontFamily: 'var(--font-body)',
            }}
          >
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
      render: (review) => <StatusBadge status={review.status} />,
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
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onApprove(review.id)}
                aria-label="Approve"
                title="Approve"
              >
                <CheckCircle className="w-3.5 h-3.5 text-[var(--s-pub-fg)]" />
              </Button>
              <Button
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
          <Button size="icon" variant="ghost" onClick={() => onDelete(review.id)} aria-label="Delete">
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
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search reviews…"
          className="w-64"
        />
        <select
          className="cms-input h-9 text-sm w-44"
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value as ReviewStatus | '', page: 1 })}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
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
          emptyIcon={MessageSquare}
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
