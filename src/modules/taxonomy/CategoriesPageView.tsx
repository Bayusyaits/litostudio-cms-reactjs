import { useState } from 'react'
import { Tag, Trash2, Plus, FolderOpen } from 'lucide-react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { SearchInput } from '@/components/molecules/SearchInput'
import { EmptyState } from '@/components/molecules/EmptyState'
import type { Category, CategoryCreateRequest } from '@/services/taxonomy.service'

interface Props {
  categories: Category[]
  total: number
  isLoading: boolean
  search: string
  onSearch: (v: string) => void
  onCreate: (payload: Omit<CategoryCreateRequest, 'site_id'>) => void
  creating: boolean
  createError: string | null
  onDelete: (id: string) => void
}

function CategoryRow({ cat, onDelete }: { cat: Category; onDelete: (id: string) => void }) {
  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderOpen size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)' }}>
            {cat.translations[0]?.name ?? cat.slug}
          </span>
        </div>
      </td>
      <td>
        <code style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', background: 'rgba(17,17,17,0.04)', padding: '2px 6px', borderRadius: 3 }}>
          {cat.slug}
        </code>
      </td>
      <td>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {cat.parent_id ? 'Sub-category' : 'Top-level'}
        </span>
      </td>
      <td>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
          {new Date(cat.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </td>
      <td>
        <button type="button" onClick={() => onDelete(cat.id)}
          aria-label="Delete category"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--cms-danger)'; e.currentTarget.style.background = 'var(--cms-danger-bg)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  )
}

function AddCategoryForm({ onCreate, creating, error }: {
  onCreate: (payload: Omit<CategoryCreateRequest, 'site_id'>) => void
  creating: boolean
  error: string | null
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return
    onCreate({ translation: { locale: 'id', name: name.trim() }, slug: slug.trim() })
    setName(''); setSlug('')
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <label className="cms-label">Name</label>
        <input className="cms-input" style={{ height: 34 }} value={name}
          onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')) }}
          placeholder="Category name" required />
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <label className="cms-label">Slug</label>
        <input className="cms-input" style={{ height: 34 }} value={slug}
          onChange={e => setSlug(e.target.value)}
          placeholder="category-slug" required />
      </div>
      <button type="submit" disabled={creating || !name.trim()} className="cms-btn cms-btn-primary cms-btn-sm">
        <Plus size={13} /> {creating ? 'Adding…' : 'Add'}
      </button>
      {error && <div style={{ width: '100%', padding: '6px 10px', borderRadius: 4, background: 'var(--cms-danger-bg)', fontSize: 12, color: 'var(--cms-danger)' }}>{error}</div>}
    </form>
  )
}

export function CategoriesPageView({ categories, total, isLoading, search, onSearch, onCreate, creating, createError, onDelete }: Props) {
  return (
    <div className="cms-page" style={{ padding: 32, overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text-primary)' }}>Categories</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
          {total} {total === 1 ? 'category' : 'categories'} across all content types
        </p>
      </div>

      <div className="cms-card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, marginBottom: 12, color: 'var(--text-primary)' }}>Add category</h2>
        <AddCategoryForm onCreate={onCreate} creating={creating} error={createError} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SearchInput value={search} onChange={onSearch} placeholder="Search categories…" className="w-64" />
      </div>

      <div className="cms-card" style={{ overflow: 'hidden' }}>
        <table className="cms-table">
          <thead><tr><th>Name</th><th>Slug</th><th>Type</th><th>Created</th><th style={{ width: 40 }} /></tr></thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td><Skeleton className="h-4 w-40" /></td><td><Skeleton className="h-4 w-24" /></td><td><Skeleton className="h-4 w-20" /></td><td><Skeleton className="h-4 w-24" /></td><td /></tr>
            )) : categories.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon={Tag} title="No categories" description="Add your first category above" /></td></tr>
            ) : categories.map(cat => <CategoryRow key={cat.id} cat={cat} onDelete={onDelete} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
