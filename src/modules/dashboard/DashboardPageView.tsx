import { FileText, Globe, Image, Link2, BookOpen, ArrowRight, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@litostudio/ui-cms'
import type { DashboardStats, DashboardRecentItem, Organization, Site } from '@litostudio/ui-cms'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/lib/utils'

interface Props {
  stats?: DashboardStats | null
  recent?: DashboardRecentItem[] | null
  loading: boolean
  siteName?: string
  org?: Organization
  site?: Site
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

function RecentRow({ item }: { item: DashboardRecentItem }) {
  return (
    <tr>
      <td>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-7 rounded-[3px] bg-[var(--lito-cream-alt)] shrink-0" />
          <div>
            <span className="font-body text-[13px] text-[var(--text-primary)] font-medium">{item.title}</span>
            <span className="font-body text-[10px] text-[var(--text-muted)] ml-1.5 capitalize">{item.type}</span>
          </div>
        </div>
      </td>
      <td><StatusBadge status={item.status} /></td>
      <td>
        <span className="font-body text-[11px] text-[var(--text-muted)]">
          {formatDate(item.updated_at)}
        </span>
      </td>
    </tr>
  )
}

export function DashboardPageView({ stats, recent, loading, org: _org, site: _site }: Props) {
  const { user } = useAuthStore()
  const today = toLocalDate(new Date())
  const firstName = user?.full_name?.split(' ')[0] ?? 'Admin'

  const statCards: StatCardProps[] = [
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
          <table className="cms-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton className="h-4 w-48" /></td>
                    <td><Skeleton className="h-4 w-20" /></td>
                    <td><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))
              ) : recent?.length ? (
                recent.slice(0, 8).map((s: DashboardRecentItem) => <RecentRow key={s.id} item={s} />)
              ) : (
                <tr>
                  <td colSpan={3} className="text-center p-8 text-[var(--text-muted)] text-[13px]">
                    No recent content
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
