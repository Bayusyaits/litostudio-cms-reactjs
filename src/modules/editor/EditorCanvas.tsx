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

import { useRef, useState, useEffect } from 'react'
import {
  Plus, ChevronUp, ChevronDown, Copy, Trash2, GripVertical,
  MoreVertical, Scissors, ClipboardPaste, ArrowUpToLine, ArrowDownToLine,
  Paintbrush, ClipboardCopy, Group, Lock, Unlock, Tag, EyeOff,
  ImageIcon, Code2,
} from 'lucide-react'
import { useEditorStore }       from '@/stores/editor.store'
import { BlockRenderer }        from './blocks/BlockRenderer'
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
  anchorRef: React.RefObject<HTMLDivElement | null>
}

function BlockContextMenu({ block, isFirst, isLast, onClose, anchorRef }: BlockContextMenuProps) {
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

  // Position: below the anchor
  const [pos, setPos] = useState({ top: 0, right: 0 })
  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      const canvasRect = anchorRef.current.closest('[data-editor-canvas]')?.getBoundingClientRect()
      const top = rect.bottom - (canvasRect?.top ?? 0) + 4
      const right = (canvasRect?.right ?? 0) - rect.right
      setPos({ top, right })
    }
  }, [anchorRef])

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
      className="absolute z-[200] bg-[#1a1a1a] rounded-[10px] border border-[rgba(255,255,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1 min-w-[188px] overflow-hidden"
      style={{ top: pos.top, right: pos.right }}
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

      <div className="w-px h-4 bg-[rgba(255,255,255,0.12)] mx-0.5" aria-hidden="true" />

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

      <div className="w-px h-4 bg-[rgba(255,255,255,0.12)] mx-0.5" aria-hidden="true" />

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

      {/* More options (⋮) */}
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

      {/* Context menu */}
      {menuOpen && (
        <BlockContextMenu
          block={block}
          isFirst={isFirst}
          isLast={isLast}
          onClose={() => setMenuOpen(false)}
          anchorRef={anchorRef as React.RefObject<HTMLDivElement | null>}
        />
      )}
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
}

const NAV_LINKS = ['Home', 'About', 'Portfolio', 'Stories', 'Journal', 'Contact']

function MockSiteHeader({ headerBg, headerText, headerAccent, siteName, fontDisplay, fontBody, previewMode }: MockSiteHeaderProps) {
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
            {NAV_LINKS.slice(0, isTablet ? 4 : 6).map((item) => (
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
              Book Now
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
          {NAV_LINKS.map((item, i) => (
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
                borderBottom: i < NAV_LINKS.length - 1 ? `1px solid ${headerAccent}18` : 'none',
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
              Book Now
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Mock site footer ──────────────────────────────────────────────────────────

function MockSiteFooter({ headerBg, headerText, headerAccent, siteName, fontDisplay, fontBody, previewMode }: MockSiteHeaderProps) {
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
            Visual storytelling for travel, culture & community.
          </div>
        </div>
        {/* Footer nav */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 32 }}>
            {['Portfolio', 'Stories', 'Journal', 'About', 'Contact'].map(link => (
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
    headerBg, headerText, headerAccent, siteName,
    '--font-display': fontDisplay,
    '--font-body':    fontBody,
    ...cssVars
  } = tokens

  const canvasRef = useRef<HTMLDivElement>(null)
  const dragIdx   = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

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

  return (
    <div
      data-editor-canvas
      data-device-mode={previewMode}
      ref={canvasRef}
      className="flex-1 overflow-y-auto flex justify-center items-start min-h-0 relative"
      style={{ background: cssVars['--cms-main-bg'] }}
    >
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

              return (
                <div
                  key={block.id}
                  role="region"
                  aria-label={`${block.name ?? block.type} block${isLocked ? ' (locked)' : ''}`}
                  aria-selected={isSelected}
                  onClick={() => !isPreview && !isLocked && selectBlock(block.id)}
                  onDragOver={(e) => !isPreview && handleDragOver(e, idx)}
                  onDrop={(e) => !isPreview && handleDrop(e, idx)}
                  className="group"
                  style={{
                    position: 'relative',
                    transition: 'outline 100ms',
                    outline: !isPreview && isSelected
                      ? '2px solid var(--lito-teal)'
                      : !isPreview && isLocked
                        ? '1px dashed var(--lito-gold)'
                        : 'none',
                    outlineOffset: isSelected ? -2 : 0,
                    zIndex: isSelected ? 10 : 'auto',
                    borderTop: !isPreview && isDragTarget ? '2px solid var(--lito-teal)' : '2px solid transparent',
                    cursor: isPreview ? 'default' : isLocked ? 'not-allowed' : 'default',
                    opacity: isHidden && !isPreview ? 0.4 : 1,
                  }}
                >
                  {/* Block type badge (top-left of selected block) */}
                  {!isPreview && isSelected && (
                    <div className="absolute left-0 top-0 z-[21] -translate-y-full">
                      <span className={`inline-flex items-center gap-1 px-2 py-[2px] font-body text-[10px] font-semibold rounded-t capitalize ${
                        isLocked ? 'bg-[var(--lito-gold)] text-[var(--lito-dark)]' : 'bg-[var(--lito-teal)] text-white'
                      }`}>
                        {isLocked && <Lock size={9} />}
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
                  <BlockRenderer block={block} />

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
        />
        </div>{/* end page column */}
    </div>
  )
}
