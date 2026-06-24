/**
 * EditorShell — full-screen frame: toolbar + left sidebar + canvas + right sidebar.
 * Handles keyboard shortcuts (⌘Z, ⌘⇧Z, ⌘S) and auto-save.
 *
 * Generic: callers supply saveFn/publishFn so the shell is reusable across
 * pages, stories, journal, services, destinations, etc.
 */

import { useEffect, useCallback } from 'react'
import { useBlocker }         from 'react-router-dom'
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
  /** Page publish status — shown as DRAFT/LIVE badge */
  pageStatus?:     string
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
  /**
   * Called when the user unpublishes (Unpublish button, visible only when
   * pageStatus === 'active'). Callers should set page status back to 'draft'.
   */
  unpublishFn?:    () => Promise<void>
  /** Currently active locale for multi-language editing */
  activeLocale?:   SupportedLocale
  /** Called when user switches locale in the toolbar */
  onLocaleChange?: (locale: SupportedLocale) => void
}

export function EditorShell({
  pageTitle, pageId, pageSlug, pageStatus, saveFn, publishFn, unpublishFn,
  activeLocale, onLocaleChange,
}: EditorShellProps) {
  const {
    undo, redo, canUndo, canRedo,
    isDirty, setSaveStatus, markClean,
    leftSidebarOpen, rightSidebarOpen, aiPanelOpen,
    editorMode, setEditorMode,
  } = useEditorStore()

  // ── In-app navigation guard (SPA routes) ─────────────────────────────────
  // Blocks React Router navigation when there are unsaved changes.
  // beforeunload (below) covers browser tab close / refresh.
  const blocker = useBlocker(
    useCallback(({ currentLocation, nextLocation }: { currentLocation: { pathname: string }; nextLocation: { pathname: string } }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
    [isDirty]),
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    const ok = window.confirm('You have unsaved changes. Leave anyway?')
    if (ok) blocker.proceed()
    else blocker.reset()
  }, [blocker])

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!isDirty) return
    setSaveStatus('saving')
    try {
      await saveFn()
      markClean()
      // E-04: clear draft backup after successful API save
      const pid = useEditorStore.getState().pageId
      if (pid) {
        try { localStorage.removeItem(`editor_draft_${pid}`) } catch { /* ok */ }
      }
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

  // ── Unpublish ─────────────────────────────────────────────────────────────

  const handleUnpublish = useCallback(async () => {
    if (!unpublishFn) return
    setSaveStatus('saving')
    try {
      await unpublishFn()
      markClean()
    } catch {
      setSaveStatus('error')
    }
  }, [unpublishFn, setSaveStatus, markClean])

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

  // ── Debounced autosave + localStorage backup ──────────────────────────────
  // blockDoc and storePageId are read once here and shared by both effects below.

  const { blockDoc, pageId: storePageId } = useEditorStore()

  // Debounced autosave: save 2 s after the last blockDoc change.
  // Replaces the old 30 s setInterval. We watch blockDoc (not isDirty) so the
  // timer fires on every content change, not just when re-renders flip isDirty.
  useEffect(() => {
    if (!isDirty) return          // no-op if nothing has changed since last save
    const id = setTimeout(() => {
      void handleSave()
    }, 2_000)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockDoc, isDirty, handleSave])

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

  // ── E-04: localStorage draft backup — last-resort recovery ───────────────
  // Writes blockDoc to localStorage on every dirty change.
  // Key: editor_draft_{pageId} — BlockEditorPage reads this on init
  // when the saved version has no blocks (empty canvas).
  // Cleared on successful save (markClean sets isDirty=false).

  useEffect(() => {
    if (!storePageId || !isDirty) return
    try {
      localStorage.setItem(
        `editor_draft_${storePageId}`,
        JSON.stringify({ blockDoc, savedAt: Date.now() }),
      )
    } catch {
      // Quota exceeded or private browsing — silently skip
    }
  }, [blockDoc, isDirty, storePageId])

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[var(--cms-main-bg)]">
      <EditorToolbar
        pageTitle={pageTitle}
        pageStatus={pageStatus}
        onSave={() => void handleSave()}
        onPublish={handlePublish}
        onUnpublish={unpublishFn ? handleUnpublish : undefined}
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
