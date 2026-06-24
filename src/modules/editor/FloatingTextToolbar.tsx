/**
 * FloatingTextToolbar — Gutenberg-style floating toolbar for canvas text editing.
 *
 * Appears when the user selects text inside a contentEditable block on the
 * editor canvas. Positions itself above the selection rectangle.
 *
 * Controls:
 *  - Heading selector (H1–H6 + Paragraph)
 *  - Bold / Italic / Underline
 *  - Align Left / Center / Right / Justify
 *  - Insert Link
 *
 * Uses document.execCommand for formatting (widely supported in contentEditable
 * contexts despite being deprecated in the broader DOM spec). The commands apply
 * directly to the selected range without touching the store — the block's
 * onBlur handler in BlockRenderer persists the resulting HTML.
 *
 * Scoped to [data-editor-canvas] so it never appears outside the canvas.
 *
 * Unavoidable inline styles (2 only):
 *   top / left  on the fixed toolbar div — dynamic viewport-relative coords from JS
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Bold, Italic, Underline, Link,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ChevronDown,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

/** Viewport-fixed coordinates (used with position:fixed via portal) */
interface ToolbarPos {
  top:  number
  left: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function execFmt(cmd: string, value?: string) {
  document.execCommand(cmd, false, value)
}

function isActive(cmd: string): boolean {
  try { return document.queryCommandState(cmd) } catch { return false }
}

// ── Shared button class helper ────────────────────────────────────────────────

function btnCls(active: boolean) {
  return [
    'flex items-center justify-center gap-[3px]',
    'min-w-7 h-7 px-[6px]',
    'border-0 rounded-[5px] cursor-pointer',
    'transition-[background] duration-[80ms]',
    active
      ? 'bg-[rgba(212,168,83,0.2)] text-[var(--lito-gold,#D4A853)]'
      : 'bg-transparent text-[rgba(255,255,255,0.82)]',
  ].join(' ')
}

// ── Divider ───────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div
      aria-hidden="true"
      className="w-px h-[18px] bg-[rgba(255,255,255,0.12)] mx-[3px] shrink-0"
    />
  )
}

// ── Heading dropdown ──────────────────────────────────────────────────────────

const HEADING_OPTIONS = [
  { label: 'Paragraph', value: 'p' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
  { label: 'Heading 4', value: 'h4' },
  { label: 'Heading 5', value: 'h5' },
  { label: 'Heading 6', value: 'h6' },
]

function getCurrentTag(): string {
  try {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return 'p'
    let node: Node | null = sel.getRangeAt(0).commonAncestorContainer
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement
    const el = node as Element | null
    return el?.closest('h1,h2,h3,h4,h5,h6,p,blockquote')?.tagName.toLowerCase() ?? 'p'
  } catch { return 'p' }
}

// Map heading value → classes for the dropdown option text
function optionTextCls(value: string, selected: boolean): string {
  const sizeMap: Record<string, string> = {
    p:  'text-[12px] font-normal font-body',
    h1: 'text-[17px] font-semibold font-display',
    h2: 'text-[15px] font-semibold font-display',
    h3: 'text-[14px] font-semibold font-display',
    h4: 'text-[13px] font-semibold font-display',
    h5: 'text-[13px] font-semibold font-display',
    h6: 'text-[13px] font-semibold font-display',
  }
  const base = sizeMap[value] ?? 'text-[12px] font-normal font-body'
  const color = selected ? 'text-[var(--lito-gold,#D4A853)]' : 'text-[rgba(255,255,255,0.82)]'
  const bg    = selected ? 'bg-[rgba(212,168,83,0.15)]' : 'bg-transparent'
  return `block w-full text-left py-[7px] px-[14px] border-0 cursor-pointer ${base} ${color} ${bg}`
}

interface HeadingDropdownProps {
  onSelect: (tag: string) => void
}

function HeadingDropdown({ onSelect }: HeadingDropdownProps) {
  const [open, setOpen] = useState(false)
  const [tag,  setTag]  = useState('p')
  const ref             = useRef<HTMLDivElement>(null)

  const handleOpen = () => {
    setTag(getCurrentTag())
    setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const current = HEADING_OPTIONS.find(o => o.value === tag) ?? HEADING_OPTIONS[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); handleOpen() }}
        className={btnCls(false)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Text format"
      >
        <span className="text-[11px] font-semibold tracking-[0.04em] whitespace-nowrap pr-[2px]">
          {current.label}
        </span>
        <ChevronDown size={11} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] rounded-lg overflow-hidden min-w-[130px] shadow-[0_8px_24px_rgba(0,0,0,0.5)] z-[9999]"
        >
          {HEADING_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={tag === opt.value}
              onMouseDown={(e) => {
                e.preventDefault()
                execFmt('formatBlock', `<${opt.value}>`)
                setTag(opt.value)
                setOpen(false)
                onSelect(opt.value)
              }}
              className={optionTextCls(opt.value, tag === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Link dialog ───────────────────────────────────────────────────────────────

interface LinkDialogProps {
  onInsert: (url: string) => void
  onClose:  () => void
}

function LinkDialog({ onInsert, onClose }: LinkDialogProps) {
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <div className="flex items-center gap-[6px] py-1 px-2">
      <input
        ref={inputRef}
        type="url"
        value={url}
        placeholder="https://..."
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter')  { e.preventDefault(); onInsert(url) }
          if (e.key === 'Escape') { e.preventDefault(); onClose() }
        }}
        className="w-[200px] py-1 px-2 rounded-[5px] border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)] font-body text-[12px] text-[rgba(255,255,255,0.9)] outline-none"
      />
      <button
        type="button"
        onMouseDown={e => { e.preventDefault(); onInsert(url) }}
        className="flex items-center justify-center min-w-7 h-7 px-[10px] border-0 rounded-[5px] cursor-pointer bg-[rgba(212,168,83,0.25)] text-[var(--lito-gold)] transition-[background] duration-[80ms]"
      >
        Insert
      </button>
      <button
        type="button"
        onMouseDown={e => { e.preventDefault(); onClose() }}
        className="flex items-center justify-center min-w-7 h-7 px-[6px] border-0 rounded-[5px] cursor-pointer bg-transparent text-[rgba(255,255,255,0.4)] transition-[background] duration-[80ms]"
      >
        ✕
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface FloatingTextToolbarProps {
  /** Ref to the [data-editor-canvas] wrapper — toolbar is scoped inside it */
  canvasRef: React.RefObject<HTMLDivElement | null>
  /** Do not show in preview mode */
  isPreview?: boolean
}

export function FloatingTextToolbar({ canvasRef, isPreview }: FloatingTextToolbarProps) {
  const [pos,      setPos]      = useState<ToolbarPos | null>(null)
  const [showLink, setShowLink] = useState(false)
  const savedRange              = useRef<Range | null>(null)
  const toolbarRef              = useRef<HTMLDivElement>(null)

  const saveSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange()
    }
  }, [])

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && savedRange.current) {
      sel.removeAllRanges()
      sel.addRange(savedRange.current)
    }
  }, [])

  useEffect(() => {
    if (isPreview) { setPos(null); return }

    function onSelectionChange() {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        const active = document.activeElement
        if (toolbarRef.current?.contains(active)) return
        setPos(null)
        setShowLink(false)
        return
      }

      const range    = sel.getRangeAt(0)
      const ancestor = range.commonAncestorContainer

      if (!canvasRef.current || !canvasRef.current.contains(ancestor)) {
        setPos(null)
        return
      }

      let el: Element | null = ancestor instanceof Element
        ? ancestor
        : ancestor.parentElement
      let editable = false
      while (el) {
        if ((el as HTMLElement).isContentEditable) { editable = true; break }
        el = el.parentElement
      }
      if (!editable) { setPos(null); return }

      const rect      = range.getBoundingClientRect()
      const TOOLBAR_H = 40
      const HALF_W    = 180
      const rawLeft   = rect.left + rect.width / 2
      const clampedLeft = Math.max(HALF_W + 8, Math.min(rawLeft, window.innerWidth - HALF_W - 8))

      setPos({
        top:  rect.top  + window.scrollY - TOOLBAR_H - 8,
        left: clampedLeft,
      })
      setShowLink(false)
    }

    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [isPreview, canvasRef])

  if (!pos || isPreview) return null

  const fmt = (cmd: string, value?: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    restoreSelection()
    execFmt(cmd, value)
    window.getSelection()?.collapseToEnd()
    window.getSelection()?.extend(
      savedRange.current?.endContainer ?? document.body,
      savedRange.current?.endOffset ?? 0,
    )
  }

  const handleLinkInsert = (url: string) => {
    restoreSelection()
    if (url) execFmt('createLink', url)
    setShowLink(false)
  }

  const toolbar = (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Text formatting"
      onMouseDown={e => { e.preventDefault(); saveSelection() }}
      // position:fixed + dynamic top/left must stay inline (viewport-relative coords from JS)
      style={{
        top:  Math.max(8, pos.top),
        left: pos.left,
      }}
      className="fixed -translate-x-1/2 z-[500] flex items-center gap-[2px] bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] rounded-[10px] py-1 px-[6px] shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-[8px] select-none pointer-events-auto whitespace-nowrap"
    >
      {showLink ? (
        <LinkDialog
          onInsert={handleLinkInsert}
          onClose={() => setShowLink(false)}
        />
      ) : (
        <>
          {/* Heading / format selector */}
          <HeadingDropdown onSelect={() => { /* tag stored via execCommand */ }} />

          <Divider />

          {/* Bold */}
          <button
            type="button"
            title="Bold (⌘B)"
            aria-pressed={isActive('bold')}
            onMouseDown={fmt('bold')}
            className={btnCls(isActive('bold'))}
          >
            <Bold size={13} />
          </button>

          {/* Italic */}
          <button
            type="button"
            title="Italic (⌘I)"
            aria-pressed={isActive('italic')}
            onMouseDown={fmt('italic')}
            className={btnCls(isActive('italic'))}
          >
            <Italic size={13} />
          </button>

          {/* Underline */}
          <button
            type="button"
            title="Underline (⌘U)"
            aria-pressed={isActive('underline')}
            onMouseDown={fmt('underline')}
            className={btnCls(isActive('underline'))}
          >
            <Underline size={13} />
          </button>

          <Divider />

          {/* Align Left */}
          <button
            type="button"
            title="Align left"
            aria-pressed={isActive('justifyLeft')}
            onMouseDown={fmt('justifyLeft')}
            className={btnCls(isActive('justifyLeft'))}
          >
            <AlignLeft size={13} />
          </button>

          {/* Align Center */}
          <button
            type="button"
            title="Align center"
            aria-pressed={isActive('justifyCenter')}
            onMouseDown={fmt('justifyCenter')}
            className={btnCls(isActive('justifyCenter'))}
          >
            <AlignCenter size={13} />
          </button>

          {/* Align Right */}
          <button
            type="button"
            title="Align right"
            aria-pressed={isActive('justifyRight')}
            onMouseDown={fmt('justifyRight')}
            className={btnCls(isActive('justifyRight'))}
          >
            <AlignRight size={13} />
          </button>

          {/* Align Justify */}
          <button
            type="button"
            title="Justify"
            aria-pressed={isActive('justifyFull')}
            onMouseDown={fmt('justifyFull')}
            className={btnCls(isActive('justifyFull'))}
          >
            <AlignJustify size={13} />
          </button>

          <Divider />

          {/* Link */}
          <button
            type="button"
            title="Insert link"
            onMouseDown={(e) => {
              e.preventDefault()
              saveSelection()
              setShowLink(true)
            }}
            className={btnCls(isActive('createLink'))}
          >
            <Link size={13} />
          </button>
        </>
      )}
    </div>
  )

  return createPortal(toolbar, document.body)
}
