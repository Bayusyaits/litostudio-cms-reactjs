import { FileText, Globe, Image, Users, BookOpen, ArrowRight, Clock } from 'lucide-react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Link } from 'react-router-dom'
import type { DashboardStats, DashboardRecentItem } from '@/services/org.service'
import type { Organization, Site } from '@/types/auth.types'
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

function toIndoDate(date: Date) {
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
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
    <div className="cms-card" style={{ padding: '20px 24px', flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          {loading ? (
            <>
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
            </>
          )}
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
    <Link to={to} style={{ textDecoration: 'none', flex: 1, minWidth: 140 }}>
      <div className="cms-card" style={{ padding: '16px 18px', cursor: 'pointer', transition: 'border-color 150ms, box-shadow 150ms' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--lito-gold)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--lito-border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
      >
        <div style={{ width: 34, height: 34, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
      </div>
    </Link>
  )
}

function RecentRow({ item }: { item: DashboardRecentItem }) {
  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 28, borderRadius: 3, background: 'var(--lito-cream-alt)', flexShrink: 0 }} />
          <div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{item.title}</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', marginLeft: 6, textTransform: 'capitalize' }}>{item.type}</span>
          </div>
        </div>
      </td>
      <td><StatusBadge status={item.status} /></td>
      <td>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
          {formatDate(item.updated_at)}
        </span>
      </td>
    </tr>
  )
}

export function DashboardPageView({ stats, recent, loading, org: _org, site: _site }: Props) {
  const { user } = useAuthStore()
  const today = toIndoDate(new Date())
  const firstName = user?.full_name?.split(' ')[0] ?? 'Admin'

  const statCards: StatCardProps[] = [
    { icon: FileText, iconBg: 'rgba(26,74,90,0.10)',  iconColor: 'var(--lito-teal)',       label: 'Pages',       value: stats?.pages ?? 0,       loading },
    { icon: Globe,    iconBg: 'rgba(212,168,83,0.12)', iconColor: 'var(--lito-gold)',       label: 'Sites',       value: stats?.sites ?? 0,       loading },
    { icon: Image,    iconBg: 'rgba(212,168,83,0.08)', iconColor: 'var(--lito-gold-deep)', label: 'Media Files', value: stats?.media ?? 0,       loading },
    { icon: Users,    iconBg: 'rgba(17,17,17,0.06)',   iconColor: 'var(--text-muted)',      label: 'Deployments', value: stats?.deployments ?? 0, loading },
  ]

  return (
    <div className="cms-page" style={{ padding: 32, overflowY: 'auto', height: '100%', background: 'var(--cms-main-bg)' }}>
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.15 }}>
          Selamat datang, {firstName}.
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{today}</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {statCards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 12 }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <QuickActionCard icon={FileText}  iconBg="rgba(26,74,90,0.10)"   iconColor="var(--lito-teal)" title="New Story"       desc="Write & publish a story" to="/stories/new" />
          <QuickActionCard icon={Image}     iconBg="rgba(212,168,83,0.12)" iconColor="var(--lito-gold)" title="Upload Media"    desc="Add photos & videos"     to="/media" />
          <QuickActionCard icon={Globe}     iconBg="rgba(212,168,83,0.08)" iconColor="var(--lito-gold-deep)" title="Navigation" desc="Edit site menus"          to="/navigation" />
          <QuickActionCard icon={BookOpen}  iconBg="rgba(17,17,17,0.06)"   iconColor="var(--text-muted)" title="SEO Overview"  desc="Check search performance" to="/seo" />
        </div>
      </div>

      {/* 2-col bottom */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 308px', gap: 20, alignItems: 'start' }}>
        {/* Recent stories */}
        <div className="cms-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--lito-border)' }}>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Recent Stories</h3>
            <Link to="/stories" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>
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
                  <td colSpan={3} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
                    No recent content
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Activity feed */}
        <div className="cms-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--lito-border)' }}>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Recent Activity</h3>
          </div>
          <div style={{ padding: '8px 0' }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ padding: '10px 18px', display: 'flex', gap: 10 }}>
                  <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
                  <div style={{ flex: 1 }}>
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            ) : recent?.length ? (
              recent.slice(0, 8).map((item: DashboardRecentItem) => (
                <div key={item.id} style={{ display: 'flex', gap: 10, padding: '10px 18px', borderBottom: '1px solid rgba(217,210,199,0.3)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lito-gold)', marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={9} /> {formatDate(item.updated_at)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
