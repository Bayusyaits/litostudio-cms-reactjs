import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, Trash2, Pencil, Globe } from 'lucide-react'
import { Skeleton, StatusBadge, useTemplateManifest, EnterpriseDataTable } from '@litostudio/ui-cms'
import type { Page, PageStatus, PageListMeta, EDTColumn } from '@litostudio/ui-cms'
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

// Footer-only system pages: FAQ, Privacy Policy, Terms & Conditions ("Legal")
// must only ever appear in the footer nav — seeded footer-only in migration
// 20260714120000_seed_legal_faq_footer_litostudio.sql. All 4 placement
// toggles are locked for these slugs (Header/In Menu/Mobile forced off,
// Footer forced on) so an editor can't accidentally move them elsewhere;
// see also migration 20260714160000_fix_footer_only_pages_header_flag.sql,
// which corrects any pre-existing rows the seed's ON CONFLICT DO NOTHING
// left with the wrong flags.
const FOOTER_ONLY_SLUGS = ['faq', 'privacy', 'terms']

function MenuToggle({ checked, onChange, disabled, disabledReason }: { checked: boolean; onChange: () => void; disabled?: boolean; disabledReason?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={disabled ? undefined : onChange}
      title={disabled ? disabledReason : (checked ? 'Remove from menu' : 'Add to menu')}
      className={`inline-flex items-center w-8 h-[18px] rounded-[9px] border-none p-0 relative shrink-0 transition-[background] duration-150 ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'} ${checked ? 'bg-[var(--lito-teal)]' : 'bg-[var(--lito-border)]'}`}
    >
      {/* left is dynamic — keep as style */}
      <span
        className="absolute w-[14px] h-[14px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-[left] duration-150"
        style={{ left: checked ? 16 : 2 }}
      />
    </button>
  )
}

function buildPageColumns({
  allPages, templateName, pageLabel,
  onToggleMenu, onToggleHeader, onToggleFooter, onToggleMobileMenu,
  onUpdateMenuLabel, onUpdateParentId, onUpdateSortOrder, onDelete,
  onManageSections,
}: {
  allPages: Page[]
  templateName: (slug: string | null | undefined) => string
  pageLabel: (p: Page) => string
  onToggleMenu: (id: string, is_in_menu: boolean) => void
  onToggleHeader: (id: string, is_header: boolean) => void
  onToggleFooter: (id: string, is_footer: boolean) => void
  onToggleMobileMenu: (id: string, is_mobile_menu: boolean) => void
  onUpdateMenuLabel: (id: string, label: string | null) => void
  onUpdateParentId: (id: string, parent_id: string | null) => void
  onUpdateSortOrder: (id: string, order: number, allPages: Page[]) => void
  onDelete: (id: string) => void
  onManageSections: (page: { id: string; title: string; slug: string }) => void
}, templateSlug: string | null | undefined): EDTColumn<Page>[] {
  return [
    {
      key: 'sort_order',
      label: '#',
      width: 60,
      render: (page) => (
        <input
          key={`sort-${page.id}-${page.sort_order}`}
          type="number"
          defaultValue={page.sort_order ?? 0}
          min={0}
          step={1}
          title={`Sort order (current: ${page.sort_order})`}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => {
            const val = parseInt(e.target.value, 10)
            if (!isNaN(val) && val !== page.sort_order) {
              onUpdateSortOrder(page.id, val, allPages)
            }
          }}
          className="w-11 font-mono text-xs px-[6px] py-[3px] text-center bg-[var(--cms-header-bg)] border border-[var(--lito-border)] rounded text-[var(--text-muted)] outline-none"
        />
      ),
    },
    {
      key: 'title',
      label: 'Title / Menu Label',
      minWidth: 160,
      render: (page) => (
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
              <div className="flex items-center gap-1 mt-[3px]" onClick={(e) => e.stopPropagation()}>
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
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (page) => <code className="font-mono text-xs text-[var(--text-muted)]">/{page.slug}</code>,
    },
    {
      key: 'parent_id',
      label: 'Parent',
      minWidth: 130,
      render: (page) => {
        const eligibleParents = allPages.filter((p) => p.id !== page.id)
        return (
          <select
            value={page.parent_id ?? ''}
            onClick={(e) => e.stopPropagation()}
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
        )
      },
    },
    {
      key: 'template',
      label: 'Template',
      render: () => (
        <span className="inline-flex items-center gap-1 px-[7px] py-[2px] rounded bg-[rgba(212,168,83,0.1)] font-body text-[11px] font-medium text-[var(--lito-gold)] whitespace-nowrap">
          {templateName(templateSlug)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (page) => <StatusBadge skin="cms" status={page.status} />,
    },
    {
      key: 'is_in_menu',
      label: 'In Menu',
      render: (page) => {
        const footerOnly = FOOTER_ONLY_SLUGS.includes(page.slug)
        return (
          <span onClick={(e) => e.stopPropagation()}>
            <MenuToggle
              checked={page.is_in_menu}
              onChange={() => onToggleMenu(page.id, !page.is_in_menu)}
              disabled={footerOnly}
              disabledReason="FAQ, Privacy, and Terms pages are footer-only and can't appear in the dropdown menu"
            />
          </span>
        )
      },
    },
    {
      key: 'is_header',
      label: 'Header',
      render: (page) => {
        const footerOnly = FOOTER_ONLY_SLUGS.includes(page.slug)
        return (
          <span onClick={(e) => e.stopPropagation()}>
            <MenuToggle
              checked={page.is_header}
              onChange={() => onToggleHeader(page.id, !page.is_header)}
              disabled={footerOnly}
              disabledReason="FAQ, Privacy, and Terms pages are footer-only and can't appear in the header nav"
            />
          </span>
        )
      },
    },
    {
      key: 'is_footer',
      label: 'Footer',
      render: (page) => {
        const footerOnly = FOOTER_ONLY_SLUGS.includes(page.slug)
        return (
          <span onClick={(e) => e.stopPropagation()}>
            <MenuToggle
              checked={footerOnly ? true : page.is_footer}
              onChange={() => onToggleFooter(page.id, !page.is_footer)}
              disabled={footerOnly}
              disabledReason="FAQ, Privacy, and Terms pages must stay in the footer"
            />
          </span>
        )
      },
    },
    {
      key: 'is_mobile_menu',
      label: 'Mobile',
      render: (page) => {
        const footerOnly = FOOTER_ONLY_SLUGS.includes(page.slug)
        return (
          <span onClick={(e) => e.stopPropagation()}>
            <MenuToggle
              checked={page.is_mobile_menu}
              onChange={() => onToggleMobileMenu(page.id, !page.is_mobile_menu)}
              disabled={footerOnly}
              disabledReason="FAQ, Privacy, and Terms pages are footer-only and can't appear in the mobile menu"
            />
          </span>
        )
      },
    },
    {
      key: 'actions',
      label: '',
      width: 100,
      render: (page) => (
        <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
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
            onClick={() => onManageSections({ id: page.id, title: page.title ?? page.slug, slug: page.slug })}
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
      ),
    },
  ]
}

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

  const columns = buildPageColumns({
    allPages, templateName, pageLabel,
    onToggleMenu, onToggleHeader, onToggleFooter, onToggleMobileMenu,
    onUpdateMenuLabel, onUpdateParentId, onUpdateSortOrder, onDelete,
    onManageSections: setSectionManagerPage,
  }, templateSlug)

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
        <EnterpriseDataTable<Page>
          skin="cms"
          columns={columns}
          data={pages}
          server={{
            total: meta.total,
            limit: meta.limit,
            offset: meta.offset,
            onPageChange: (offset) => setFilter({ offset }),
          }}
          emptyIcon={<FileText className="w-6 h-6 text-[var(--lito-gold)]" aria-hidden />}
          emptyTitle="No pages found"
        />
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
