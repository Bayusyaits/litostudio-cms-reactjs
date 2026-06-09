import { Plus, FileText, Trash2, Pencil } from 'lucide-react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { StatusBadge } from '@/components/atoms/StatusBadge'
import type { Page, PageStatus } from '@/services/pages.service'
import type { PaginationMeta } from '@/types/api.types'

interface Filter {
  status: PageStatus | ''
  search: string
  page: number
}

interface Props {
  pages: Page[]
  meta: PaginationMeta
  isLoading: boolean
  filter: Filter
  setFilter: (patch: Partial<Filter>) => void
  onDelete: (id: string) => void
}

const STATUS_OPTS: { value: PageStatus | ''; label: string }[] = [
  { value: '',            label: 'All statuses' },
  { value: 'published',  label: 'Published' },
  { value: 'draft',      label: 'Draft' },
  { value: 'scheduled',  label: 'Scheduled' },
  { value: 'archived',   label: 'Archived' },
]

export function PagesPageView({ pages, meta, isLoading, filter, setFilter, onDelete }: Props) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>
            Pages
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {meta.total} page{meta.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <a
          href="/pages/new"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px',
            background: 'var(--lito-ink)', color: 'var(--lito-cream)',
            border: 'none', borderRadius: 8,
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
            textDecoration: 'none', cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          New Page
        </a>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          type="search"
          placeholder="Search pages…"
          value={filter.search}
          onChange={(e) => setFilter({ search: e.target.value, page: 1 })}
          style={{
            flex: 1,
            fontFamily: 'var(--font-body)', fontSize: 13,
            padding: '7px 12px',
            background: 'var(--cms-card-bg)',
            border: '1px solid var(--lito-border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <select
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value as PageStatus | '', page: 1 })}
          style={{
            fontFamily: 'var(--font-body)', fontSize: 13,
            padding: '7px 12px',
            background: 'var(--cms-card-bg)',
            border: '1px solid var(--lito-border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {STATUS_OPTS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Skeleton lines={6} />
      ) : pages.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 12, padding: '60px 0',
        }}>
          <FileText size={36} style={{ color: 'var(--lito-border)' }} />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>
            No pages found
          </p>
          <a
            href="/pages/new"
            style={{
              padding: '7px 16px',
              background: 'var(--lito-ink)', color: 'var(--lito-cream)',
              borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-body)',
              textDecoration: 'none',
            }}
          >
            Create your first page
          </a>
        </div>
      ) : (
        <div style={{
          background: 'var(--cms-card-bg)',
          border: '1px solid var(--lito-border)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lito-border)', background: 'var(--cms-header-bg)' }}>
                {['Title', 'Slug', 'Template', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontFamily: 'var(--font-body)', fontSize: 11,
                      fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.06em', color: 'var(--text-muted)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr
                  key={page.id}
                  style={{ borderBottom: '1px solid var(--lito-border)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--cms-header-bg)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {page.title}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <code style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                      /{page.slug}
                    </code>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {page.template || 'default'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={page.status} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <a
                        href={`/pages/${page.id}/edit`}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, borderRadius: 6,
                          border: '1px solid var(--lito-border)',
                          color: 'var(--text-muted)', cursor: 'pointer',
                          textDecoration: 'none',
                        }}
                        title="Edit"
                      >
                        <Pencil size={12} />
                      </a>
                      <button
                        type="button"
                        onClick={() => { if (confirm(`Delete "${page.title}"?`)) onDelete(page.id) }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, borderRadius: 6,
                          border: '1px solid var(--lito-border)',
                          background: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                        }}
                        title="Delete"
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#A33028'; e.currentTarget.style.borderColor = '#A33028' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--lito-border)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
