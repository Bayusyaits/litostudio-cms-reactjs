/**
 * EditorCanvas — visual editing area.
 *
 * Selected block:
 *   - Teal 2px outline
 *   - Dark floating toolbar (grip · ↑ · ↓ · copy · ⋮ menu · trash)
 *   - Teal block-type badge (top-left)
 *   - Teal "+" insert button (centred at bottom)
 *
 * Context menu (⋮):
 *   Copy · Cut · Duplicate
 *   Add before · Add after
 *   Copy styles · Paste styles
 *   Group · Lock · Rename · Hide
 *   Set as featured image · Edit as HTML
 *   Delete
 */

import { useRef, useState, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Plus, ChevronUp, ChevronDown, Copy, Trash2, GripVertical,
  MoreVertical, Scissors, ClipboardPaste, ArrowUpToLine, ArrowDownToLine,
  Paintbrush, ClipboardCopy, Group, Lock, Unlock, Tag, EyeOff,
  ImageIcon, Code2,
} from 'lucide-react'
import { useEditorStore }       from '@/stores/editor.store'
import { useWebsiteStore }     from '@/stores/website.store'
import { BlockRenderer }        from './blocks/BlockRenderer'
import { FloatingTextToolbar }  from './FloatingTextToolbar'
import { useTemplateManifest }  from '@/hooks/useTemplateManifest'
import { getCanvasTokens }      from './templateCanvasTokens'
import type { Block }           from '@/types/editor.types'
import type { PreviewMode }     from '@/types/editor.types'
// Real website CSS tokens — single source of truth.
// :root vars (lito), [data-template="fashion"] (--nx-*), [data-template="beauty"] (--bx-*)
import './canvas-website-tokens.css'

// ── Context menu ─────────────────────────────────────────────────────────────

interface ContextMenuItem {
  label: string
  icon: React.ReactNode
  action: () => void
  danger?: boolean
  disabled?: boolean
}

interface ContextMenuGroup {
  items: ContextMenuItem[]
}

interface BlockContextMenuProps {
  block: Block
  isFirst: boolean
  isLast: boolean
  onClose: () => void
}

function BlockContextMenu({ block, isFirst, isLast, onClose }: BlockContextMenuProps) {
  const {
    copyBlock, cutBlock, pasteBlock, duplicateBlock,
    insertBlockBefore, addBlock,
    copyBlockStyles, pasteBlockStyles, clipboardStyles,
    groupBlocks, lockBlock, renameBlock, hideBlock,
    setFeaturedImage, editBlockAsHTML, removeBlock,
    clipboardBlock,
  } = useEditorStore()

  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  const handleRename = () => {
    const current = block.name ?? block.type
    const name = window.prompt('Rename block:', current)
    if (name !== null) renameBlock(block.id, name.trim() || block.type)
    onClose()
  }

  const isImageBlock = block.type === 'image' || block.type === 'hero'

  const handleSetFeatured = () => {
    const d = block.data as Record<string, unknown>
    const url = (d['src'] ?? d['backgroundImage'] ?? '') as string
    if (url) setFeaturedImage(url)
    onClose()
  }

  // Whether there's a pasted clipboard block to insert
  const canPaste = !!clipboardBlock
  const canPasteStyles = !!clipboardStyles

  const groups: ContextMenuGroup[] = [
    {
      items: [
        {
          label: 'Copy',
          icon: <Copy size={13} />,
          action: () => { copyBlock(block.id); onClose() },
        },
        {
          label: 'Cut',
          icon: <Scissors size={13} />,
          action: () => { cutBlock(block.id); onClose() },
        },
        {
          label: 'Duplicate',
          icon: <Copy size={13} />,
          action: () => { duplicateBlock(block.id); onClose() },
        },
      ],
    },
    {
      items: [
        {
          label: 'Add before',
          icon: <ArrowUpToLine size={13} />,
          disabled: isFirst,
          action: () => {
            const newBlock = { id: Math.random().toString(36).slice(2, 10), type: 'spacer' as const, data: { height: 48 }, styles: {}, visibility: { desktop: true, tablet: true, mobile: true } }
            insertBlockBefore(block.id, newBlock)
            onClose()
          },
        },
        {
          label: 'Add after',
          icon: <ArrowDownToLine size={13} />,
          disabled: isLast,
          action: () => {
            const newBlock = { id: Math.random().toString(36).slice(2, 10), type: 'spacer' as const, data: { height: 48 }, styles: {}, visibility: { desktop: true, tablet: true, mobile: true } }
            addBlock(newBlock, block.id)
            onClose()
          },
        },
        {
          label: 'Paste block',
          icon: <ClipboardPaste size={13} />,
          disabled: !canPaste,
          action: () => { pasteBlock(block.id); onClose() },
        },
      ],
    },
    {
      items: [
        {
          label: 'Copy styles',
          icon: <Paintbrush size={13} />,
          action: () => { copyBlockStyles(block.id); onClose() },
        },
        {
          label: 'Paste styles',
          icon: <ClipboardCopy size={13} />,
          disabled: !canPasteStyles,
          action: () => { pasteBlockStyles(block.id); onClose() },
        },
      ],
    },
    {
      items: [
        {
          label: 'Group',
          icon: <Group size={13} />,
          action: () => {
            const gid = Math.random().toString(36).slice(2, 10)
            groupBlocks([block.id], gid)
            onClose()
          },
        },
        {
          label: block.locked ? 'Unlock' : 'Lock',
          icon: block.locked ? <Unlock size={13} /> : <Lock size={13} />,
          action: () => { lockBlock(block.id, !block.locked); onClose() },
        },
        {
          label: 'Rename',
          icon: <Tag size={13} />,
          action: handleRename,
        },
        {
          label: 'Hide',
          icon: <EyeOff size={13} />,
          action: () => { hideBlock(block.id); onClose() },
        },
      ],
    },
    {
      items: [
        ...(isImageBlock ? [{
          label: 'Set as featured image',
          icon: <ImageIcon size={13} />,
          action: handleSetFeatured,
        }] : []),
        {
          label: 'Edit as HTML',
          icon: <Code2 size={13} />,
          action: () => { editBlockAsHTML(block.id); onClose() },
        },
      ],
    },
    // Delete is hidden for locked blocks (locked = template-required section)
    ...(!block.locked ? [{
      items: [
        {
          label: 'Delete',
          icon: <Trash2 size={13} />,
          danger: true,
          action: () => { removeBlock(block.id); onClose() },
        },
      ],
    }] : []),
  ]

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Block options"
      className="absolute top-[calc(100%+4px)] right-0 z-[200] bg-[#1a1a1a] rounded-[10px] border border-[rgba(255,255,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1 min-w-[188px] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      {groups.map((group, gi) => (
        <div key={gi} role="group">
          {gi > 0 && (
            <div className="h-px bg-[rgba(255,255,255,0.08)] mx-2 my-[3px]" aria-hidden="true" />
          )}
          {group.items.map((item, ii) => (
            <button
              key={ii}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              aria-disabled={item.disabled}
              onClick={item.disabled ? undefined : item.action}
              className={`flex items-center gap-2 px-3 py-[6px] border-none bg-transparent w-full text-left font-body text-xs rounded-[4px] transition-[background] duration-[80ms] ${
                item.danger
                  ? 'text-[#f87171] cursor-pointer hover:bg-[rgba(239,68,68,0.2)]'
                  : item.disabled
                    ? 'text-[rgba(255,255,255,0.25)] cursor-default opacity-50'
                    : 'text-[rgba(255,255,255,0.85)] cursor-pointer hover:bg-[rgba(255,255,255,0.08)]'
              }`}
            >
              <span className="w-4 flex items-center justify-center shrink-0" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Dark floating block toolbar ───────────────────────────────────────────────

interface BlockActionsProps {
  block: Block
  isFirst: boolean
  isLast: boolean
  onDragStart: () => void
  onDragEnd: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

function BlockActions({ block, isFirst, isLast, onDragStart, onDragEnd }: BlockActionsProps) {
  const { moveBlockUp, moveBlockDown, duplicateBlock, removeBlock } = useEditorStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)

  const btnCls = 'flex items-center justify-center w-[26px] h-[26px] rounded border-none bg-transparent cursor-pointer text-[rgba(255,255,255,0.75)] transition-[background,color] duration-100 shrink-0'

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen((o) => !o)
  }

  const divider = <div className="w-px h-4 bg-[rgba(255,255,255,0.12)] mx-0.5 shrink-0" aria-hidden="true" />

  return (
    <div
      ref={anchorRef as React.RefObject<HTMLDivElement>}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-2 right-2 z-[20] flex items-center bg-[#1a1a1a] rounded-lg px-[3px] py-0.5 gap-px shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
    >
      {/* Drag grip */}
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        role="button"
        tabIndex={0}
        aria-label="Drag to reorder block"
        className={`${btnCls} cursor-grab`}
        title="Drag to reorder"
      >
        <GripVertical size={13} />
      </div>

      {divider}

      {/* Move up */}
      <button
        type="button"
        disabled={isFirst}
        onClick={() => moveBlockUp(block.id)}
        title="Move up"
        aria-label="Move block up"
        className={`${btnCls} hover:bg-[rgba(255,255,255,0.12)] ${isFirst ? 'opacity-25' : 'opacity-100'}`}
      >
        <ChevronUp size={13} aria-hidden="true" />
      </button>

      {/* Move down */}
      <button
        type="button"
        disabled={isLast}
        onClick={() => moveBlockDown(block.id)}
        title="Move down"
        aria-label="Move block down"
        className={`${btnCls} hover:bg-[rgba(255,255,255,0.12)] ${isLast ? 'opacity-25' : 'opacity-100'}`}
      >
        <ChevronDown size={13} aria-hidden="true" />
      </button>

      {divider}

      {/* Duplicate */}
      <button
        type="button"
        onClick={() => duplicateBlock(block.id)}
        title="Duplicate block"
        aria-label="Duplicate block"
        className={`${btnCls} hover:bg-[rgba(255,255,255,0.12)] hover:text-white`}
      >
        <Copy size={12} aria-hidden="true" />
      </button>

      {/* More options (⋮) — renders its own context menu as child */}
      <div className="relative">
        <button
          type="button"
          onClick={handleMoreClick}
          title="More options"
          aria-label="More block options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className={`${btnCls} hover:bg-[rgba(255,255,255,0.12)] ${menuOpen ? 'bg-[rgba(255,255,255,0.14)]' : ''}`}
        >
          <MoreVertical size={12} aria-hidden="true" />
        </button>

        {/* Context menu — positioned relative to the ⋮ button wrapper */}
        {menuOpen && (
          <BlockContextMenu
            block={block}
            isFirst={isFirst}
            isLast={isLast}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={() => removeBlock(block.id)}
        title="Delete block"
        aria-label="Delete block"
        className={`${btnCls} hover:bg-[rgba(239,68,68,0.25)] hover:text-[#f87171]`}
      >
        <Trash2 size={12} aria-hidden="true" />
      </button>
    </div>
  )
}

// ── Insert button (teal + circle, centred at block bottom) ───────────────────

function InsertButton({ afterBlockId }: { afterBlockId: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const { selectBlock, toggleLeftSidebar } = useEditorStore.getState()
    selectBlock(afterBlockId)
    toggleLeftSidebar(true)
  }

  return (
    <div className="absolute -bottom-[14px] left-1/2 -translate-x-1/2 z-[30]">
      <button
        type="button"
        onClick={handleClick}
        title="Add block here"
        className="w-7 h-7 rounded-full bg-[var(--lito-teal)] border-2 border-white flex items-center justify-center cursor-pointer text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-transform duration-[120ms] hover:scale-[1.12]"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

// ── Responsive mock site header ───────────────────────────────────────────────
// Mirrors AppHeader.vue from apps/website — burger on mobile, full nav on desktop/tablet.

interface MockSiteHeaderProps {
  headerBg:     string
  headerText:   string
  headerAccent: string
  siteName:     string
  fontDisplay:  string
  fontBody:     string
  previewMode:  PreviewMode
  navLinks:     string[]
  /** Active template slug — drives template-specific CTA text and footer tagline */
  templateSlug: string
}

/**
 * Template-specific chrome config for MockSiteHeader / MockSiteFooter.
 * Controls CTA button text and footer tagline so the canvas looks like the
 * correct brand instead of always showing the Lito photography brand.
 */
const TEMPLATE_CHROME: Record<string, {
  ctaText:    string
  tagline:    string
  fallbackNav: string[]
}> = {
  lito: {
    ctaText:     'Book Now',
    tagline:     'Visual storytelling for travel, culture & community.',
    fallbackNav: ['Home', 'About', 'Portfolio', 'Stories', 'Journal', 'Contact'],
  },
  fashion: {
    ctaText:     'Shop Now',
    tagline:     'Curated fashion for the modern wardrobe.',
    fallbackNav: ['Home', 'Collections', 'New Arrivals', 'About', 'Journal', 'Contact'],
  },
  beauty: {
    ctaText:     'Book Treatment',
    tagline:     'Expert beauty & wellness treatments.',
    fallbackNav: ['Home', 'Services', 'Campaigns', 'About', 'Journal', 'Contact'],
  },
  photography: {
    ctaText:     'Book Session',
    tagline:     'Capturing moments that last a lifetime.',
    fallbackNav: ['Home', 'Portfolio', 'About', 'Stories', 'Journal', 'Contact'],
  },
  travel: {
    ctaText:     'Explore Now',
    tagline:     'Discover remarkable destinations.',
    fallbackNav: ['Home', 'Destinations', 'Stories', 'About', 'Journal', 'Contact'],
  },
}

function MockSiteHeader({ headerBg, headerText, headerAccent, siteName, fontDisplay, fontBody, previewMode, navLinks, templateSlug }: MockSiteHeaderProps) {
  const chrome = TEMPLATE_CHROME[templateSlug] ?? TEMPLATE_CHROME.lito
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isMobile = previewMode === 'mobile'
  const isTablet = previewMode === 'tablet'

  const px = isMobile ? '20px' : isTablet ? '32px' : '40px'

  const navLinkStyle: React.CSSProperties = {
    fontFamily: fontBody,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: `${headerText}bb`,
    cursor: 'default',
    userSelect: 'none',
    transition: 'opacity 150ms',
  }

  return (
    <div role="banner" aria-label="Site header preview" style={{ flexShrink: 0, position: 'relative', zIndex: 10 }}>
      {/* ── Main bar ────────────────────────────────────────────────────── */}
      <div style={{
        background: headerBg,
        borderBottom: `1px solid ${headerAccent}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${px}`,
        height: 64,
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: fontDisplay,
          fontSize: isMobile ? 15 : 17,
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: headerText,
          userSelect: 'none',
          flexShrink: 0,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: headerAccent,
            display: 'inline-block', flexShrink: 0,
          }} aria-hidden="true" />
          {siteName}
        </div>

        {/* Desktop / tablet nav */}
        {!isMobile && (
          <nav aria-label="Primary navigation" style={{ display: 'flex', alignItems: 'center', gap: isTablet ? 20 : 28 }}>
            {navLinks.slice(0, isTablet ? 4 : 6).map((item) => (
              <span key={item} style={navLinkStyle}>{item}</span>
            ))}
          </nav>
        )}

        {/* Desktop CTA */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}>
            <span style={{
              fontFamily: fontBody, fontSize: 12, fontWeight: 500,
              color: `${headerText}88`, userSelect: 'none',
              letterSpacing: '0.06em',
            }}>EN</span>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 18px', borderRadius: 999,
              background: headerText,
              color: headerBg,
              fontFamily: fontBody, fontSize: 12, fontWeight: 500,
              cursor: 'default', userSelect: 'none',
            }}>
              {chrome.ctaText}
            </div>
          </div>
        )}

        {/* Mobile: search + burger */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={drawerOpen}
              aria-controls="mobile-nav-preview"
              onClick={() => setDrawerOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 6,
                border: 'none', background: 'transparent',
                color: headerText, cursor: 'pointer',
              }}
            >
              {drawerOpen
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
              }
            </button>
          </div>
        )}
      </div>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      {isMobile && drawerOpen && (
        <div
          id="mobile-nav-preview"
          role="navigation"
          aria-label="Mobile navigation"
          style={{
            background: headerBg,
            borderBottom: `1px solid ${headerAccent}25`,
            padding: '8px 20px 20px',
          }}
        >
          {navLinks.map((item, i) => (
            <div
              key={item}
              style={{
                fontFamily: fontBody,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: i === 0 ? headerText : `${headerText}99`,
                padding: '12px 0',
                borderBottom: i < navLinks.length - 1 ? `1px solid ${headerAccent}18` : 'none',
                userSelect: 'none', cursor: 'default',
              }}
            >
              {item}
            </div>
          ))}
          <div style={{ paddingTop: 16 }}>
            <div style={{
              display: 'block', padding: '10px 0', borderRadius: 999,
              background: headerText, color: headerBg,
              fontFamily: fontBody, fontSize: 13, fontWeight: 500,
              textAlign: 'center', userSelect: 'none', cursor: 'default',
            }}>
              {chrome.ctaText}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Mock site footer ──────────────────────────────────────────────────────────

function MockSiteFooter({ headerBg, headerText, headerAccent, siteName, fontDisplay, fontBody, previewMode, navLinks, templateSlug }: MockSiteHeaderProps) {
  const chrome = TEMPLATE_CHROME[templateSlug] ?? TEMPLATE_CHROME.lito
  const isMobile = previewMode === 'mobile'
  return (
    <div
      aria-label="Site footer preview"
      role="contentinfo"
      style={{
        background: headerBg,
        borderTop: `1px solid ${headerAccent}20`,
        padding: isMobile ? '28px 20px' : '40px 40px',
        flexShrink: 0,
      }}
    >
      {/* Top row */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'flex-start',
        justifyContent: 'space-between',
        gap: isMobile ? 24 : 0,
        paddingBottom: 24,
        borderBottom: `1px solid ${headerAccent}15`,
        marginBottom: 20,
      }}>
        {/* Logo + tagline */}
        <div>
          <div style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 600, color: headerText, marginBottom: 6, userSelect: 'none' }}>
            {siteName}
          </div>
          <div style={{ fontFamily: fontBody, fontSize: 11, color: `${headerText}66`, userSelect: 'none', maxWidth: 200, lineHeight: 1.6 }}>
            {chrome.tagline}
          </div>
        </div>
        {/* Footer nav */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 32 }}>
            {navLinks.slice(0, 5).map(link => (
              <span key={link} style={{ fontFamily: fontBody, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: `${headerText}88`, cursor: 'default', userSelect: 'none' }}>
                {link}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: fontBody, fontSize: 10, color: `${headerText}55`, userSelect: 'none' }}>
          © {new Date().getFullYear()} {siteName} · All rights reserved
        </span>
        <span style={{ fontFamily: fontBody, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: headerAccent, userSelect: 'none' }}>
          Lito Studio CMS
        </span>
      </div>
    </div>
  )
}

// ── Main canvas ───────────────────────────────────────────────────────────────

export function EditorCanvas() {
  const {
    blockDoc: doc, selectedBlockId, selectBlock,
    reorderBlocks, previewMode, zoomLevel, editorMode,
  } = useEditorStore()

  const { templateSlug } = useTemplateManifest()
  const tokens           = getCanvasTokens(templateSlug)
  const {
    headerBg, headerText, headerAccent,
    '--font-display': fontDisplay,
    '--font-body':    fontBody,
    ...cssVars
  } = tokens

  // BUG-008 fix: use the real site name from the Zustand store instead of the
  // hardcoded name in templateCanvasTokens. Falls back to token default when no
  // active site is loaded (e.g. during initial auth flow).
  const activeSite     = useWebsiteStore((s) => s.activeSite)
  const siteName       = activeSite?.name ?? tokens.siteName

  // BUG-009 fix: derive nav links from the 'pages-all' React Query cache so the
  // mock header reflects the actual pages created in the CMS.
  // Uses getQueryData (no refetch) — PagesPageContainer already populates this cache.
  const qc = useQueryClient()
  const navLinks = useMemo(() => {
    const templateFallback = (TEMPLATE_CHROME[templateSlug ?? 'lito'] ?? TEMPLATE_CHROME.lito).fallbackNav
    if (!activeSite?.id) return templateFallback
    type CachedPage = { slug: string; status?: string; page_translations?: { title?: string; locale?: string }[] }
    const cached = qc.getQueryData<CachedPage[]>(['pages-all', activeSite.id ?? ''])
    if (!cached || cached.length === 0) return templateFallback
    // Only show active/published pages; derive display label from translation or slug
    return cached
      .filter((p) => !p.status || p.status === 'active')
      .slice(0, 6)
      .map((p) => {
        const t = p.page_translations?.find((tr) => tr.locale === 'en') ?? p.page_translations?.[0]
        const title = t?.title ?? p.slug
        return title.charAt(0).toUpperCase() + title.slice(1)
      })
  }, [activeSite?.id, qc])

  const canvasRef = useRef<HTMLDivElement>(null)
  const dragIdx   = useRef<number | null>(null)
  const [dragOver,   setDragOver]   = useState<number | null>(null)
  const [hoveredId,  setHoveredId]  = useState<string | null>(null)

  const canvasWidth  =
    previewMode === 'mobile' ? 375 :
    previewMode === 'tablet' ? 768 :
    '100%'

  const handleDragStart = (idx: number) => { dragIdx.current = idx }
  const handleDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOver(idx) }
  const handleDrop      = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault()
    if (dragIdx.current !== null && dragIdx.current !== toIdx) {
      reorderBlocks(dragIdx.current, toIdx)
    }
    dragIdx.current = null
    setDragOver(null)
  }
  const handleDragEnd = () => { dragIdx.current = null; setDragOver(null) }

  const addEmptyBlock = () => {
    const { addBlock } = useEditorStore.getState()
    addBlock({
      id: Math.random().toString(36).slice(2, 10),
      type: 'heading',
      data: { level: 1, text: '' },
      styles: {},
      visibility: { desktop: true, tablet: true, mobile: true },
    })
  }

  // ── Page column style ────────────────────────────────────────────────────
  const pageColumnStyle = {
    width:          '100%',
    maxWidth:       canvasWidth,
    minHeight:      '100%',
    display:        'flex',
    flexDirection:  'column',
    boxShadow:      '0 0 0 1px var(--lito-border), 0 4px 32px rgba(0,0,0,0.08)',
    transition:     'max-width 300ms',
    position:       'relative',
    transformOrigin: 'top center',
    transform:      zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
    // Inject template CSS variable overrides so BlockRenderer picks up template palette.
    // canvas-website-tokens.css further refines via [data-template] CSS.
    '--font-display': fontDisplay,
    '--font-body':    fontBody,
    ...cssVars,
  } as React.CSSProperties

  // ── Standalone canvas — CMS renders sections with internal visual renderers ──
  return (
    <div
      data-editor-canvas
      data-device-mode={previewMode}
      ref={canvasRef}
      className="flex-1 overflow-y-auto flex justify-center items-start min-h-0 relative"
      style={{ background: cssVars['--cms-main-bg'], colorScheme: 'light' }}
    >
      {/* Floating text toolbar — appears on contentEditable text selection */}
      <FloatingTextToolbar
        canvasRef={canvasRef as React.RefObject<HTMLDivElement | null>}
        isPreview={editorMode === 'preview'}
      />
        {/* Page column — data-template activates scoped CSS vars from canvas-website-tokens.css */}
        <div
          data-template={templateSlug ?? 'lito'}
          style={pageColumnStyle}
        >
        {/* Mock site header */}
        <MockSiteHeader
          headerBg={headerBg}
          headerText={headerText}
          headerAccent={headerAccent}
          siteName={siteName}
          fontDisplay={fontDisplay}
          fontBody={fontBody}
          previewMode={previewMode}
          navLinks={navLinks}
          templateSlug={templateSlug ?? 'lito'}
        />
        {/* Page body — template background */}
        <div className="flex-1" style={{ background: cssVars['--cms-card-bg'] as string }}>
        {doc.blocks.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 p-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--cms-surface-3)] flex items-center justify-center">
              <Plus size={28} className="text-[var(--text-muted)]" />
            </div>
            <div className="text-center">
              <p className="font-display text-[15px] font-semibold text-[var(--text-primary)] mt-0 mb-1">
                No blocks yet
              </p>
              <p className="font-body text-[13px] text-[var(--text-muted)] m-0">
                Pick a block from the left panel to start building your page.
              </p>
            </div>
            <button
              type="button"
              onClick={addEmptyBlock}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-[var(--lito-border)] bg-transparent cursor-pointer font-body text-[13px] text-[var(--text-muted)] transition-[border-color,color] duration-150 hover:border-[var(--lito-teal)] hover:text-[var(--lito-teal)]"
            >
              <Plus size={16} />
              Add Heading block
            </button>
          </div>
        ) : (
          <div className="relative">
            {doc.blocks.map((block: Block, idx: number) => {
              const isSelected   = block.id === selectedBlockId
              const isFirst      = idx === 0
              const isLast       = idx === doc.blocks.length - 1
              const isDragTarget = dragOver === idx
              const isPreview    = editorMode === 'preview'
              const isLocked     = !!block.locked
              const isHidden     = block.visibility?.desktop === false &&
                                   block.visibility?.tablet  === false &&
                                   block.visibility?.mobile  === false

              const isHovered = hoveredId === block.id
              return (
                <div
                  key={block.id}
                  data-block-id={block.id}
                  role="region"
                  aria-label={`${block.name ?? block.type} block${isLocked ? ' (locked)' : ''}`}
                  aria-selected={isSelected}
                  onClick={() => !isPreview && !isLocked && selectBlock(block.id)}
                  onMouseEnter={() => !isPreview && setHoveredId(block.id)}
                  onMouseLeave={() => !isPreview && setHoveredId(null)}
                  onDragOver={(e) => !isPreview && handleDragOver(e, idx)}
                  onDrop={(e) => !isPreview && handleDrop(e, idx)}
                  className={`group relative transition-[box-shadow] duration-[120ms] ${isSelected ? 'z-[10]' : ''} ${isPreview ? 'cursor-default' : isLocked ? 'cursor-not-allowed' : 'cursor-default'} ${isHidden && !isPreview ? 'opacity-40' : 'opacity-100'}`}
                  style={{
                    boxShadow: !isPreview && isSelected
                      ? 'inset 0 0 0 2px rgba(201,162,90,0.6)'
                      : !isPreview && isLocked
                        ? 'inset 0 0 0 1px rgba(201,162,90,0.35)'
                        : 'none',
                    borderTop: !isPreview && isDragTarget ? '2px solid var(--lito-teal)' : '2px solid transparent',
                  }}
                >
                  {/* Section Chrome Badge — shown on hover or select */}
                  {!isPreview && !isLocked && (isHovered || isSelected) && (
                    <div className="absolute top-2.5 left-2.5 z-[22] inline-flex items-center gap-px bg-[rgba(13,13,13,0.85)] border border-[rgba(201,162,90,0.45)] rounded-md backdrop-blur-[6px] shadow-[0_2px_12px_rgba(0,0,0,0.3)] overflow-hidden pointer-events-none">
                      <span className="px-2.5 py-1 font-body text-[10px] font-semibold tracking-[0.07em] uppercase text-[rgba(201,162,90,0.9)]">
                        {block.name ?? block.type}
                      </span>
                    </div>
                  )}

                  {/* Hidden badge */}
                  {!isPreview && isHidden && (
                    <div className="absolute left-2 top-2 z-[21]">
                      <span className="inline-flex items-center gap-1 px-[6px] py-[2px] bg-[rgba(0,0,0,0.5)] text-white font-body text-[9px] font-semibold rounded">
                        HIDDEN
                      </span>
                    </div>
                  )}

                  {/* Block actions toolbar */}
                  {!isPreview && isSelected && !isLocked && (
                    <BlockActions
                      block={block}
                      isFirst={isFirst}
                      isLast={isLast}
                      onDragStart={() => handleDragStart(idx)}
                      onDragEnd={handleDragEnd}
                      containerRef={canvasRef as React.RefObject<HTMLDivElement | null>}
                    />
                  )}

                  {/* Locked overlay — click to unlock */}
                  {!isPreview && isLocked && (
                    <div
                      className="absolute inset-0 z-[15] flex items-start justify-end p-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        useEditorStore.getState().lockBlock(block.id, false)
                      }}
                      title="Click to unlock"
                    >
                      <div className="flex items-center gap-1 px-2 py-[3px] bg-[rgba(234,179,8,0.9)] rounded-md font-body text-[11px] font-semibold text-[#1a1a0a] cursor-pointer">
                        <Lock size={11} />
                        Locked · Click to unlock
                      </div>
                    </div>
                  )}

                  {/* Block content */}
                  <BlockRenderer block={block} template={templateSlug ?? 'lito'} />

                  {/* Insert button */}
                  {!isPreview && isSelected && !isLocked && (
                    <InsertButton afterBlockId={block.id} />
                  )}
                </div>
              )
            })}

            {/* Bottom drop zone */}
            {editorMode !== 'preview' && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(doc.blocks.length) }}
                onDrop={(e) => handleDrop(e, doc.blocks.length)}
                className="py-6 flex flex-col items-center gap-[10px]"
                style={{
                  borderTop: dragOver === doc.blocks.length
                    ? '2px solid var(--lito-teal)'
                    : '1px dashed var(--lito-border)',
                }}
              >
                <p className="font-body text-xs text-[var(--text-muted)] m-0">
                  Drag block here or
                </p>
                <button
                  type="button"
                  onClick={addEmptyBlock}
                  className="flex items-center gap-[6px] px-[14px] py-[5px] rounded-[7px] border border-[var(--lito-border)] bg-[var(--cms-card-bg)] cursor-pointer font-body text-xs text-[var(--text-secondary)] transition-[border-color,color] duration-150 hover:border-[var(--lito-teal)] hover:text-[var(--lito-teal)]"
                >
                  <Plus size={13} />
                  Add Block
                </button>
              </div>
            )}
          </div>
        )}
        </div>{/* end page body */}

        {/* Mock site footer */}
        <MockSiteFooter
          headerBg={headerBg}
          headerText={headerText}
          headerAccent={headerAccent}
          siteName={siteName}
          fontDisplay={fontDisplay}
          fontBody={fontBody}
          previewMode={previewMode}
          navLinks={navLinks}
          templateSlug={templateSlug ?? 'lito'}
        />
        </div>{/* end page column */}
    </div>
  )
}
