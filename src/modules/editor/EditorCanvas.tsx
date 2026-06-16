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
  ImageIcon, Code2, Menu,
} from 'lucide-react'
import { useEditorStore }       from '@/stores/editor.store'
import { BlockRenderer }        from './blocks/BlockRenderer'
import { useTemplateManifest }  from '@/hooks/useTemplateManifest'
import { getCanvasTokens }      from './templateCanvasTokens'
import type { Block }           from '@/types/editor.types'

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

  const itemStyle = (item: ContextMenuItem): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 12px',
    border: 'none', background: 'none', cursor: item.disabled ? 'default' : 'pointer',
    width: '100%', textAlign: 'left',
    fontFamily: 'var(--font-body)', fontSize: 12,
    color: item.danger
      ? '#f87171'
      : item.disabled
        ? 'rgba(255,255,255,0.25)'
        : 'rgba(255,255,255,0.85)',
    borderRadius: 4,
    transition: 'background 80ms',
    opacity: item.disabled ? 0.5 : 1,
  })

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Block options"
      style={{
        position: 'absolute',
        top: pos.top,
        right: pos.right,
        zIndex: 200,
        background: '#1a1a1a',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        padding: '4px 0',
        minWidth: 188,
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      {groups.map((group, gi) => (
        <div key={gi} role="group">
          {gi > 0 && (
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '3px 8px' }} aria-hidden="true" />
          )}
          {group.items.map((item, ii) => (
            <button
              key={ii}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              aria-disabled={item.disabled}
              onClick={item.disabled ? undefined : item.action}
              style={itemStyle(item)}
              onMouseEnter={e => {
                if (!item.disabled) {
                  e.currentTarget.style.background = item.danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'
                }
              }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              <span style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true">
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

  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: 4,
    border: 'none', background: 'transparent', cursor: 'pointer',
    color: 'rgba(255,255,255,0.75)',
    transition: 'background 100ms, color 100ms',
    flexShrink: 0,
  }

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen((o) => !o)
  }

  return (
    <div
      ref={anchorRef as React.RefObject<HTMLDivElement>}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', top: 8, right: 8, zIndex: 20,
        display: 'flex', alignItems: 'center',
        background: '#1a1a1a',
        borderRadius: 8,
        padding: '2px 3px',
        gap: 1,
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      {/* Drag grip */}
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        role="button"
        tabIndex={0}
        aria-label="Drag to reorder block"
        style={{ ...btnStyle, cursor: 'grab' }}
        title="Drag to reorder"
      >
        <GripVertical size={13} />
      </div>

      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} aria-hidden="true" />

      {/* Move up */}
      <button
        type="button"
        disabled={isFirst}
        onClick={() => moveBlockUp(block.id)}
        title="Move up"
        aria-label="Move block up"
        style={{ ...btnStyle, opacity: isFirst ? 0.25 : 1 }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
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
        style={{ ...btnStyle, opacity: isLast ? 0.25 : 1 }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        <ChevronDown size={13} aria-hidden="true" />
      </button>

      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} aria-hidden="true" />

      {/* Duplicate */}
      <button
        type="button"
        onClick={() => duplicateBlock(block.id)}
        title="Duplicate block"
        aria-label="Duplicate block"
        style={btnStyle}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)' }}
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
        style={{
          ...btnStyle,
          background: menuOpen ? 'rgba(255,255,255,0.14)' : 'transparent',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = menuOpen ? 'rgba(255,255,255,0.14)' : 'transparent' }}
      >
        <MoreVertical size={12} aria-hidden="true" />
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={() => removeBlock(block.id)}
        title="Delete block"
        aria-label="Delete block"
        style={btnStyle}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.25)'; (e.currentTarget as HTMLElement).style.color = '#f87171' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)' }}
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
    <div style={{
      position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
      zIndex: 30,
    }}>
      <button
        type="button"
        onClick={handleClick}
        title="Add block here"
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--lito-teal)',
          border: '2px solid white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'transform 120ms',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

// ── Mock site header (Gutenberg-style template preview bar) ──────────────────

interface MockSiteHeaderProps {
  headerBg:     string
  headerText:   string
  headerAccent: string
  siteName:     string
  fontDisplay:  string
  fontBody:     string
}

function MockSiteHeader({ headerBg, headerText, headerAccent, siteName, fontDisplay, fontBody }: MockSiteHeaderProps) {
  const navItems = ['Home', 'About', 'Portfolio', 'Journal', 'Contact']
  return (
    <div
      aria-label="Template site header preview"
      role="banner"
      style={{
        background: headerBg,
        color: headerText,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
        height: 64,
        flexShrink: 0,
        borderBottom: `1px solid ${headerAccent}22`,
        position: 'relative',
        zIndex: 5,
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: fontDisplay, fontSize: 18, fontWeight: 600,
        letterSpacing: '0.04em',
        color: headerText,
        userSelect: 'none',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: headerAccent,
          display: 'inline-block', flexShrink: 0,
        }} aria-hidden="true" />
        {siteName}
      </div>

      {/* Nav */}
      <nav aria-label="Template navigation preview" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        {navItems.map((item) => (
          <span
            key={item}
            style={{
              fontFamily: fontBody, fontSize: 12, fontWeight: 500,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: `${headerText}bb`,
              cursor: 'default',
              userSelect: 'none',
            }}
          >
            {item}
          </span>
        ))}
      </nav>

      {/* Hamburger — mobile hint */}
      <Menu size={18} style={{ color: `${headerText}88` }} aria-hidden="true" />

      {/* "Preview" badge */}
      <div style={{
        position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
        background: headerAccent,
        color: '#fff',
        fontFamily: fontBody, fontSize: 9, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        padding: '2px 10px', borderRadius: 20,
        pointerEvents: 'none',
        zIndex: 10,
      }} aria-hidden="true">
        Template Preview
      </div>
    </div>
  )
}

// ── Mock site footer ──────────────────────────────────────────────────────────

function MockSiteFooter({ headerBg, headerText, headerAccent, siteName, fontDisplay, fontBody }: MockSiteHeaderProps) {
  return (
    <div
      aria-label="Template site footer preview"
      role="contentinfo"
      style={{
        background: headerBg,
        color: `${headerText}88`,
        padding: '32px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: `1px solid ${headerAccent}22`,
        flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: fontDisplay, fontSize: 14, color: headerText, userSelect: 'none' }}>
        {siteName}
      </span>
      <span style={{ fontFamily: fontBody, fontSize: 11, userSelect: 'none' }}>
        © {new Date().getFullYear()} · All rights reserved
      </span>
      <span style={{
        fontFamily: fontBody, fontSize: 10, fontWeight: 600,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: headerAccent, userSelect: 'none',
      }}>
        Lito Studio CMS
      </span>
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

  const canvasWidth =
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

  return (
    <div
      data-editor-canvas
      ref={canvasRef}
      style={{
        flex: 1, overflowY: 'auto',
        background: cssVars['--cms-main-bg'],
        display: 'flex', justifyContent: 'center',
        minHeight: 0,
        position: 'relative',
      }}
    >
      {/* Page column — inherits template CSS vars */}
      <div
        style={{
          width: '100%',
          maxWidth: canvasWidth,
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 0 0 1px var(--lito-border), 0 4px 32px rgba(0,0,0,0.08)',
          transition: 'max-width 300ms',
          position: 'relative',
          transformOrigin: 'top center',
          transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
          // ── Inject template CSS variable overrides scoped to this column ──
          '--font-display': fontDisplay,
          '--font-body':    fontBody,
          ...cssVars,
        } as React.CSSProperties}
      >
        {/* Mock site header */}
        <MockSiteHeader
          headerBg={headerBg}
          headerText={headerText}
          headerAccent={headerAccent}
          siteName={siteName}
          fontDisplay={fontDisplay}
          fontBody={fontBody}
        />
        {/* Page body — template background */}
        <div style={{ flex: 1, background: cssVars['--cms-card-bg'] as string }}>
        {doc.blocks.length === 0 ? (
          /* Empty state */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '60vh', gap: 20, padding: 32,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'var(--cms-surface-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                No blocks yet
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Pick a block from the left panel to start building your page.
              </p>
            </div>
            <button
              type="button"
              onClick={addEmptyBlock}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 8,
                border: '2px dashed var(--lito-border)',
                background: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13,
                color: 'var(--text-muted)',
                transition: 'border-color 150ms, color 150ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--lito-teal)'; (e.currentTarget as HTMLElement).style.color = 'var(--lito-teal)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--lito-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
            >
              <Plus size={16} />
              Add Heading block
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
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
                    <div style={{
                      position: 'absolute', left: 0, top: 0,
                      zIndex: 21, transform: 'translateY(-100%)',
                    }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '2px 8px',
                        background: isLocked ? 'var(--lito-gold)' : 'var(--lito-teal)',
                        color: isLocked ? 'var(--lito-dark)' : '#fff',
                        fontFamily: 'var(--font-body)',
                        fontSize: 10, fontWeight: 600,
                        borderRadius: '4px 4px 0 0',
                        textTransform: 'capitalize',
                      }}>
                        {isLocked && <Lock size={9} />}
                        {block.name ?? block.type}
                      </span>
                    </div>
                  )}

                  {/* Hidden badge */}
                  {!isPreview && isHidden && (
                    <div style={{
                      position: 'absolute', left: 8, top: 8, zIndex: 21,
                    }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '2px 6px',
                        background: 'rgba(0,0,0,0.5)',
                        color: '#fff',
                        fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 600,
                        borderRadius: 4,
                      }}>
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
                      style={{
                        position: 'absolute', inset: 0, zIndex: 15,
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                        padding: 8,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        useEditorStore.getState().lockBlock(block.id, false)
                      }}
                      title="Click to unlock"
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px',
                        background: 'rgba(234,179,8,0.9)',
                        borderRadius: 6,
                        fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                        color: '#1a1a0a', cursor: 'pointer',
                      }}>
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
                style={{
                  padding: '24px 0',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 10,
                  borderTop: dragOver === doc.blocks.length
                    ? '2px solid var(--lito-teal)'
                    : '1px dashed var(--lito-border)',
                }}
              >
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Drag block here or
                </p>
                <button
                  type="button"
                  onClick={addEmptyBlock}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px', borderRadius: 7,
                    border: '1px solid var(--lito-border)',
                    background: 'var(--cms-card-bg)', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 12,
                    color: 'var(--text-secondary)',
                    transition: 'border-color 150ms, color 150ms',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--lito-teal)'; (e.currentTarget as HTMLElement).style.color = 'var(--lito-teal)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--lito-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
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
        />
      </div>
    </div>
  )
}
