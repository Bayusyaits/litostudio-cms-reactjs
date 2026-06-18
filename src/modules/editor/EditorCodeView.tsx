/**
 * EditorCodeView — Gutenberg "Code Editor" parity.
 *
 * Renders a full JSON textarea of the current BlockDocument.
 * User can edit JSON directly and click "Apply" to push changes
 * back into the store (with parse validation).
 *
 * Accessible via the </> button in EditorToolbar (sets editorMode = 'code').
 */

import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, CheckCircle2, RefreshCcw } from 'lucide-react'
import { useEditorStore } from '@/stores/editor.store'
import type { BlockDocument } from '@/types/editor.types'

function isBlockDocument(obj: unknown): obj is BlockDocument {
  if (!obj || typeof obj !== 'object') return false
  const d = obj as Record<string, unknown>
  return d.version === '1.0' && Array.isArray(d.blocks)
}

export function EditorCodeView() {
  const { blockDoc, init, pageId, locale } = useEditorStore()

  const [raw,    setRaw]    = useState(() => JSON.stringify(blockDoc, null, 2))
  const [error,  setError]  = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Sync if blockDoc changes externally (e.g. undo/redo while in code mode)
  useEffect(() => {
    setRaw(JSON.stringify(blockDoc, null, 2))
    setError(null)
  }, [blockDoc])

  const handleApply = useCallback(() => {
    setError(null)
    setNotice(null)
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      setError(`JSON parse error: ${(e as Error).message}`)
      return
    }
    if (!isBlockDocument(parsed)) {
      setError('Invalid structure: must have { version: "1.0", blocks: [...] }')
      return
    }
    init(parsed, pageId ?? '', locale)
    setNotice('Changes applied.')
    setTimeout(() => setNotice(null), 2500)
  }, [raw, pageId, locale, init])

  const handleReset = useCallback(() => {
    setRaw(JSON.stringify(blockDoc, null, 2))
    setError(null)
    setNotice('Reset to current document.')
    setTimeout(() => setNotice(null), 2000)
  }, [blockDoc])

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--cms-main-bg)]">
      {/* ── Toolbar strip ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 gap-2 border-b border-[var(--lito-border)] bg-[var(--cms-card-bg)] shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-body text-xs font-semibold text-[var(--text-primary)]">
            Code Editor
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--cms-surface-3)] border border-[var(--lito-border)] rounded px-[6px] py-[1px]">
            BlockDocument JSON
          </span>
        </div>

        <div className="flex gap-[6px] items-center">
          {/* Status message */}
          {error && (
            <div className="flex items-center gap-[5px]">
              <AlertCircle size={13} className="text-[#ef4444] shrink-0" />
              <span className="font-body text-[11px] text-[#ef4444] max-w-[320px] overflow-hidden text-ellipsis whitespace-nowrap">
                {error}
              </span>
            </div>
          )}
          {notice && !error && (
            <div className="flex items-center gap-[5px]">
              <CheckCircle2 size={13} className="text-[#22c55e] shrink-0" />
              <span className="font-body text-[11px] text-[#22c55e]">
                {notice}
              </span>
            </div>
          )}

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset to current document"
            className="flex items-center gap-[5px] px-3 py-[5px] rounded-[7px] border border-[var(--lito-border)] bg-[var(--cms-card-bg)] cursor-pointer font-body text-xs font-medium text-[var(--text-muted)]"
          >
            <RefreshCcw size={12} /> Reset
          </button>

          {/* Apply */}
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-[5px] px-[14px] py-[5px] rounded-[7px] border-none bg-[var(--lito-teal)] cursor-pointer font-body text-xs font-semibold text-white"
          >
            Apply changes
          </button>
        </div>
      </div>

      {/* ── JSON textarea ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative">
        <textarea
          value={raw}
          onChange={(e) => { setRaw(e.target.value); setError(null); setNotice(null) }}
          spellCheck={false}
          className={`w-full h-full px-5 py-4 font-mono text-[13px] leading-[1.6] bg-[var(--cms-main-bg)] border-none outline-none resize-none box-border whitespace-pre overflow-x-auto ${error ? 'text-[#ef4444]' : 'text-[var(--text-primary)]'}`}
          style={{ fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", Menlo, Monaco, "Courier New", monospace', overflowWrap: 'normal' }}
        />
      </div>

      {/* ── Footer hint ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-[6px] border-t border-[var(--lito-border)] bg-[var(--cms-card-bg)] shrink-0">
        <p className="font-body text-[10px] text-[var(--text-muted)] m-0">
          Edit the raw BlockDocument JSON, then click <strong>Apply changes</strong> to update the canvas.
          Switch back to Visual mode to continue editing normally.
        </p>
      </div>
    </div>
  )
}
