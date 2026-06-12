/**
 * EditorShell — full-screen frame: toolbar + left sidebar + canvas + right sidebar.
 * Handles keyboard shortcuts (⌘Z, ⌘⇧Z, ⌘S) and auto-save.
 */

import { useEffect, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { EditorToolbar }      from './EditorToolbar'
import { EditorLeftSidebar }  from './EditorLeftSidebar'
import { EditorCanvas }       from './EditorCanvas'
import { EditorRightSidebar } from './EditorRightSidebar'
import { EditorAiPanel }      from './EditorAiPanel'
import { useEditorStore }     from '@/stores/editor.store'
import { pagesService }       from '@/services/pages.service'

interface EditorShellProps {
  pageId:    string
  pageTitle: string
  locale:    string
}

export function EditorShell({ pageId, pageTitle, locale }: EditorShellProps) {
  const {
    blockDoc, undo, redo, canUndo, canRedo,
    setSaveStatus, markClean, isDirty,
    leftSidebarOpen, rightSidebarOpen, aiPanelOpen,
  } = useEditorStore()

  // ── Save mutation ─────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: () =>
      pagesService.update(pageId, {
        translations: [
          {
            locale,
            title: pageTitle,
            body:  blockDoc as unknown as Record<string, unknown>,
          },
        ],
      }),
    onMutate:  () => setSaveStatus('saving'),
    onSuccess: () => markClean(),
    onError:   () => setSaveStatus('error'),
  })

  const handleSave = useCallback(() => {
    if (!isDirty) return
    saveMutation.mutate()
  }, [isDirty, saveMutation])

  const handlePublish = useCallback(async () => {
    // Save first, then set status to active
    saveMutation.mutate()
    await pagesService.update(pageId, { status: 'active' })
  }, [pageId, saveMutation])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = /Mac/i.test(navigator.platform)
      const mod   = isMac ? e.metaKey : e.ctrlKey

      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); if (canUndo()) undo() }
      if (mod && e.key === 'z' && e.shiftKey)  { e.preventDefault(); if (canRedo()) redo() }
      if (mod && e.key === 'y')                 { e.preventDefault(); if (canRedo()) redo() }
      if (mod && e.key === 's')                 { e.preventDefault(); handleSave() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canUndo, canRedo, undo, redo, handleSave])

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
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--cms-main-bg)]">
      {/* Top toolbar */}
      <EditorToolbar
        pageTitle={pageTitle}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left sidebar */}
        {leftSidebarOpen && <EditorLeftSidebar />}

        {/* Canvas */}
        <EditorCanvas />

        {/* Right sidebar */}
        {rightSidebarOpen && <EditorRightSidebar />}
      </div>

      {/* AI panel — floating overlay from the right */}
      {aiPanelOpen && <EditorAiPanel />}
    </div>
  )
}
