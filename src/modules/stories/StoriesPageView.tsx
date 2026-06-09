import { useState } from 'react'
import { Plus, MoreHorizontal, Pencil, FileText } from 'lucide-react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Link } from 'react-router-dom'
import { SearchInput } from '@/components/molecules/SearchInput'
import { EmptyState } from '@/components/molecules/EmptyState'
import { formatDate } from '@/lib/utils'
import { getTitle } from '@/types/content.types'
import type { Story } from '@/types/content.types'
import type { ContentStatus } from '@/types/api.types'

type TabStatus = 'all' | ContentStatus

interface StatusCounts { all: number; published: number; draft: number; scheduled: number; archived: number }

interface Props {
  stories: Story[]
  isLoading: boolean
  search: string
  onSearch: (v: string) => void
  page: number
  totalPages: number
  onPage: (p: number) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  statusCounts?: StatusCounts
}

const TABS: { key: TabStatus; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft',     label: 'Draft' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'archived',  label: 'Archived' },
]

function StatusBadge({ status }: { status: ContentStatus }) {
  const map: Record<ContentStatus, { label: string; fg: string; bg: string }> = {
    published: { label: 'Published', fg: 'var(--s-pub-fg)',   bg: 'var(--s-pub-bg)' },
    draft:     { label: 'Draft',     fg: 'var(--s-draft-fg)', bg: 'var(--s-draft-bg)' },
    scheduled: { label: 'Scheduled', fg: 'var(--s-sched-fg)', bg: 'var(--s-sched-bg)' },
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

function AuthorCell({ author }: { author?: { name?: string; avatar_url?: string } | null }) {
  if (!author) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
  const initials = (author.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      {author.avatar_url ? (
        <img src={author.avatar_url} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: 'rgba(212,168,83,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 600, color: 'var(--lito-gold-deep)',
        }}>{initials}</div>
      )}
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)' }}>{author.name}</span>
    </div>
  )
}

function ActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label="More actions"
        onClick={() => setOpen(v => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex', borderRadius: 4 }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--lito-cream-alt)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', zIndex: 50,
          background: 'var(--cms-card-bg)', border: '1px solid var(--lito-border)',
          borderRadius: 6, boxShadow: 'var(--shadow-md)',
          overflow: 'hidden', width: 130,
        }}>
          <button
            type="button"
            onClick={() => { setOpen(false); onEdit() }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--lito-cream-alt)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete() }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', color: 'var(--cms-danger)', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--cms-danger-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export function StoriesPageView({
  stories, isLoading, search, onSearch,
  page, totalPages, onPage, onEdit, onDelete, statusCounts,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabStatus>('all')

  const filtered = activeTab === 'all' ? stories : stories.filter(s => s.status === activeTab)

  return (
    <div className="cms-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{ padding: '24px 28px 0', background: 'var(--cms-main-bg)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text-primary)' }}>Stories</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              Manage and publish travel stories
            </p>
          </div>
          <Link
            to="/stories/new"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 999,
              background: 'var(--lito-ink)', color: 'var(--lito-cream)',
              fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)',
              textDecoration: 'none', transition: 'background 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2B2B2B')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--lito-ink)')}
          >
            <Plus size={14} /> New Story
          </Link>
        </div>

        {/* Filters row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <SearchInput value={search} onChange={onSearch} placeholder="Search stories…" className="w-64" />
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--lito-border)', gap: 0 }}>
          {TABS.map(tab => {
            const count = statusCounts?.[tab.key]
            return (
              <button
                key={tab.key}
                type="button"
                className={`cms-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {count !== undefined && (
                  <span style={{
                    marginLeft: 5, padding: '1px 5px',
                    borderRadius: 999, fontSize: 10, fontWeight: 500,
                    background: activeTab === tab.key ? 'var(--lito-ink)' : 'var(--lito-cream-alt)',
                    color: activeTab === tab.key ? 'var(--lito-cream)' : 'var(--text-muted)',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 24px' }}>
        <div className="cms-card" style={{ marginTop: 16, overflow: 'hidden' }}>
          <table className="cms-table">
            <thead>
              <tr>
                <th style={{ width: 20, paddingRight: 0 }}>
                  <input type="checkbox" aria-label="Select all" />
                </th>
                <th>Title</th>
                <th>Category</th>
                <th>Author</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Views</th>
                <th style={{ width: 48 }} />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton className="h-4 w-4" /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Skeleton className="h-10 w-14 rounded" />
                        <div><Skeleton className="h-3.5 w-40 mb-1" /><Skeleton className="h-2.5 w-28" /></div>
                      </div>
                    </td>
                    <td><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td><Skeleton className="h-4 w-28" /></td>
                    <td><Skeleton className="h-4 w-20" /></td>
                    <td><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td><Skeleton className="h-4 w-12 ml-auto" /></td>
                    <td />
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState icon={FileText} title="No stories found" description="Create your first story to get started" />
                  </td>
                </tr>
              ) : (
                filtered.map(story => (
                  <tr key={story.id}>
                    <td style={{ paddingRight: 0 }}>
                      <input type="checkbox" aria-label={`Select "${getTitle(story)}"`} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {story.cover_image ? (
                          <img src={story.cover_image} alt="" style={{ width: 54, height: 38, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 54, height: 38, borderRadius: 3, background: 'var(--lito-cream-alt)', flexShrink: 0 }} />
                        )}
                        <div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{getTitle(story)}</div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>{story.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {story.category ? (
                        <span style={{
                          padding: '3px 9px', borderRadius: 999,
                          fontSize: 11, fontWeight: 500,
                          background: 'rgba(26,74,90,0.08)', color: 'var(--lito-teal)',
                        }}>
                          {story.category}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      <AuthorCell author={null} />
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
                        {story.published_at ? formatDate(story.published_at) : formatDate(story.updated_at)}
                      </span>
                    </td>
                    <td><StatusBadge status={story.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--text-primary)' }}>
                        {story.view_count ?? '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          aria-label={`Edit "${getTitle(story)}"`}
                          onClick={() => onEdit(story.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex', borderRadius: 4 }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--lito-cream-alt)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <Pencil size={13} />
                        </button>
                        <ActionMenu onEdit={() => onEdit(story.id)} onDelete={() => onDelete(story.id)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p)}
                style={{
                  width: 32, height: 32, borderRadius: 4, border: '1px solid',
                  borderColor: p === page ? 'var(--lito-ink)' : 'var(--lito-border)',
                  background: p === page ? 'var(--lito-ink)' : 'transparent',
                  color: p === page ? 'var(--lito-cream)' : 'var(--text-muted)',
                  fontSize: 12, cursor: 'pointer', transition: 'all 150ms',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
