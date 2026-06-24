/**
 * EditorToolbar — top chrome bar for the block editor.
 *
 * Dark / light mode:
 *   All interactive elements use CSS classes defined in globals.css (tb-*).
 *   Those classes reference --cms-* and --text-* tokens which are overridden
 *   by [data-dark] on <html> — so dark mode is automatic, zero JS required.
 *
 * Contrast audit (WCAG AA 4.5:1 for small text):
 *   tb-icon-btn / tb-action-btn inactive  → --text-secondary on --cms-card-bg
 *     Light: #5A5550 / #FFF    = 7.1:1  ✓
 *     Dark:  #9E9A95 / #1A1814 = 5.3:1  ✓
 *   Active (teal)  → #fff on #1A4A5A = 8.0:1  ✓
 *   Publish        → #fff on #1A4A5A = 8.0:1  ✓
 */

import { useCallback, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Monitor, Tablet, Smartphone,
  Undo2, Redo2, Settings2, Eye, Rocket, Loader2,
  Minus, Plus, ArrowLeft, Code2, PanelLeft, Keyboard, Globe, CloudOff,
} from 'lucide-react'
import { useEditorStore } from '@/stores/editor.store'
import { EditorShortcutsModal } from './EditorShortcutsModal'
import type { PreviewMode } from '@/types/editor.types'

export const SUPPORTED_LOCALES = [
  { code: 'id', label: 'ID' },
  { code: 'en', label: 'EN' },
] as const

export type SupportedLocale = typeof SUPPORTED_LOCALES[number]['code']

interface EditorToolbarProps {
  pageTitle:        string
  pageStatus?:      string
  onSave:           () => void
  onPublish:        () => void
  onUnpublish?:     () => void
  onPreview?:       () => void
  backUrl?:         string
  activeLocale?:    SupportedLocale
  onLocaleChange?:  (locale: SupportedLocale) => void
}

export function EditorToolbar({
  pageTitle, pageStatus, onSave, onPublish, onUnpublish, onPreview, backUrl,
  activeLocale = 'id', onLocaleChange,
}: EditorToolbarProps) {
  const navigate = useNavigate()
  const {
    saveStatus, isDirty, canUndo, canRedo,
    undo, redo, previewMode, setPreviewMode,
    zoomLevel, setZoomLevel, toggleRightSidebar,
    editorMode, setEditorMode, toggleLeftSidebar,
  } = useEditorStore()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const isCodeMode = editorMode === 'code'

  // ── Last-saved timestamp ─────────────────────────────────────────────────
  const lastSavedRef = useRef<Date | null>(null)
  const [lastSavedLabel, setLastSavedLabel] = useState<string>('')

  useEffect(() => {
    if (saveStatus === 'saved') {
      lastSavedRef.current = new Date()
      setLastSavedLabel('Just now')
    }
  }, [saveStatus])

  // Update relative label every minute
  useEffect(() => {
    const id = setInterval(() => {
      if (!lastSavedRef.current) return
      const diffMin = Math.round((Date.now() - lastSavedRef.current.getTime()) / 60_000)
      if (diffMin < 1) setLastSavedLabel('Just now')
      else if (diffMin === 1) setLastSavedLabel('1 min ago')
      else setLastSavedLabel(`${diffMin} min ago`)
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  const handleBack = useCallback(() => {
    if (backUrl) navigate(backUrl)
    else navigate(-1)
  }, [backUrl, navigate])

  // ── Save status indicator ─────────────────────────────────────────────────

  const SaveStatus = useCallback(() => {
    if (saveStatus === 'saving') {
      return (
        <div className="flex items-center gap-2">
          <Loader2 size={12} className="text-[var(--text-muted)] animate-spin" />
          <div>
            <p className="font-body text-[11px] font-semibold text-[var(--text-muted)] m-0 leading-[1.3]">Saving…</p>
            <p className="font-body text-[10px] text-[var(--text-muted)] m-0 leading-[1.3]">Please wait</p>
          </div>
        </div>
      )
    }
    if (saveStatus === 'error') {
      return (
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--s-danger)] shrink-0" />
          <div>
            <p className="font-body text-[11px] font-semibold text-[var(--s-danger)] m-0 leading-[1.3]">Save failed</p>
            <p className="font-body text-[10px] text-[var(--text-muted)] m-0 leading-[1.3]">Please try again</p>
          </div>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${isDirty ? 'bg-[var(--s-draft-fg)]' : 'bg-[var(--s-pub-fg)]'}`} />
        <div>
          <p className="font-body text-[11px] font-semibold text-[var(--text-muted)] m-0 leading-[1.3]">
            {isDirty ? 'Unsaved changes' : (saveStatus === 'saved' ? 'All saved' : pageTitle)}
          </p>
          <p className="font-body text-[10px] text-[var(--text-muted)] m-0 leading-[1.3]">
            {lastSavedLabel ? `Saved ${lastSavedLabel}` : 'Changes saved locally'}
          </p>
        </div>
      </div>
    )
  }, [saveStatus, isDirty, pageTitle, lastSavedLabel])

  const deviceModes: Array<{ mode: PreviewMode; Icon: typeof Monitor; label: string }> = [
    { mode: 'desktop', Icon: Monitor,    label: 'Desktop' },
    { mode: 'tablet',  Icon: Tablet,     label: 'Tablet'  },
    { mode: 'mobile',  Icon: Smartphone, label: 'Mobile'  },
  ]

  return (
    <>
      <div className="flex items-center justify-between h-12 px-3 border-b border-[var(--lito-border)] bg-[var(--cms-card-bg)] shrink-0 gap-[6px]">

        {/* ── Left: back + save status ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-none">
          <button
            type="button"
            onClick={handleBack}
            title="Back"
            className="tb-back-btn"
          >
            <ArrowLeft size={14} />
          </button>

          {/* Save status — click to save manually */}
          <div
            className="cursor-pointer"
            onClick={onSave}
            title="Save (⌘S)"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSave() }}
          >
            <SaveStatus />
          </div>
        </div>

        {/* ── Centre: device switcher + locale toggle ──────────────────────── */}
        <div className="flex items-center gap-2">
          <div className="tb-device-group">
            {deviceModes.map(({ mode, Icon, label }) => (
              <button
                key={mode}
                type="button"
                title={label}
                onClick={() => setPreviewMode(mode)}
                className={`tb-device-btn${previewMode === mode ? ' tb-active' : ''}`}
                aria-pressed={previewMode === mode}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>

          {/* Locale toggle — EN / ID */}
          {onLocaleChange && (
            <div className="tb-device-group flex items-center">
              <Globe size={11} className="text-[var(--text-muted)] mr-0.5" />
              {SUPPORTED_LOCALES.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  title={`Edit ${label} content`}
                  onClick={() => onLocaleChange(code)}
                  className={`tb-device-btn min-w-7 text-[11px] font-semibold${activeLocale === code ? ' tb-active' : ''}`}
                  aria-pressed={activeLocale === code}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: controls ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 shrink-0">

          {/* Zoom controls */}
          <div className="tb-zoom-group">
            <button
              type="button"
              title="Zoom out (–25%)"
              onClick={() => setZoomLevel(zoomLevel - 25)}
              className="tb-zoom-btn"
            >
              <Minus size={11} />
            </button>
            <span className="tb-zoom-val">{zoomLevel}%</span>
            <button
              type="button"
              title="Zoom in (+25%)"
              onClick={() => setZoomLevel(zoomLevel + 25)}
              className="tb-zoom-btn"
            >
              <Plus size={11} />
            </button>
          </div>

          <div className="tb-sep" />

          {/* Undo */}
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo()}
            title="Undo (⌘Z)"
            className="tb-icon-btn"
          >
            <Undo2 size={14} />
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo()}
            title="Redo (⌘⇧Z)"
            className="tb-icon-btn"
          >
            <Redo2 size={14} />
          </button>

          {/* Settings */}
          <button
            type="button"
            title="Toggle settings panel"
            onClick={() => toggleRightSidebar()}
            className="tb-icon-btn"
          >
            <Settings2 size={14} />
          </button>

          <div className="tb-sep" />

          {/* Left sidebar toggle */}
          <button
            type="button"
            title="Toggle left sidebar (⌘\)"
            onClick={() => toggleLeftSidebar()}
            className="tb-icon-btn"
          >
            <PanelLeft size={14} />
          </button>

          {/* Code / Visual toggle */}
          <button
            type="button"
            title={isCodeMode ? 'Switch to Visual mode (⌘⇧E)' : 'Switch to Code mode (⌘⇧E)'}
            onClick={() => setEditorMode(isCodeMode ? 'content' : 'code')}
            className={`tb-icon-btn${isCodeMode ? ' tb-active' : ''}`}
            aria-pressed={isCodeMode}
          >
            <Code2 size={14} />
          </button>

          {/* Keyboard shortcuts */}
          <button
            type="button"
            title="Keyboard shortcuts (⌘⇧P)"
            onClick={() => setShortcutsOpen(true)}
            className="tb-icon-btn"
          >
            <Keyboard size={14} />
          </button>

          <div className="tb-sep" />

          {/* Preview — CMS-internal block doc preview in new tab */}
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              title="Preview block editor content in new tab"
              className="tb-action-btn"
            >
              <Eye size={13} />
              Preview
            </button>
          )}

          {/* DRAFT / LIVE badge */}
          {pageStatus && (
            <span className={[
              'inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[10px] font-semibold font-body tracking-wide',
              pageStatus === 'active'
                ? 'bg-[var(--s-pub-bg)] text-[var(--s-pub-fg)]'
                : 'bg-[var(--s-draft-bg)] text-[var(--s-draft-fg)]',
            ].join(' ')}>
              <span className={`inline-block w-[5px] h-[5px] rounded-full ${pageStatus === 'active' ? 'bg-[var(--s-pub-fg)]' : 'bg-[var(--s-draft-fg)]'}`} />
              {pageStatus === 'active' ? 'LIVE' : 'DRAFT'}
            </span>
          )}

          {/* Unpublish — only visible when page is live */}
          {pageStatus === 'active' && onUnpublish && (
            <button
              type="button"
              onClick={onUnpublish}
              title="Unpublish — revert to draft"
              className="tb-action-btn"
            >
              <CloudOff size={13} />
              Unpublish
            </button>
          )}

          {/* Publish */}
          <button
            type="button"
            onClick={onPublish}
            className="tb-publish-btn"
          >
            <Rocket size={13} />
            {pageStatus === 'active' ? 'Re-publish' : 'Publish'}
          </button>
        </div>
      </div>

      {shortcutsOpen && <EditorShortcutsModal onClose={() => setShortcutsOpen(false)} />}
    </>
  )
}
