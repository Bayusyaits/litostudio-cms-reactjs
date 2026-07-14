import { FileText, Globe, Image, Link2, BookOpen, ArrowRight, Clock, ShoppingBag, Wallet, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Skeleton, EnterpriseDataTable } from '@litostudio/ui-cms'
import type { DashboardStats, DashboardRecentItem, Organization, Site, CommerceReadiness, LowStockProduct, EDTColumn } from '@litostudio/ui-cms'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/lib/utils'

function formatIdr(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

/**
 * Proactive commerce setup banner — only rendered when cart is enabled on at
 * least one site AND something is actually missing (shipping origin and/or
 * payment gateway config). Shows nothing for stores that either haven't
 * turned on cart yet, or are already fully configured.
 */
function CommerceReadinessBanner({ readiness }: { readiness?: CommerceReadiness | null }) {
  if (!readiness || !readiness.cartEnabled) return null

  const missingShipping = readiness.sitesMissingShippingOrigin
  const missingPayment = !readiness.paymentConfigured
  if (missingShipping.length === 0 && !missingPayment) return null

  const issues: string[] = []
  if (missingShipping.length > 0) {
    issues.push(
      `Shipping origin not set for ${missingShipping.map(s => s.name).join(', ')} — physical orders can't get shipping rates until this is configured.`,
    )
  }
  if (missingPayment) {
    issues.push('Payment gateway (DOKU) is not configured — customers won\'t be able to pay for orders.')
  }

  return (
    <div
      className="cms-card mb-6 px-5 py-4 flex items-start gap-3"
      style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)' }}
    >
      <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: '#d97706' }} />
      <div className="flex-1">
        <div className="font-body text-[13px] font-medium text-[var(--text-primary)] mb-1">
          Checkout isn't fully set up yet
        </div>
        <ul className="font-body text-xs text-[var(--text-muted)] space-y-0.5 list-disc pl-4">
          {issues.map(issue => <li key={issue}>{issue}</li>)}
        </ul>
        <div className="flex gap-3 mt-2">
          {missingShipping.length > 0 && (
            <Link to="/shipping-origins" className="font-body text-xs text-[var(--lito-gold-deep)] no-underline font-medium">
              Set up shipping origin →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Critical-stock banner — products with <3 available across every tracked
 * site. Separate from CommerceReadinessBanner (setup problems) since this is
 * an ongoing operational signal, not a one-time config gap.
 */
function LowStockBanner({ products }: { products?: LowStockProduct[] | null }) {
  if (!products || products.length === 0) return null

  return (
    <div
      className="cms-card mb-6 px-5 py-4 flex items-start gap-3"
      style={{ background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.22)' }}
    >
      <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--s-danger, #c0392b)' }} />
      <div className="flex-1">
        <div className="font-body text-[13px] font-medium text-[var(--text-primary)] mb-1">
          {products.length} product{products.length !== 1 ? 's' : ''} critically low on stock
        </div>
        <ul className="font-body text-xs text-[var(--text-muted)] space-y-0.5">
          {products.slice(0, 5).map(p => (
            <li key={p.id}>
              <span className="text-[var(--text-primary)] font-medium">{p.name}</span>
              {' '}({p.site_name}) — <span style={{ color: 'var(--s-danger, #c0392b)' }}>{p.stock} left</span>
            </li>
          ))}
          {products.length > 5 && <li>and {products.length - 5} more…</li>}
        </ul>
        <Link to="/products" className="font-body text-xs text-[var(--lito-gold-deep)] no-underline font-medium mt-2 inline-block">
          Review products →
        </Link>
      </div>
    </div>
  )
}

interface Props {
  stats?: DashboardStats | null
  recent?: DashboardRecentItem[] | null
  loading: boolean
  siteName?: string
  org?: Organization
  site?: Site
  readiness?: CommerceReadiness | null
  lowStock?: LowStockProduct[] | null
}

function toLocalDate(date: Date) {
  const locale = navigator.language || 'en-US'
  return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; fg: string; bg: string }> = {
    published: { label: 'Published', fg: 'var(--s-pub-fg)',   bg: 'var(--s-pub-bg)' },
    active:    { label: 'Active',    fg: 'var(--s-pub-fg)',   bg: 'var(--s-pub-bg)' },
    draft:     { label: 'Draft',     fg: 'var(--s-draft-fg)', bg: 'var(--s-draft-bg)' },
    archived:  { label: 'Archived',  fg: 'var(--s-arch-fg)',  bg: 'var(--s-arch-bg)' },
  }
  const cfg = map[status] ?? map.draft
  return (
    <span className="status-badge" style={{ color: cfg.fg, background: cfg.bg }}>
      <span className="status-badge__dot" style={{ background: cfg.fg }} />
      {cfg.label}
    </span>
  )
}

interface StatCardProps {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  label: string
  value: number | string
  loading: boolean
}
function StatCard({ icon: Icon, iconBg, iconColor, label, value, loading }: StatCardProps) {
  return (
    <div className="cms-card flex-1 min-w-[160px] px-6 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          {loading ? (
            <>
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </>
          ) : (
            <>
              <div className="font-display text-[32px] font-normal text-[var(--text-primary)] leading-none">
                {value}
              </div>
              <div className="font-body text-xs text-[var(--text-muted)] mt-1">{label}</div>
            </>
          )}
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={17} style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  )
}

function QuickActionCard({ icon: Icon, iconBg, iconColor, title, desc, to }: {
  icon: React.ElementType; iconBg: string; iconColor: string; title: string; desc: string; to: string
}) {
  return (
    <Link to={to} className="no-underline flex-1 min-w-[140px]">
      <div
        className="cms-card px-[18px] py-4 cursor-pointer transition-[border-color,box-shadow] duration-150 hover:border-[var(--lito-gold)] hover:shadow-[var(--shadow-md)]"
      >
        <div
          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center mb-2.5"
          style={{ background: iconBg }}
        >
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        <div className="font-body text-[13px] font-medium text-[var(--text-muted)]">{title}</div>
        <div className="font-body text-[11px] text-[var(--text-muted)] mt-0.5">{desc}</div>
      </div>
    </Link>
  )
}

const recentColumns: EDTColumn<DashboardRecentItem>[] = [
  {
    key: 'title',
    label: 'Title',
    render: (item) => (
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-7 rounded-[3px] bg-[var(--lito-cream-alt)] shrink-0" />
        <div>
          <span className="font-body text-[13px] text-[var(--text-primary)] font-medium">{item.title}</span>
          <span className="font-body text-[10px] text-[var(--text-muted)] ml-1.5 capitalize">{item.type}</span>
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (item) => <StatusBadge status={item.status} />,
  },
  {
    key: 'updated_at',
    label: 'Updated',
    render: (item) => (
      <span className="font-body text-[11px] text-[var(--text-muted)]">
        {formatDate(item.updated_at)}
      </span>
    ),
  },
]

export function DashboardPageView({ stats, recent, loading, org: _org, site: _site, readiness, lowStock }: Props) {
  const { user } = useAuthStore()
  const today = toLocalDate(new Date())
  const firstName = user?.full_name?.split(' ')[0] ?? 'Admin'

  const statCards: StatCardProps[] = [
    { icon: ShoppingBag, iconBg: 'rgba(34,197,94,0.12)', iconColor: '#22c55e',           label: 'Orders',      value: stats?.orders ?? 0,      loading },
    { icon: Wallet,      iconBg: 'rgba(212,168,83,0.12)', iconColor: 'var(--lito-gold)', label: 'Revenue',     value: formatIdr(stats?.revenue ?? 0), loading },
    { icon: FileText, iconBg: 'rgba(26,74,90,0.10)',  iconColor: 'var(--lito-teal)',       label: 'Pages',       value: stats?.pages ?? 0,       loading },
    { icon: Globe,    iconBg: 'rgba(212,168,83,0.12)', iconColor: 'var(--lito-gold)',       label: 'Sites',       value: stats?.sites ?? 0,       loading },
    { icon: Image,    iconBg: 'rgba(212,168,83,0.08)', iconColor: 'var(--lito-gold-deep)', label: 'Media Files', value: stats?.media ?? 0,       loading },
    { icon: Link2,    iconBg: 'rgba(17,17,17,0.06)',   iconColor: 'var(--text-muted)',      label: 'Domains',     value: stats?.deployments ?? 0, loading },
  ]

  return (
    <div className="cms-page p-8 overflow-y-auto h-full bg-[var(--cms-main-bg)]">
      {/* Welcome */}
      <div className="mb-7">
        <h1 className="font-display text-[34px] font-normal text-[var(--text-primary)] leading-[1.15]">
          Selamat datang, {firstName}.
        </h1>
        <p className="font-body text-[13px] text-[var(--text-muted)] mt-1.5">{today}</p>
      </div>

      {/* Commerce readiness banner */}
      <CommerceReadinessBanner readiness={readiness} />
      <LowStockBanner products={lowStock} />

      {/* Stat cards */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {statCards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Quick actions */}
      <div className="mb-7">
        <h2 className="font-body text-[11px] font-medium uppercase tracking-[0.09em] text-[var(--text-muted)] mb-3">
          Quick Actions
        </h2>
        <div className="flex gap-3.5 flex-wrap">
          <QuickActionCard icon={FileText}  iconBg="rgba(26,74,90,0.10)"   iconColor="var(--lito-teal)" title="New Story"       desc="Write & publish a story" to="/stories/new" />
          <QuickActionCard icon={Image}     iconBg="rgba(212,168,83,0.12)" iconColor="var(--lito-gold)" title="Upload Media"    desc="Add photos & videos"     to="/media" />
          <QuickActionCard icon={Globe}     iconBg="rgba(26,74,90,0.08)"   iconColor="var(--lito-teal)"      title="Pages"      desc="Manage pages & menu"     to="/pages" />
          <QuickActionCard icon={BookOpen}  iconBg="rgba(17,17,17,0.06)"   iconColor="var(--text-muted)" title="SEO Overview"  desc="Check search performance" to="/seo" />
        </div>
      </div>

      {/* 2-col bottom */}
      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: '1fr 308px' }}>
        {/* Recent stories */}
        <div className="cms-card overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[var(--lito-border)]">
            <h3 className="font-body text-[13px] font-medium text-[var(--text-muted)]">Recent Stories</h3>
            <Link to="/stories" className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] no-underline">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <EnterpriseDataTable<DashboardRecentItem>
            skin="cms"
            columns={recentColumns}
            data={recent?.slice(0, 8) ?? []}
            loading={loading}
            emptyTitle="No recent content"
          />
        </div>

        {/* Activity feed */}
        <div className="cms-card overflow-hidden">
          <div className="px-[18px] py-3.5 border-b border-[var(--lito-border)]">
            <h3 className="font-body text-[13px] font-medium text-[var(--text-muted)]">Recent Activity</h3>
          </div>
          <div className="py-2">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-[18px] py-[10px] flex gap-2.5">
                  <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            ) : recent?.length ? (
              recent.slice(0, 8).map((item: DashboardRecentItem) => (
                <div key={item.id} className="flex gap-2.5 px-[18px] py-[10px] border-b border-[rgba(217,210,199,0.3)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--lito-gold)] mt-[5px] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-xs text-[var(--text-primary)] truncate">
                      {item.title}
                    </div>
                    <div className="font-body text-[10px] text-[var(--text-muted)] mt-0.5 flex items-center gap-[3px]">
                      <Clock size={9} /> {formatDate(item.updated_at)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-[18px] py-8 text-center text-xs text-[var(--text-muted)]">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
