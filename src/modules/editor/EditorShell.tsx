/**
 * EditorShell — full-screen frame: toolbar + left sidebar + canvas + right sidebar.
 * Handles keyboard shortcuts (⌘Z, ⌘⇧Z, ⌘S) and auto-save.
 *
 * Generic: callers supply saveFn/publishFn so the shell is reusable across
 * pages, stories, journal, services, destinations, etc.
 */

import { useEffect, useCallback } from 'react'
import { EditorToolbar }      from './EditorToolbar'
import type { SupportedLocale } from './EditorToolbar'
import { EditorLeftSidebar }  from './EditorLeftSidebar'
import { EditorCanvas }       from './EditorCanvas'
import { EditorCodeView }     from './EditorCodeView'
import { EditorRightSidebar } from './EditorRightSidebar'
import { EditorAiPanel }      from './EditorAiPanel'
import { useEditorStore }     from '@/stores/editor.store'

interface EditorShellProps {
  /** Title shown in the toolbar save-status area */
  pageTitle:       string
  /** Page ID — used to open the CMS-internal preview route */
  pageId?:         string
  /** Slug used as fallback for external preview */
  pageSlug?:       string
  /**
   * Called when the user saves. Must handle setting saveStatus via
   * setSaveStatus / markClean from useEditorStore.
   */
  saveFn:          () => Promise<void>
  /**
   * Called when the user publishes (Publish button).
   * Default behaviour: call saveFn then do nothing more — callers should
   * override to also set content status to 'active'.
   */
  publishFn?:      () => Promise<void>
  /** Currently active locale for multi-language editing */
  activeLocale?:   SupportedLocale
  /** Called when user switches locale in the toolbar */
  onLocaleChange?: (locale: SupportedLocale) => void
}

export function EditorShell({
  pageTitle, pageId, pageSlug, saveFn, publishFn,
  activeLocale, onLocaleChange,
}: EditorShellProps) {
  const {
    undo, redo, canUndo, canRedo,
    isDirty, setSaveStatus, markClean,
    leftSidebarOpen, rightSidebarOpen, aiPanelOpen,
    editorMode, setEditorMode,
  } = useEditorStore()

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!isDirty) return
    setSaveStatus('saving')
    try {
      await saveFn()
      markClean()
    } catch {
      setSaveStatus('error')
    }
  }, [isDirty, saveFn, setSaveStatus, markClean])

  // ── Publish ───────────────────────────────────────────────────────────────

  const handlePublish = useCallback(async () => {
    setSaveStatus('saving')
    try {
      if (publishFn) {
        await publishFn()
      } else {
        await saveFn()
      }
      markClean()
    } catch {
      setSaveStatus('error')
    }
  }, [publishFn, saveFn, setSaveStatus, markClean])

  // ── Preview ───────────────────────────────────────────────────────────────

  const handlePreview = useCallback(async () => {
    // Auto-save unsaved changes first so the preview shows the latest content
    if (isDirty) {
      setSaveStatus('saving')
      try {
        await saveFn()
        markClean()
      } catch {
        // Continue to preview even if save failed — user sees last saved version
        setSaveStatus('error')
      }
    }
    // Open CMS-internal preview route (reads BlockDocument from DB — correct data source)
    // Falls back to external website URL if no pageId (non-block-editor contexts)
    if (pageId) {
      window.open(`/pages/${pageId}/preview`, '_blank', 'noopener,noreferrer')
    } else {
      const base = (import.meta.env.VITE_WEBSITE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
      window.open(`${base}/${pageSlug ?? ''}?preview=1`, '_blank', 'noopener,noreferrer')
    }
  }, [pageId, pageSlug, isDirty, saveFn, setSaveStatus, markClean])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = /Mac/i.test(navigator.platform)
      const mod   = isMac ? e.metaKey : e.ctrlKey

      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); if (canUndo()) undo() }
      if (mod && e.key === 'z' && e.shiftKey)  { e.preventDefault(); if (canRedo()) redo() }
      if (mod && e.key === 'y')                 { e.preventDefault(); if (canRedo()) redo() }
      if (mod && e.key === 's')                 { e.preventDefault(); void handleSave() }
      // Code / Visual mode toggle
      if (mod && e.shiftKey && e.key === 'E')  {
        e.preventDefault()
        setEditorMode(editorMode === 'code' ? 'content' : 'code')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canUndo, canRedo, undo, redo, handleSave, editorMode, setEditorMode])

  // ── Auto-save every 30 s when dirty ──────────────────────────────────────

  useEffect(() => {
    const id = setInterval(() => {
      if (isDirty) void handleSave()
    }, 30_000)
    return () => clearInterval(id)
  }, [isDirty, handleSave])

  // ── Warn on unload ────────────────────────────────────────────────────────

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[var(--cms-main-bg)]">
      <EditorToolbar
        pageTitle={pageTitle}
        onSave={() => void handleSave()}
        onPublish={handlePublish}
        onPreview={handlePreview}
        activeLocale={activeLocale}
        onLocaleChange={onLocaleChange}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {leftSidebarOpen && <EditorLeftSidebar />}
        {editorMode === 'code' ? <EditorCodeView /> : <EditorCanvas />}
        {rightSidebarOpen && editorMode !== 'code' && <EditorRightSidebar />}
      </div>

      {aiPanelOpen && <EditorAiPanel />}
    </div>
  )
}
