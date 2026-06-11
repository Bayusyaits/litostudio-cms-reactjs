import { useState } from 'react'
import { Hash, Trash2, Plus } from 'lucide-react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { SearchInput } from '@/components/molecules/SearchInput'
import { EmptyState } from '@/components/molecules/EmptyState'
import type { Tag } from '@/services/taxonomy.service'

interface Props {
  tags: Tag[]
  total: number
  isLoading: boolean
  search: string
  onSearch: (v: string) => void
  onCreate: (name: string) => void
  creating: boolean
  createError: string | null
  onDelete: (id: string) => void
}

export function TagsPageView({ tags, total, isLoading, search, onSearch, onCreate, creating, createError, onDelete }: Props) {
  const [newTag, setNewTag] = useState('')

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTag.trim()) return
    onCreate(newTag.trim())
    setNewTag('')
  }

  return (
    <div className="cms-page" style={{ padding: 32, overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text-primary)' }}>Tags</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
          {total} {total === 1 ? 'tag' : 'tags'}
        </p>
      </div>

      {/* Add tag */}
      <div className="cms-card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, marginBottom: 12, color: 'var(--text-primary)' }}>Add tag</h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8 }}>
          <input className="cms-input" style={{ height: 34, flex: 1, maxWidth: 320 }}
            value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Tag name" required />
          <button type="submit" disabled={creating || !newTag.trim()} className="cms-btn cms-btn-primary cms-btn-sm">
            <Plus size={13} /> {creating ? 'Adding…' : 'Add'}
          </button>
        </form>
        {createError && <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 4, background: 'var(--cms-danger-bg)', fontSize: 12, color: 'var(--cms-danger)' }}>{createError}</div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <SearchInput value={search} onChange={onSearch} placeholder="Search tags…" className="w-64" />
      </div>

      {/* Tag cloud */}
      {isLoading ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-full" style={{ width: `${60 + (i % 4) * 20}px` }} />)}
        </div>
      ) : tags.length === 0 ? (
        <EmptyState icon={Hash} title="No tags" description="Add your first tag above" />
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tags.map(tag => (
            <div key={tag.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px 5px 12px',
              borderRadius: 999,
              border: '1px solid var(--lito-border)',
              background: 'var(--cms-card-bg)',
              fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)',
            }}>
              <Hash size={11} style={{ color: 'var(--text-muted)' }} />
              {tag.name}
              {tag.post_count > 0 && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(17,17,17,0.05)', borderRadius: 999, padding: '1px 6px' }}>
                  {tag.post_count}
                </span>
              )}
              <button type="button" onClick={() => onDelete(tag.id)} aria-label={`Remove ${tag.name}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex', borderRadius: 999, marginLeft: 2 }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--cms-danger)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
