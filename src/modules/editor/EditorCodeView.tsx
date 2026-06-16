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
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--cms-main-bg)',
    }}>
      {/* ── Toolbar strip ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', gap: 8,
        borderBottom: '1px solid var(--lito-border)',
        background: 'var(--cms-card-bg)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            Code Editor
          </span>
          <span style={{
            fontFamily: 'monospace', fontSize: 10,
            color: 'var(--text-muted)',
            background: 'var(--cms-surface-3)',
            border: '1px solid var(--lito-border)',
            borderRadius: 4, padding: '1px 6px',
          }}>
            BlockDocument JSON
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Status message */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <AlertCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 11,
                color: '#ef4444', maxWidth: 320,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {error}
              </span>
            </div>
          )}
          {notice && !error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle2 size={13} style={{ color: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#22c55e' }}>
                {notice}
              </span>
            </div>
          )}

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset to current document"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 7,
              border: '1px solid var(--lito-border)',
              background: 'var(--cms-card-bg)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 12,
              fontWeight: 500, color: 'var(--text-muted)',
            }}
          >
            <RefreshCcw size={12} /> Reset
          </button>

          {/* Apply */}
          <button
            type="button"
            onClick={handleApply}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 14px', borderRadius: 7,
              border: 'none', background: 'var(--lito-teal)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 12,
              fontWeight: 600, color: '#fff',
            }}
          >
            Apply changes
          </button>
        </div>
      </div>

      {/* ── JSON textarea ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <textarea
          value={raw}
          onChange={(e) => { setRaw(e.target.value); setError(null); setNotice(null) }}
          spellCheck={false}
          style={{
            width: '100%', height: '100%',
            padding: '16px 20px',
            fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", Menlo, Monaco, "Courier New", monospace',
            fontSize: 13, lineHeight: 1.6,
            color: error ? '#ef4444' : 'var(--text-primary)',
            background: 'var(--cms-main-bg)',
            border: 'none', outline: 'none', resize: 'none',
            boxSizing: 'border-box',
            whiteSpace: 'pre',
            overflowWrap: 'normal',
            overflowX: 'auto',
          }}
        />
      </div>

      {/* ── Footer hint ───────────────────────────────────────────────────────── */}
      <div style={{
        padding: '6px 16px',
        borderTop: '1px solid var(--lito-border)',
        background: 'var(--cms-card-bg)',
        flexShrink: 0,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 10,
          color: 'var(--text-muted)', margin: 0,
        }}>
          Edit the raw BlockDocument JSON, then click <strong>Apply changes</strong> to update the canvas.
          Switch back to Visual mode to continue editing normally.
        </p>
      </div>
    </div>
  )
}
