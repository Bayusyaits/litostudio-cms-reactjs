/**
 * EditorLeftSidebar — matches screenshot design exactly.
 * Header: "Blocks" title + search bar (⌘ K shortcut shown)
 * Row 1 tabs: All | Text | Layout | Media | Social
 * Row 2 tabs: Sections | Commerce | Forms
 * Block grid: FAVORITES / LAYOUT / MEDIA / SOCIAL sections (3 cols)
 */

import { useState } from 'react'
import {
  Search, Globe, Compass, Aperture, Camera, CalendarDays, Layers2,
  List, AlignLeft as OutlineIcon, LayoutGrid as BlocksIcon, Puzzle,
} from 'lucide-react'
import { BLOCK_LIBRARY } from './blocks/blockLibrary'
import { useEditorStore, makeBlock } from '@/stores/editor.store'
import { useTemplateManifest } from '@/hooks/useTemplateManifest'
import { EditorOutlinePanel }  from './EditorOutlinePanel'
import { EditorListView }      from './EditorListView'
import { EditorPatternsPanel } from './patterns/EditorPatternsPanel'

// ── Lucide icon map (must match icon names in blockLibrary.ts) ────────────────
import {
  Heading, AlignLeft, MousePointerClick, Minus, ArrowUpDown, Code2,
  Image, LayoutGrid, Play, Star, Megaphone, Layers, DollarSign, Quote,
  HelpCircle, Users, BarChart3, MapPin, Package, Archive, BookOpen,
  Mail, Send, Share2, FileText, Sparkles,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Heading, AlignLeft, MousePointerClick, Minus, ArrowUpDown, Code2,
  Image, LayoutGrid, Play, Star, Megaphone, Layers, DollarSign, Quote,
  HelpCircle, Users, BarChart3, MapPin, Package, Archive, BookOpen,
  Mail, Send, Share2, FileText, Sparkles,
  // Template-specific block icons
  Globe, Compass, Aperture, Camera, CalendarDays,
  Layers2,
}

function BlockIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name]
  if (!Icon) return <span style={{ fontSize: 10 }}>{name[0]}</span>
  return <Icon size={16} />
}

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

export function EditorLeftSidebar() {
  const { addBlock, selectedBlockId, blockDoc } = useEditorStore()
  const { manifest, templateSlug } = useTemplateManifest()
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
    const block = makeBlock(
      item.type,
      structuredClone(item.defaultData),
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

  // Filtered flat list for non-All tabs
  const filteredFlat = search.trim()
    ? BLOCK_LIBRARY.filter((b) => matchSearch(b.label))
    : activeTab === 'Template'
      ? templateBlocks
      : activeTab !== 'All'
        ? BLOCK_LIBRARY.filter((b) => b.category === TAB_TO_CATEGORY[activeTab])
        : []

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    fontWeight: active ? 600 : 400,
    background: active ? 'var(--lito-teal)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
    transition: 'background 120ms, color 120ms',
    whiteSpace: 'nowrap' as const,
  })

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
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 6, padding: '10px 6px',
          borderRadius: 10,
          border: isMaxed ? '1px dashed var(--lito-border)' : '1px solid var(--lito-border)',
          background: isMaxed ? 'transparent' : 'var(--cms-card-bg)',
          cursor: isMaxed ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          opacity: isMaxed ? 0.4 : 1,
          transition: 'border-color 120ms, box-shadow 120ms, opacity 120ms',
        }}
        onMouseEnter={e => {
          if (!isMaxed) {
            e.currentTarget.style.borderColor = 'var(--lito-teal)'
            e.currentTarget.style.boxShadow = '0 0 0 1px var(--lito-teal)'
          }
        }}
        onMouseLeave={e => {
          if (!isMaxed) {
            e.currentTarget.style.borderColor = 'var(--lito-border)'
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'var(--cms-surface-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
          flexShrink: 0,
        }}>
          <BlockIcon name={item.icon} />
        </div>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 10, lineHeight: 1.2,
          color: 'var(--text-secondary)',
          overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', maxWidth: '100%',
        }}>
          {item.label}
        </span>
      </button>
    )
  }

  const sectionHeader = (label: string) => (
    <p key={`hdr-${label}`} style={{
      fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.06em', color: 'var(--text-muted)',
      margin: 0, padding: '8px 0 4px',
    }}>
      {label}
    </p>
  )

  const blockGrid = (items: typeof BLOCK_LIBRARY) => (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
    }}>
      {items.map(blockCard)}
    </div>
  )

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', width: 280, flexShrink: 0,
      background: 'var(--cms-card-bg)',
      borderRight: '1px solid var(--lito-border)',
    }}>
      {/* ── Header: view switcher ───────────────────────────────────────────── */}
      <div style={{
        padding: '8px 10px 0', flexShrink: 0,
        borderBottom: '1px solid var(--lito-border)',
      }}>
        {/* View tab strip */}
        <div style={{
          display: 'flex', gap: 2, marginBottom: 6,
          background: 'var(--cms-surface-3)',
          border: '1px solid var(--lito-border)',
          borderRadius: 8, padding: 2,
        }}>
          {SIDEBAR_VIEWS.map(({ view, Icon, label }) => {
            const active = sidebarView === view
            return (
              <button
                key={view}
                type="button"
                title={label}
                onClick={() => setSidebarView(view)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 4, padding: '5px 4px', borderRadius: 6, border: 'none',
                  cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 10,
                  fontWeight: active ? 600 : 400,
                  background: active ? 'var(--lito-teal)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-muted)',
                  transition: 'background 120ms, color 120ms',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={11} />
                {label}
              </button>
            )
          })}
        </div>

        {/* Search bar — only in blocks view */}
        {sidebarView === 'blocks' && <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--cms-surface-3)',
          border: '1px solid var(--lito-border)',
          borderRadius: 8, padding: '6px 10px',
          marginBottom: 10,
        }}>
          <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blocks..."
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontFamily: 'var(--font-body)', fontSize: 12,
              color: 'var(--text-primary)', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <kbd style={{
              fontFamily: 'var(--font-body)', fontSize: 9,
              background: 'var(--lito-border)', color: 'var(--text-muted)',
              borderRadius: 3, padding: '1px 4px', lineHeight: '14px',
            }}>⌘</kbd>
            <kbd style={{
              fontFamily: 'var(--font-body)', fontSize: 9,
              background: 'var(--lito-border)', color: 'var(--text-muted)',
              borderRadius: 3, padding: '1px 4px', lineHeight: '14px',
            }}>K</kbd>
          </div>
        </div>}

        {/* Row 1 tabs — only in blocks view */}
        {sidebarView === 'blocks' && <>
        {/* Row 1 tabs: All | Text | Layout | Media | Social */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 4, overflowX: 'auto' }}>
          {ROW1_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => { setActiveTab(tab); setSearch('') }}
              style={tabStyle(activeTab === tab && !search)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Row 2 tabs: Sections | Commerce | Forms | Template */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 8, flexWrap: 'wrap' }}>
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
                style={{
                  ...tabStyle(activeTab === tab && !search),
                  // Highlight template tab distinctively
                  ...(tab === 'Template' && activeTab !== tab
                    ? { border: '1px solid var(--lito-teal)', color: 'var(--lito-teal)' }
                    : {}),
                }}
              >
                {tab === 'Template' && <Layers2 size={10} style={{ marginRight: 3, display: 'inline' }} />}
                {label}
              </button>
            )
          })}
        </div>
        </>}
      </div>

      {/* ── Alternate views: Outline / List ──────────────────────────────────── */}
      {sidebarView === 'outline' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <EditorOutlinePanel />
        </div>
      )}

      {sidebarView === 'list' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <EditorListView />
        </div>
      )}

      {sidebarView === 'patterns' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <EditorPatternsPanel />
        </div>
      )}

      {/* ── Block list ───────────────────────────────────────────────────────── */}
      {sidebarView === 'blocks' && <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 16px' }}>
        {/* Search results mode */}
        {search.trim() && (
          <>
            {filteredFlat.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                No blocks match "{search}"
              </p>
            ) : (
              blockGrid(filteredFlat)
            )}
          </>
        )}

        {/* Filtered tab mode (not All, no search) */}
        {!search.trim() && activeTab !== 'All' && (
          <>
            {activeTab === 'Template' && manifest && (
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                color: 'var(--lito-teal)', margin: '0 0 8px',
                padding: '4px 8px', borderRadius: 6,
                background: 'rgba(15,118,110,0.06)',
              }}>
                {manifest.name} template sections
              </p>
            )}
            {activeTab === 'Template' && !manifest && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                No template selected for this site.
              </p>
            )}
            {filteredFlat.length === 0 && activeTab !== 'Template' ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                No blocks in this category
              </p>
            ) : filteredFlat.length > 0 ? (
              blockGrid(filteredFlat)
            ) : null}
          </>
        )}

        {/* All view: grouped by section */}
        {!search.trim() && activeTab === 'All' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* FAVORITES */}
            {sectionHeader('FAVORITES')}
            {blockGrid(BLOCK_LIBRARY.filter(b => FAVORITES.includes(b.type as typeof FAVORITES[number])))}

            {/* Remaining sections */}
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
          </div>
        )}
      </div>}

      {/* ── Footer — blocks view only ─────────────────────────────────────────── */}
      {sidebarView === 'blocks' && <div style={{
        padding: '8px 12px',
        borderTop: '1px solid var(--lito-border)',
        flexShrink: 0,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 10,
          color: 'var(--text-muted)', textAlign: 'center', margin: 0,
        }}>
          {BLOCK_LIBRARY.length} blocks · click to insert
        </p>
      </div>}
    </div>
  )
}
