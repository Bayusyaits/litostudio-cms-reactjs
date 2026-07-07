/**
 * EditorLeftSidebar — matches screenshot design exactly.
 * Header: "Blocks" title + search bar (⌘ K shortcut shown)
 * Row 1 tabs: All | Text | Layout | Media | Social
 * Row 2 tabs: Sections | Commerce | Forms
 * Block grid: FAVORITES / LAYOUT / MEDIA / SOCIAL sections (3 cols)
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Search, Layers2,
  List, AlignLeft as OutlineIcon, LayoutGrid as BlocksIcon, Puzzle,
  type LucideIcon,
} from 'lucide-react'
import { BLOCK_LIBRARY } from './blocks/blockLibrary'
import { BlockIcon } from './blocks/blockIcons'
import { hydrateBlockDefaults } from './blocks/blockDefaults'
import { useEditorStore, makeBlock } from '@/stores/editor.store'
import { useWebsiteStore } from '@/stores/website.store'
import { useTemplateManifest } from '@/hooks/useTemplateManifest'
import { EditorOutlinePanel }  from './EditorOutlinePanel'
import { EditorListView }      from './EditorListView'
import { EditorPatternsPanel } from './patterns/EditorPatternsPanel'
import type { SiteThemeSettings } from '@/services/theme.service'

// ── Tab definitions ───────────────────────────────────────────────────────────

const ROW1_TABS = ['All', 'Text', 'Layout', 'Media', 'Social'] as const
const ROW2_TABS = ['Sections', 'Commerce', 'Forms', 'Template'] as const

type FilterTab = typeof ROW1_TABS[number] | typeof ROW2_TABS[number]

const TAB_TO_CATEGORY: Record<FilterTab, string | null> = {
  All:      null,
  Text:     'text',
  Layout:   'layout',
  Media:    'media',
  Social:   'social',
  Sections: 'layout',
  Commerce: 'commerce',
  Forms:    'forms',
  Template: 'template',
}

// ── Favorites (shown in "All" view at the top) ────────────────────────────────
const FAVORITES = ['heading', 'text', 'image', 'button', 'spacer', 'divider'] as const

// ── Section order for "All" view ─────────────────────────────────────────────
const ALL_SECTIONS: Array<{ key: string; label: string; category: string }> = [
  { key: 'favorites', label: 'FAVORITES', category: '__favorites__' },
  { key: 'layout',    label: 'LAYOUT',    category: 'layout' },
  { key: 'media',     label: 'MEDIA',     category: 'media' },
  { key: 'social',    label: 'SOCIAL',    category: 'social' },
  { key: 'sections',  label: 'SECTIONS',  category: 'sections' },
  { key: 'commerce',  label: 'COMMERCE',  category: 'commerce' },
  { key: 'forms',     label: 'FORMS',     category: 'forms' },
]

type SidebarView = 'blocks' | 'outline' | 'list' | 'patterns'

const SIDEBAR_VIEWS: Array<{ view: SidebarView; Icon: LucideIcon; label: string }> = [
  { view: 'blocks',   Icon: BlocksIcon,  label: 'Blocks'    },
  { view: 'outline',  Icon: OutlineIcon, label: 'Outline'   },
  { view: 'list',     Icon: List,        label: 'List'      },
  { view: 'patterns', Icon: Puzzle,      label: 'Patterns'  },
]

// ── Tab className helper ──────────────────────────────────────────────────────

const tabClass = (active: boolean, isTemplateInactive = false) =>
  `px-[10px] py-1 rounded-md cursor-pointer font-body text-[11px] whitespace-nowrap transition-[background,color] duration-100 ${
    active
      ? 'font-semibold bg-[var(--lito-teal)] text-white border-none'
      : isTemplateInactive
        ? 'font-normal bg-transparent text-[var(--lito-teal)] border border-[var(--lito-teal)]'
        : 'font-normal bg-transparent text-[var(--text-muted)] border-none'
  }`

export function EditorLeftSidebar() {
  const { addBlock, selectedBlockId, blockDoc } = useEditorStore()
  const { activeSite } = useWebsiteStore()
  const { manifest, templateSlug } = useTemplateManifest()
  const queryClient = useQueryClient()
  const [search, setSearch]         = useState('')
  const [activeTab, setActiveTab]   = useState<FilterTab>('All')
  const [sidebarView, setSidebarView] = useState<SidebarView>('blocks')

  // Build a set of block types already on the canvas (as strings for manifest comparison)
  const blockTypesOnCanvas = new Set<string>(blockDoc.blocks.map((b) => b.type as string))

  // Build a set of block types that are at their max (multiple: false) per manifest
  const maxedBlockTypes = new Set<string>()
  if (manifest) {
    for (const section of manifest.sections) {
      if (!section.multiple && blockTypesOnCanvas.has(section.id)) {
        maxedBlockTypes.add(section.id)
      }
    }
  }

  const handleInsert = (item: typeof BLOCK_LIBRARY[number]) => {
    if (maxedBlockTypes.has(item.type)) return // guard: shouldn't be clickable anyway

    // ── Build site context from cached theme query + active site ────────────
    const siteTheme = queryClient.getQueryData<SiteThemeSettings>(
      ['site-theme', activeSite?.id],
    )
    const footerContact = (siteTheme?.extra_settings?.['footer_contact'] as Record<string, string> | undefined) ?? {}

    const siteCtx = {
      name:        siteTheme?.site_name   || activeSite?.name   || '',
      description: siteTheme?.site_description || undefined,
      email:       footerContact['email']   || undefined,
      phone:       footerContact['phone']   || undefined,
      address:     footerContact['address'] || undefined,
    }

    // Hydrate defaultData with real site data before inserting the block
    const rawData    = structuredClone(item.defaultData)
    const hydrated   = siteCtx.name
      ? hydrateBlockDefaults(item.type, rawData as Record<string, unknown>, siteCtx)
      : rawData

    const block = makeBlock(
      item.type,
      hydrated,
      item.defaultStyles ? structuredClone(item.defaultStyles) : undefined,
    )
    addBlock(block, selectedBlockId ?? undefined)
  }

  // Template-scoped blocks: blocks that belong to the active template
  const templateBlocks = templateSlug
    ? BLOCK_LIBRARY.filter((b) =>
        b.category === 'template' &&
        (!b.templateScope || b.templateScope.includes(templateSlug))
      )
    : BLOCK_LIBRARY.filter((b) => b.category === 'template')

  // Filter by search
  const matchSearch = (label: string) =>
    !search.trim() || label.toLowerCase().includes(search.toLowerCase().trim())

  // Only show template-scoped blocks that match the active template (or have no scope)
  const isVisibleForTemplate = (b: typeof BLOCK_LIBRARY[number]) => {
    if (!b.templateScope) return true
    if (!templateSlug) return true
    return b.templateScope.includes(templateSlug)
  }

  // Filtered flat list for non-All tabs
  const filteredFlat = search.trim()
    ? BLOCK_LIBRARY.filter((b) => matchSearch(b.label) && isVisibleForTemplate(b))
    : activeTab === 'Template'
      ? templateBlocks
      : activeTab !== 'All'
        ? BLOCK_LIBRARY.filter((b) => b.category === TAB_TO_CATEGORY[activeTab] && isVisibleForTemplate(b))
        : []

  const blockCard = (item: typeof BLOCK_LIBRARY[number]) => {
    const isMaxed = maxedBlockTypes.has(item.type)
    return (
      <button
        key={item.type}
        type="button"
        onClick={() => !isMaxed && handleInsert(item)}
        title={isMaxed ? `Only one ${item.label} block allowed` : item.description}
        disabled={isMaxed}
        aria-label={isMaxed ? `${item.label} — already on canvas` : `Insert ${item.label} block`}
        className={`flex flex-col items-center gap-[6px] px-[6px] py-[10px] rounded-[10px] text-center transition-[border-color,box-shadow,opacity] duration-[120ms] ${
          isMaxed
            ? 'border border-dashed border-[var(--lito-border)] bg-transparent cursor-not-allowed opacity-40'
            : 'border border-[var(--lito-border)] bg-[var(--cms-card-bg)] cursor-pointer hover:border-[var(--lito-teal)] hover:shadow-[0_0_0_1px_var(--lito-teal)]'
        }`}
      >
        <div className="w-9 h-9 rounded-lg bg-[var(--cms-surface-3)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
          <BlockIcon name={item.icon} />
        </div>
        <span className="font-body text-[10px] leading-[1.2] text-[var(--text-secondary)] overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
          {item.label}
        </span>
      </button>
    )
  }

  const sectionHeader = (label: string) => (
    <p key={`hdr-${label}`} className="font-body text-[10px] font-bold tracking-[0.06em] text-[var(--text-muted)] m-0 pt-2 pb-1">
      {label}
    </p>
  )

  const blockGrid = (items: typeof BLOCK_LIBRARY) => (
    <div className="grid grid-cols-3 gap-[6px]">
      {items.map(blockCard)}
    </div>
  )

  return (
    <div className="flex flex-col h-full w-[280px] shrink-0 bg-[var(--cms-card-bg)] border-r border-[var(--lito-border)]">
      {/* ── Header: view switcher ───────────────────────────────────────────── */}
      <div className="px-[10px] pt-2 shrink-0 border-b border-[var(--lito-border)]">
        {/* View tab strip */}
        <div className="flex gap-0.5 mb-[6px] bg-[var(--cms-surface-3)] border border-[var(--lito-border)] rounded-lg p-0.5">
          {SIDEBAR_VIEWS.map(({ view, Icon, label }) => {
            const active = sidebarView === view
            return (
              <button
                key={view}
                type="button"
                title={label}
                onClick={() => setSidebarView(view)}
                className={`flex-1 flex items-center justify-center gap-1 py-[5px] px-1 rounded-md border-none cursor-pointer font-body text-[10px] whitespace-nowrap transition-[background,color] duration-100 ${
                  active ? 'font-semibold bg-[var(--lito-teal)] text-white' : 'font-normal bg-transparent text-[var(--text-muted)]'
                }`}
              >
                <Icon size={11} />
                {label}
              </button>
            )
          })}
        </div>

        {/* Search bar — only in blocks view */}
        {sidebarView === 'blocks' && (
          <div className="flex items-center gap-2 bg-[var(--cms-surface-3)] border border-[var(--lito-border)] rounded-lg px-[10px] py-[6px] mb-[10px]">
            <Search size={13} className="text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search blocks..."
              className="flex-1 border-none bg-transparent font-body text-xs text-[var(--text-primary)] outline-none"
            />
            <div className="flex items-center gap-0.5 shrink-0">
              <kbd className="font-body text-[9px] bg-[var(--lito-border)] text-[var(--text-muted)] rounded-[3px] px-1 leading-[14px]">⌘</kbd>
              <kbd className="font-body text-[9px] bg-[var(--lito-border)] text-[var(--text-muted)] rounded-[3px] px-1 leading-[14px]">K</kbd>
            </div>
          </div>
        )}

        {/* Row 1 & 2 tabs — only in blocks view */}
        {sidebarView === 'blocks' && <>
          {/* Row 1 tabs: All | Text | Layout | Media | Social */}
          <div className="flex gap-0.5 mb-1 overflow-x-auto">
            {ROW1_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setSearch('') }}
                className={tabClass(activeTab === tab && !search)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Row 2 tabs: Sections | Commerce | Forms | Template */}
          <div className="flex gap-0.5 mb-2 flex-wrap">
            {ROW2_TABS.map((tab) => {
              // "Template" tab only shown when a template manifest is active
              if (tab === 'Template' && !manifest) return null
              const label = tab === 'Template' && manifest
                ? manifest.name
                : tab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => { setActiveTab(tab); setSearch('') }}
                  className={tabClass(activeTab === tab && !search, tab === 'Template' && activeTab !== tab)}
                >
                  {tab === 'Template' && <Layers2 size={10} className="mr-[3px] inline" />}
                  {label}
                </button>
              )
            })}
          </div>
        </>}
      </div>

      {/* ── Alternate views: Outline / List / Patterns ──────────────────────── */}
      {sidebarView === 'outline' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <EditorOutlinePanel />
        </div>
      )}

      {sidebarView === 'list' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <EditorListView />
        </div>
      )}

      {sidebarView === 'patterns' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <EditorPatternsPanel />
        </div>
      )}

      {/* ── Block list ───────────────────────────────────────────────────────── */}
      {sidebarView === 'blocks' && (
        <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4">
          {/* Search results mode */}
          {search.trim() && (
            <>
              {filteredFlat.length === 0 ? (
                <p className="font-body text-xs text-[var(--text-muted)] text-center py-6 m-0">
                  No blocks match &ldquo;{search}&rdquo;
                </p>
              ) : blockGrid(filteredFlat)}
            </>
          )}

          {/* Filtered tab mode (not All, no search) */}
          {!search.trim() && activeTab !== 'All' && (
            <>
              {activeTab === 'Template' && manifest && (
                <p className="font-body text-[10px] font-semibold text-[var(--lito-teal)] mt-0 mb-2 px-2 py-1 rounded-md bg-[rgba(15,118,110,0.06)]">
                  {manifest.name} template sections
                </p>
              )}
              {activeTab === 'Template' && !manifest && (
                <p className="font-body text-xs text-[var(--text-muted)] text-center py-6 m-0">
                  No template selected for this site.
                </p>
              )}
              {filteredFlat.length === 0 && activeTab !== 'Template' ? (
                <p className="font-body text-xs text-[var(--text-muted)] text-center py-6 m-0">
                  No blocks in this category
                </p>
              ) : filteredFlat.length > 0 ? (
                blockGrid(filteredFlat)
              ) : null}
            </>
          )}

          {/* All view: grouped by section */}
          {!search.trim() && activeTab === 'All' && (
            <div className="flex flex-col">
              {/*
                Two-group split (2026-07 architecture standardization):
                "Standard sections" — canonical block types with no templateScope,
                identical everywhere. "{Template}-only sections" — exclusive to the
                active template (blockLibrary.ts templateScope), kept under their
                real names/fields rather than genericized (see write-spec doc:
                section-architecture-standardization-spec.md, Non-Goals).
                Group 1 was previously the only thing shown here; template blocks
                were reachable only via the separate "Template" tab, which made
                them easy to miss entirely in the default view.
              */}
              <p className="font-body text-[9px] font-bold tracking-[0.08em] text-[var(--text-muted)]/70 m-0 pt-1 pb-0.5 uppercase">
                Standard sections
              </p>

              {/* FAVORITES */}
              {sectionHeader('FAVORITES')}
              {blockGrid(BLOCK_LIBRARY.filter(b => FAVORITES.includes(b.type as typeof FAVORITES[number])))}

              {/* Remaining canonical sections */}
              {ALL_SECTIONS.filter(s => s.key !== 'favorites').map(({ key, label, category }) => {
                const items = BLOCK_LIBRARY.filter(b => b.category === category)
                if (items.length === 0) return null
                return (
                  <div key={key}>
                    {sectionHeader(label)}
                    {blockGrid(items)}
                  </div>
                )
              })}

              {/* Group 2: template-exclusive sections — always visible here now, */}
              {/* not just behind the separate "Template" tab. */}
              {templateBlocks.length > 0 && (
                <div key="template-only">
                  <p className="font-body text-[9px] font-bold tracking-[0.08em] text-[var(--lito-teal)]/80 m-0 pt-3 pb-0.5 uppercase border-t border-[var(--lito-border)] mt-2">
                    {manifest ? `${manifest.name} only` : 'Template-only sections'}
                  </p>
                  {blockGrid(templateBlocks)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Footer — blocks view only ─────────────────────────────────────────── */}
      {sidebarView === 'blocks' && (
        <div className="px-3 py-2 border-t border-[var(--lito-border)] shrink-0">
          <p className="font-body text-[10px] text-[var(--text-muted)] text-center m-0">
            {BLOCK_LIBRARY.length} blocks · click to insert
          </p>
        </div>
      )}
    </div>
  )
}
