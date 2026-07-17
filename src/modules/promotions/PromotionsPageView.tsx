import { Tag, Trash2, Plus, Pencil } from 'lucide-react'
import { EnterpriseDataTable, Select } from '@litostudio/ui-cms'
import type { EDTColumn, EDTServerProps } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'
import type { Promotion, PromotionStatus, PromotionType } from '@/types/content.types'

// NOTE: intentionally NOT using the shared <StatusBadge skin="cms"> here —
// that component's `active` key renders the label "Published", which is
// correct for generic CMS content (stories/pages) but wrong for a
// promotion (an active promotion isn't "published" content). `paused` and
// `expired` also aren't in its config table at all. Small local mapping
// instead, same reasoning documented in StatusBadge.tsx's own file header
// for why cms/sa vocabularies aren't merged.
const STATUS_CONFIG: Record<PromotionStatus, { label: string; cls: string }> = {
  draft:    { label: 'Draft',    cls: 'text-[var(--s-draft-fg)] bg-[var(--s-draft-bg)]' },
  active:   { label: 'Active',   cls: 'text-[var(--s-pub-fg)] bg-[var(--s-pub-bg)]' },
  paused:   { label: 'Paused',   cls: 'text-[var(--s-sched-fg)] bg-[var(--s-sched-bg)]' },
  expired:  { label: 'Expired',  cls: 'text-[var(--s-arch-fg)] bg-[var(--s-arch-bg)]' },
  archived: { label: 'Archived', cls: 'text-[var(--s-arch-fg)] bg-[var(--s-arch-bg)]' },
}

const TYPE_LABEL: Record<PromotionType, string> = {
  coupon: 'Coupon',
  campaign: 'Campaign',
  promo: 'Promo',
}

function formatDiscount(promo: Promotion): string {
  if (promo.discount_type === 'percentage') {
    const cap = promo.max_discount_amount ? ` (up to Rp${promo.max_discount_amount.toLocaleString('id-ID')})` : ''
    return `${promo.discount_value}%${cap}`
  }
  return `Rp${promo.discount_value.toLocaleString('id-ID')}`
}

interface Filter {
  search: string
  type: PromotionType | ''
  status: PromotionStatus | ''
  page: number
  limit: number
}

interface Props {
  promotions: Promotion[]
  meta?: { total: number; page: number; per_page: number }
  isLoading: boolean
  filter: Filter
  setFilter: (f: Partial<Filter>) => void
  onNew: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function PromotionsPageView({ promotions, meta, isLoading, filter, setFilter, onNew, onEdit, onDelete }: Props) {
  const columns: EDTColumn<Promotion>[] = [
    {
      key: 'name',
      label: 'Promotion',
      sortable: true,
      render: (promo) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[var(--lito-cream-alt)] flex items-center justify-center flex-shrink-0">
            <Tag className="w-4 h-4 text-[var(--text-muted)]" aria-hidden />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-body text-sm font-medium text-[var(--text-primary)] truncate max-w-[220px]">
                {promo.name}
              </p>
              {promo.site_id === null && (
                <span
                  className="font-body text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--lito-gold-soft)] text-[var(--lito-ink)] flex-shrink-0"
                  title="Applies to every site in this organization"
                >
                  All sites
                </span>
              )}
            </div>
            <p className="font-body text-xs text-[var(--text-muted)]">
              {promo.code ?? '— no code —'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      width: 100,
      render: (promo) => (
        <span className="font-body text-xs text-[var(--text-muted)]">{TYPE_LABEL[promo.type]}</span>
      ),
    },
    {
      key: 'discount_value',
      label: 'Discount',
      width: 140,
      render: (promo) => (
        <span className="font-body text-sm text-[var(--text-primary)]">{formatDiscount(promo)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 110,
      render: (promo) => {
        const cfg = STATUS_CONFIG[promo.status]
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-body text-[11px] font-medium ${cfg.cls}`}>
            {cfg.label}
          </span>
        )
      },
    },
    {
      key: 'usage_count',
      label: 'Usage',
      width: 100,
      render: (promo) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {promo.usage_count}{promo.usage_limit_total ? ` / ${promo.usage_limit_total}` : ''}
        </span>
      ),
    },
    {
      key: 'ends_at',
      label: 'Ends',
      sortable: true,
      width: 120,
      render: (promo) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {promo.ends_at ? formatRelative(promo.ends_at) : 'No end date'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 80,
      render: (promo) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(promo.id) }}
            aria-label="Edit promotion"
            title="Edit"
            className="bg-transparent border-none cursor-pointer text-[var(--text-muted)] p-1 rounded flex hover:text-[var(--text-primary)] hover:bg-[rgba(17,17,17,0.04)]"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(promo.id) }}
            aria-label="Delete promotion"
            title="Delete"
            className="bg-transparent border-none cursor-pointer text-[var(--text-muted)] p-1 rounded flex hover:text-[var(--cms-danger)] hover:bg-[var(--cms-danger-bg)]"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ]

  const server: EDTServerProps = {
    total: meta?.total ?? 0,
    limit: filter.limit,
    offset: (filter.page - 1) * filter.limit,
    onPageChange: (offset) => setFilter({ page: Math.floor(offset / filter.limit) + 1 }),
    search: filter.search,
    onSearchChange: (search) => setFilter({ search, page: 1 }),
    loading: isLoading,
  }

  return (
    <div className="cms-page p-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[28px] font-normal text-[var(--text-muted)]">Promotions</h1>
          <p className="font-body text-xs text-[var(--text-muted)] mt-[3px]">
            {meta ? `${meta.total} promotion${meta.total !== 1 ? 's' : ''}` : 'Coupons, campaigns, and promos'}
          </p>
        </div>
        <button type="button" onClick={onNew} className="cms-btn cms-btn-primary cms-btn-sm">
          <Plus size={14} /> New promotion
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Select
          className="w-40"
          value={filter.type}
          onChange={(v) => setFilter({ type: v as PromotionType | '', page: 1 })}
          options={[
            { value: '', label: 'All types' },
            { value: 'coupon', label: 'Coupon' },
            { value: 'campaign', label: 'Campaign' },
            { value: 'promo', label: 'Promo' },
          ]}
        />
        <Select
          className="w-40"
          value={filter.status}
          onChange={(v) => setFilter({ status: v as PromotionStatus | '', page: 1 })}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'active', label: 'Active' },
            { value: 'paused', label: 'Paused' },
            { value: 'expired', label: 'Expired' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
      </div>

      <EnterpriseDataTable<Promotion>
        skin="cms"
        columns={columns}
        data={promotions}
        server={server}
        onRowClick={(promo) => onEdit(promo.id)}
        emptyIcon={<Tag className="w-6 h-6 text-[var(--lito-gold)]" aria-hidden />}
        emptyTitle="No promotions yet"
        emptyDescription="Create a coupon, campaign, or promo to offer a discount at checkout"
      />
    </div>
  )
}
