import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, Trash2, Pencil, Globe } from 'lucide-react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { StatusBadge } from '@/components/atoms/StatusBadge'
import type { Page, PageStatus } from '@/services/pages.service'
import type { PageListMeta } from '@/services/pages.service'
import { PageSectionsManager } from './PageSectionsManager'

interface Filter {
  status: PageStatus | ''
  search: string
  offset: number
}

interface Props {
  pages: Page[]
  /** Full flat list of all pages — used for parent picker and conflict-aware reorder */
  allPages: Page[]
  meta: PageListMeta
  isLoading: boolean
  filter: Filter
  setFilter: (patch: Partial<Filter>) => void
  onDelete: (id: string) => void
  onToggleMenu: (id: string, is_in_menu: boolean) => void
  onToggleHeader: (id: string, is_header: boolean) => void
  onToggleFooter: (id: string, is_footer: boolean) => void
  onToggleMobileMenu: (id: string, is_mobile_menu: boolean) => void
  onUpdateMenuLabel: (id: string, label: string | null) => void
  onUpdateParentId: (id: string, parent_id: string | null) => void
  /** Receives all pages so container can compute conflict-free reorder */
  onUpdateSortOrder: (id: string, order: number, allPages: Page[]) => void
}

const STATUS_OPTS: { value: PageStatus | ''; label: string }[] = [
  { value: '',          label: 'All statuses' },
  { value: 'active',    label: 'Active' },
  { value: 'draft',     label: 'Draft' },
  { value: 'inactive',  label: 'Inactive' },
  { value: 'archived',  label: 'Archived' },
]

// Small inline toggle — no external dependency
function MenuToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      title={checked ? 'Remove from menu' : 'Add to menu'}
      style={{
        display: 'inline-flex', alignItems: 'center',
        width: 32, height: 18, borderRadius: 9,
        border: 'none', cursor: 'pointer', padding: 0,
        background: checked ? 'var(--lito-teal)' : 'var(--lito-border)',
        transition: 'background 150ms',
        position: 'relative', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        left: checked ? 16 : 2,
        width: 14, height: 14,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 150ms',
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
      }} />
    </button>
  )
}

const HEADERS = ['#', 'Title / Menu Label', 'Slug', 'Parent', 'Template', 'Status', 'In Menu', 'Header', 'Footer', 'Mobile', '']

export function PagesPageView({
  pages, allPages, meta, isLoading, filter, setFilter,
  onDelete, onToggleMenu, onToggleHeader, onToggleFooter, onToggleMobileMenu,
  onUpdateMenuLabel, onUpdateParentId, onUpdateSortOrder,
}: Props) {
  const [sectionManagerPage, setSectionManagerPage] = useState<{ id: string; title: string } | null>(null)

  // Build a lookup: id -> display label for the parent picker
  const pageLabel = (p: Page) => p.title ?? p.slug

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>
            Pages
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {meta.total} page{meta.total !== 1 ? 's' : ''} total · Toggle placement flags to control navigation
          </p>
        </div>
        <Link to="/pages/new" className="cms-btn cms-btn-primary">
          <Plus size={14} />
          New Page
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          type="search"
          placeholder="Search pages…"
          value={filter.search}
          onChange={(e) => setFilter({ search: e.target.value, offset: 0 })}
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
          onChange={(e) => setFilter({ status: e.target.value as PageStatus | '', offset: 0 })}
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
          <Link to="/pages/new" className="cms-btn cms-btn-primary">
            Create your first page
          </Link>
        </div>
      ) : (
        <div style={{
          background: 'var(--cms-card-bg)',
          border: '1px solid var(--lito-border)',
          borderRadius: 12, overflow: 'auto',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lito-border)', background: 'var(--cms-header-bg)' }}>
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontFamily: 'var(--font-body)', fontSize: 11,
                      fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.06em', color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => {
                // Eligible parents = all pages that are not this page and not descendants of this page
                // Simple check: exclude self; full cycle-prevention is handled by not allowing circular on backend
                const eligibleParents = allPages.filter((p) => p.id !== page.id)

                return (
                  <tr
                    key={page.id}
                    style={{ borderBottom: '1px solid var(--lito-border)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--cms-header-bg)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}
                  >
                    {/* Sort order — conflict-aware */}
                    <td style={{ padding: '12px 14px', width: 48 }}>
                      <input
                        key={`sort-${page.id}-${page.sort_order}`}
                        type="number"
                        defaultValue={page.sort_order ?? 0}
                        min={0}
                        step={1}
                        title={`Sort order (current: ${page.sort_order}). Entering an existing value shifts other pages automatically.`}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10)
                          if (!isNaN(val) && val !== page.sort_order) {
                            onUpdateSortOrder(page.id, val, allPages)
                          }
                        }}
                        style={{
                          width: 44, fontFamily: 'monospace', fontSize: 12,
                          padding: '3px 6px', textAlign: 'center',
                          background: 'var(--cms-header-bg)',
                          border: '1px solid var(--lito-border)',
                          borderRadius: 4, color: 'var(--text-muted)', outline: 'none',
                        }}
                      />
                    </td>

                    {/* Title + menu_label inline edit */}
                    <td style={{ padding: '12px 14px', minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {page.is_in_menu && (
                          <Globe size={12} style={{ color: 'var(--lito-teal)', flexShrink: 0 }} aria-label="In navigation menu" />
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            {/* Hierarchy indentation: 16px per level */}
                            {(page.level ?? 0) > 0 && (
                              <span style={{ display: 'inline-block', width: (page.level ?? 1) * 16, flexShrink: 0 }}>
                                <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11 }}>└ </span>
                              </span>
                            )}
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                              {page.title ?? page.slug}
                            </span>
                            {page.parent_id == null && (
                              <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(20,184,166,0.12)', color: 'var(--lito-teal)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                                root
                              </span>
                            )}
                          </div>
                          {page.is_in_menu && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                              <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>Menu:</span>
                              <input
                                type="text"
                                placeholder={page.title ?? page.slug}
                                defaultValue={page.menu_label ?? ''}
                                title="Menu label (shown in nav). Leave blank to use page title."
                                onBlur={(e) => {
                                  const val = e.target.value.trim() || null
                                  if (val !== page.menu_label) onUpdateMenuLabel(page.id, val)
                                }}
                                style={{
                                  fontFamily: 'var(--font-body)', fontSize: 11,
                                  padding: '2px 6px', width: 110,
                                  background: 'var(--cms-header-bg)',
                                  border: '1px solid var(--lito-border)',
                                  borderRadius: 4, color: 'var(--text-primary)', outline: 'none',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td style={{ padding: '12px 14px' }}>
                      <code style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                        /{page.slug}
                      </code>
                    </td>

                    {/* Parent picker */}
                    <td style={{ padding: '12px 14px', minWidth: 130 }}>
                      <select
                        value={page.parent_id ?? ''}
                        onChange={(e) => {
                          const val = e.target.value || null
                          if (val !== page.parent_id) onUpdateParentId(page.id, val)
                        }}
                        title="Parent page (makes this a child menu item)"
                        style={{
                          fontFamily: 'var(--font-body)', fontSize: 12,
                          padding: '3px 6px',
                          background: 'var(--cms-header-bg)',
                          border: '1px solid var(--lito-border)',
                          borderRadius: 4, color: 'var(--text-muted)',
                          outline: 'none', cursor: 'pointer',
                          maxWidth: 130,
                        }}
                      >
                        <option value="">— root —</option>
                        {eligibleParents.map((p) => (
                          <option key={p.id} value={p.id}>
                            {pageLabel(p)}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Template */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {page.template || 'default'}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 14px' }}>
                      <StatusBadge status={page.status} />
                    </td>

                    {/* Toggles */}
                    <td style={{ padding: '12px 14px' }}>
                      <MenuToggle checked={page.is_in_menu} onChange={() => onToggleMenu(page.id, !page.is_in_menu)} />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <MenuToggle checked={page.is_header} onChange={() => onToggleHeader(page.id, !page.is_header)} />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <MenuToggle checked={page.is_footer} onChange={() => onToggleFooter(page.id, !page.is_footer)} />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <MenuToggle checked={page.is_mobile_menu} onChange={() => onToggleMobileMenu(page.id, !page.is_mobile_menu)} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <Link
                          to={`/pages/${page.id}/edit`}
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
                        </Link>
                        <button
                          type="button"
                          title="Manage sections"
                          onClick={() => setSectionManagerPage({ id: page.id, title: page.title ?? page.slug })}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '4px 8px', borderRadius: 5,
                            border: '1px solid var(--lito-border)',
                            background: 'transparent', cursor: 'pointer',
                            fontFamily: 'var(--font-body)', fontSize: 11,
                            color: 'var(--text-secondary)',
                            transition: 'color 150ms, border-color 150ms',
                          }}
                          onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLElement).style.color = 'var(--lito-teal)'
                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--lito-teal)'
                          }}
                          onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--lito-border)'
                          }}
                        >
                          Sections
                        </button>
                        <button
                          type="button"
                          onClick={() => { if (confirm(`Delete "${page.title ?? page.slug}"?`)) onDelete(page.id) }}
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Section Manager modal */}
      {sectionManagerPage && (
        <PageSectionsManager
          pageId={sectionManagerPage.id}
          pageTitle={sectionManagerPage.title}
          onClose={() => setSectionManagerPage(null)}
        />
      )}
    </div>
  )
}
