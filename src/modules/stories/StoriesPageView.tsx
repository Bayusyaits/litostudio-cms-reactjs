import { useState } from 'react'
import { Plus, MoreHorizontal, Pencil, FileText, LayoutTemplate } from 'lucide-react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Link } from 'react-router-dom'
import { SearchInput } from '@/components/molecules/SearchInput'
import { EmptyState } from '@/components/molecules/EmptyState'
import { formatDate } from '@/lib/utils'
import { getTitle } from '@/types/content.types'
import type { Story } from '@/types/content.types'
import type { ContentStatus } from '@/types/api.types'
import { AppImage, AppImageThumb } from '@/components/atoms/AppImage'

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
  onOpenEditor: (id: string) => void
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
  if (!author) return <span className="text-xs text-[var(--text-muted)]">—</span>
  const initials = (author.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="flex items-center gap-[7px]">
      {author.avatar_url ? (
        <AppImageThumb src={author.avatar_url} alt="" size={22} radius="50%" skeleton={false} />
      ) : (
        <div className="w-[22px] h-[22px] rounded-full bg-[rgba(212,168,83,0.12)] flex items-center justify-center text-[9px] font-semibold text-[var(--lito-gold-deep)]">
          {initials}
        </div>
      )}
      <span className="font-body text-xs text-[var(--text-primary)]">{author.name}</span>
    </div>
  )
}

function ActionMenu({ onEdit, onOpenEditor, onDelete }: { onEdit: () => void; onOpenEditor: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const itemCls = 'flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none text-xs cursor-pointer text-[var(--text-primary)] text-left hover:bg-[var(--lito-cream-alt)]'
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="More actions"
        onClick={() => setOpen(v => !v)}
        className="bg-transparent border-none cursor-pointer p-1 text-[var(--text-muted)] flex rounded hover:bg-[var(--lito-cream-alt)]"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-md shadow-[var(--shadow-md)] overflow-hidden w-[130px]">
          <button type="button" onClick={() => { setOpen(false); onEdit() }} className={itemCls}>
            <Pencil size={12} /> Edit fields
          </button>
          <button type="button" onClick={() => { setOpen(false); onOpenEditor() }} className={itemCls}>
            <LayoutTemplate size={12} /> Open in editor
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete() }}
            className="flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none text-xs cursor-pointer text-[var(--cms-danger)] text-left hover:bg-[var(--cms-danger-bg)]"
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
  page, totalPages, onPage, onEdit, onOpenEditor, onDelete, statusCounts,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabStatus>('all')

  const filtered = activeTab === 'all' ? stories : stories.filter(s => s.status === activeTab)

  return (
    <div className="cms-page flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div className="px-7 pt-6 pb-0 bg-[var(--cms-main-bg)] shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-[28px] font-normal text-[var(--text-muted)]">Stories</h1>
            <p className="font-body text-xs text-[var(--text-muted)] mt-[3px]">
              Manage and publish travel stories
            </p>
          </div>
          <Link to="/stories/new" className="cms-btn cms-btn-primary">
            <Plus size={14} /> New Story
          </Link>
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-3 mb-3">
          <SearchInput value={search} onChange={onSearch} placeholder="Search stories…" className="w-64" />
        </div>

        {/* Status tabs */}
        <div className="flex border-b border-[var(--lito-border)]">
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
                  <span className={`ml-[5px] px-[5px] py-[1px] rounded-full text-[10px] font-medium ${activeTab === tab.key ? 'bg-[var(--lito-ink)] text-[var(--lito-cream)]' : 'bg-[var(--lito-cream-alt)] text-[var(--text-muted)]'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table area */}
      <div className="flex-1 overflow-y-auto px-7 pb-6">
        <div className="cms-card mt-4 overflow-hidden">
          <table className="cms-table">
            <thead>
              <tr>
                <th className="w-5 pr-0">
                  <input type="checkbox" aria-label="Select all" />
                </th>
                <th>Title</th>
                <th>Category</th>
                <th>Author</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Views</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton className="h-4 w-4" /></td>
                    <td>
                      <div className="flex items-center gap-[10px]">
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
                    <td className="pr-0">
                      <input type="checkbox" aria-label={`Select "${getTitle(story)}"`} />
                    </td>
                    <td>
                      <div className="flex items-center gap-[10px]">
                        {story.cover_image ? (
                          <AppImage src={story.cover_image} alt="" objectFit="cover" skeleton={false} wrapperStyle={{ width: 54, height: 38, flexShrink: 0, borderRadius: 3 }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <div className="w-[54px] h-[38px] rounded-[3px] bg-[var(--lito-cream-alt)] shrink-0" />
                        )}
                        <div>
                          <div className="font-body text-[13px] font-medium text-[var(--text-muted)]">{getTitle(story)}</div>
                          <div className="font-body text-[11px] text-[var(--text-muted)]">{story.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {story.category ? (
                        <span className="px-[9px] py-[3px] rounded-full text-[11px] font-medium bg-[rgba(26,74,90,0.08)] text-[var(--lito-teal)] font-body">
                          {story.category}
                        </span>
                      ) : <span className="text-xs text-[var(--text-muted)]">—</span>}
                    </td>
                    <td>
                      <AuthorCell author={null} />
                    </td>
                    <td>
                      <span className="font-body text-xs text-[var(--text-muted)]">
                        {story.published_at ? formatDate(story.published_at) : formatDate(story.updated_at)}
                      </span>
                    </td>
                    <td><StatusBadge status={story.status} /></td>
                    <td className="text-right">
                      <span className="font-display text-[15px] text-[var(--text-primary)]">
                        {story.view_count ?? '—'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          aria-label={`Edit "${getTitle(story)}"`}
                          onClick={() => onEdit(story.id)}
                          className="bg-transparent border-none cursor-pointer p-1 text-[var(--text-muted)] flex rounded hover:bg-[var(--lito-cream-alt)]"
                        >
                          <Pencil size={13} />
                        </button>
                        <ActionMenu onEdit={() => onEdit(story.id)} onOpenEditor={() => onOpenEditor(story.id)} onDelete={() => onDelete(story.id)} />
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
          <div className="flex justify-center gap-[6px] mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p)}
                className={`w-8 h-8 rounded border text-xs cursor-pointer transition-all duration-150 ${p === page ? 'border-[var(--lito-ink)] bg-[var(--lito-ink)] text-[var(--lito-cream)]' : 'border-[var(--lito-border)] bg-transparent text-[var(--text-muted)]'}`}
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
