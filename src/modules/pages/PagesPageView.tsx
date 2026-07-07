import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, Trash2, Pencil, Globe } from 'lucide-react'
import { Skeleton, StatusBadge, useTemplateManifest } from '@litostudio/ui-cms'
import type { Page, PageStatus, PageListMeta } from '@litostudio/ui-cms'
import { PageSectionsManager } from './PageSectionsManager'

interface Filter {
  status: PageStatus | ''
  search: string
  offset: number
}

interface Props {
  pages: Page[]
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
  onUpdateSortOrder: (id: string, order: number, allPages: Page[]) => void
}

const STATUS_OPTS: { value: PageStatus | ''; label: string }[] = [
  { value: '',          label: 'All statuses' },
  { value: 'active',    label: 'Active' },
  { value: 'draft',     label: 'Draft' },
  { value: 'inactive',  label: 'Inactive' },
  { value: 'archived',  label: 'Archived' },
]

function MenuToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      title={checked ? 'Remove from menu' : 'Add to menu'}
      className={`inline-flex items-center w-8 h-[18px] rounded-[9px] border-none cursor-pointer p-0 relative shrink-0 transition-[background] duration-150 ${checked ? 'bg-[var(--lito-teal)]' : 'bg-[var(--lito-border)]'}`}
    >
      {/* left is dynamic — keep as style */}
      <span
        className="absolute w-[14px] h-[14px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-[left] duration-150"
        style={{ left: checked ? 16 : 2 }}
      />
    </button>
  )
}

const HEADERS = ['#', 'Title / Menu Label', 'Slug', 'Parent', 'Template', 'Status', 'In Menu', 'Header', 'Footer', 'Mobile', '']

export function PagesPageView({
  pages, allPages, meta, isLoading, filter, setFilter,
  onDelete, onToggleMenu, onToggleHeader, onToggleFooter, onToggleMobileMenu,
  onUpdateMenuLabel, onUpdateParentId, onUpdateSortOrder,
}: Props) {
  const [sectionManagerPage, setSectionManagerPage] = useState<{ id: string; title: string; slug: string } | null>(null)
  const { templateSlug } = useTemplateManifest()

  // Human-readable display names keyed by template slug.
  // Matches the names shown on the Themes page so users see consistent labels.
  const TEMPLATE_LABELS: Record<string, string> = {
    lito:    'Lito Studio',
    fashion: 'Lito Fashion',
    beauty:  'Lito Beauty',
  }

  // Map normalised template slug → display label
  const templateName = (slug: string | null | undefined): string => {
    if (!slug) return 'Default'
    return TEMPLATE_LABELS[slug] ?? slug
  }

  const pageLabel = (p: Page) => p.title ?? p.slug

  return (
    <div className="flex-1 overflow-y-auto px-7 py-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="font-display text-[22px] font-semibold text-[var(--text-primary)]">Pages</h1>
          <p className="font-body text-[13px] text-[var(--text-muted)] mt-0.5">
            {meta.total} page{meta.total !== 1 ? 's' : ''} total · Toggle placement flags to control navigation
          </p>
        </div>
        <Link to="/pages/new" className="cms-btn cms-btn-primary">
          <Plus size={14} />
          New Page
        </Link>
      </div>

      <div className="flex gap-[10px] mb-4">
        <input
          type="search"
          placeholder="Search pages…"
          value={filter.search}
          onChange={(e) => setFilter({ search: e.target.value, offset: 0 })}
          className="flex-1 font-body text-[13px] px-3 py-[7px] bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-lg text-[var(--text-primary)] outline-none"
        />
        <select
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value as PageStatus | '', offset: 0 })}
          className="font-body text-[13px] px-3 py-[7px] bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-lg text-[var(--text-primary)] cursor-pointer outline-none"
        >
          {STATUS_OPTS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Skeleton lines={6} />
      ) : pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-[60px]">
          <FileText size={36} className="text-[var(--lito-border)]" />
          <p className="font-body text-[14px] text-[var(--text-muted)]">No pages found</p>
          <Link to="/pages/new" className="cms-btn cms-btn-primary">Create your first page</Link>
        </div>
      ) : (
        <div className="bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-xl overflow-auto">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-[var(--lito-border)] bg-[var(--cms-header-bg)]">
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    className="px-[14px] py-[10px] text-left font-body text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => {
                const eligibleParents = allPages.filter((p) => p.id !== page.id)
                return (
                  <tr
                    key={page.id}
                    className="border-b border-[var(--lito-border)] hover:bg-[var(--cms-header-bg)]"
                  >
                    {/* Sort order */}
                    <td className="px-[14px] py-3 w-12">
                      <input
                        key={`sort-${page.id}-${page.sort_order}`}
                        type="number"
                        defaultValue={page.sort_order ?? 0}
                        min={0}
                        step={1}
                        title={`Sort order (current: ${page.sort_order})`}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10)
                          if (!isNaN(val) && val !== page.sort_order) {
                            onUpdateSortOrder(page.id, val, allPages)
                          }
                        }}
                        className="w-11 font-mono text-xs px-[6px] py-[3px] text-center bg-[var(--cms-header-bg)] border border-[var(--lito-border)] rounded text-[var(--text-muted)] outline-none"
                      />
                    </td>

                    {/* Title + menu_label */}
                    <td className="px-[14px] py-3 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        {page.is_in_menu && (
                          <Globe size={12} className="text-[var(--lito-teal)] shrink-0" aria-label="In navigation menu" />
                        )}
                        <div>
                          <div className="flex items-center gap-[6px] flex-wrap">
                            {(page.level ?? 0) > 0 && (
                              <span className="inline-block shrink-0" style={{ width: (page.level ?? 1) * 16 }}>
                                <span className="text-[var(--text-muted)] font-mono text-[11px]">└ </span>
                              </span>
                            )}
                            <span className="font-body text-[13px] font-medium text-[var(--text-muted)]">
                              {page.title ?? page.slug}
                            </span>
                            {page.parent_id == null && (
                              <span className="text-[10px] px-[5px] py-[1px] rounded bg-[rgba(20,184,166,0.12)] text-[var(--lito-teal)] font-body font-semibold">
                                root
                              </span>
                            )}
                          </div>
                          {page.is_in_menu && (
                            <div className="flex items-center gap-1 mt-[3px]">
                              <span className="font-body text-[10px] text-[var(--text-muted)] shrink-0">Menu:</span>
                              <input
                                type="text"
                                placeholder={page.title ?? page.slug}
                                defaultValue={page.menu_label ?? ''}
                                title="Menu label — leave blank to use page title"
                                onBlur={(e) => {
                                  const val = e.target.value.trim() || null
                                  if (val !== page.menu_label) onUpdateMenuLabel(page.id, val)
                                }}
                                className="font-body text-[11px] px-[6px] py-[2px] w-[110px] bg-[var(--cms-header-bg)] border border-[var(--lito-border)] rounded text-[var(--text-primary)] outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-[14px] py-3">
                      <code className="font-mono text-xs text-[var(--text-muted)]">/{page.slug}</code>
                    </td>

                    {/* Parent picker */}
                    <td className="px-[14px] py-3 min-w-[130px]">
                      <select
                        value={page.parent_id ?? ''}
                        onChange={(e) => {
                          const val = e.target.value || null
                          if (val !== page.parent_id) onUpdateParentId(page.id, val)
                        }}
                        title="Parent page"
                        className="font-body text-xs px-[6px] py-[3px] bg-[var(--cms-header-bg)] border border-[var(--lito-border)] rounded text-[var(--text-muted)] outline-none cursor-pointer max-w-[130px]"
                      >
                        <option value="">— root —</option>
                        {eligibleParents.map((p) => (
                          <option key={p.id} value={p.id}>{pageLabel(p)}</option>
                        ))}
                      </select>
                    </td>

                    {/* Template — read-only from registry */}
                    <td className="px-[14px] py-3">
                      <span className="inline-flex items-center gap-1 px-[7px] py-[2px] rounded bg-[rgba(212,168,83,0.1)] font-body text-[11px] font-medium text-[var(--lito-gold)] whitespace-nowrap">
                        {templateName(templateSlug)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-[14px] py-3">
                      <StatusBadge skin="cms" status={page.status} />
                    </td>

                    {/* Toggles */}
                    <td className="px-[14px] py-3">
                      <MenuToggle checked={page.is_in_menu} onChange={() => onToggleMenu(page.id, !page.is_in_menu)} />
                    </td>
                    <td className="px-[14px] py-3">
                      <MenuToggle checked={page.is_header} onChange={() => onToggleHeader(page.id, !page.is_header)} />
                    </td>
                    <td className="px-[14px] py-3">
                      <MenuToggle checked={page.is_footer} onChange={() => onToggleFooter(page.id, !page.is_footer)} />
                    </td>
                    <td className="px-[14px] py-3">
                      <MenuToggle checked={page.is_mobile_menu} onChange={() => onToggleMobileMenu(page.id, !page.is_mobile_menu)} />
                    </td>

                    {/* Actions */}
                    <td className="px-[14px] py-3">
                      <div className="flex gap-1 justify-end">
                        <Link
                          to={`/pages/${page.id}/edit`}
                          className="flex items-center justify-center w-7 h-7 rounded-md border border-[var(--lito-border)] text-[var(--text-muted)] no-underline hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </Link>
                        <button
                          type="button"
                          title="Manage sections"
                          onClick={() => setSectionManagerPage({ id: page.id, title: page.title ?? page.slug, slug: page.slug })}
                          className="flex items-center gap-1 px-2 py-1 rounded-[5px] border border-[var(--lito-border)] bg-transparent cursor-pointer font-body text-[11px] text-[var(--text-secondary)] transition-[color,border-color] duration-150 hover:text-[var(--lito-teal)] hover:border-[var(--lito-teal)]"
                        >
                          Sections
                        </button>
                        <button
                          type="button"
                          onClick={() => { if (confirm(`Delete "${page.title ?? page.slug}"?`)) onDelete(page.id) }}
                          className="flex items-center justify-center w-7 h-7 rounded-md border border-[var(--lito-border)] bg-transparent text-[var(--text-muted)] cursor-pointer hover:text-[#A33028] hover:border-[#A33028]"
                          title="Delete"
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

      {sectionManagerPage && (
        <PageSectionsManager
          pageId={sectionManagerPage.id}
          pageTitle={sectionManagerPage.title}
          pageSlug={sectionManagerPage.slug}
          templateSlug={templateSlug ?? 'lito'}
          onClose={() => setSectionManagerPage(null)}
        />
      )}
    </div>
  )
}
