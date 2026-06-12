/**
 * EditorToolbar — matches screenshot design exactly.
 * Left: save status dot + "Unsaved changes / All changes saved locally"
 * Center: Desktop | Tablet | Mobile device switcher (teal active)
 * Right: – 100% + | undo/redo | settings | Preview | Publish ▾
 */

import { useCallback } from 'react'
import {
  Monitor, Tablet, Smartphone,
  Undo2, Redo2, Settings2, Eye, Rocket, Loader2,
  Minus, Plus, ChevronDown,
} from 'lucide-react'
import { useEditorStore } from '@/stores/editor.store'
import type { PreviewMode } from '@/types/editor.types'

interface EditorToolbarProps {
  pageTitle: string
  onSave:    () => void
  onPublish: () => void
}

export function EditorToolbar({ pageTitle, onSave, onPublish }: EditorToolbarProps) {
  const {
    saveStatus, isDirty, canUndo, canRedo,
    undo, redo, previewMode, setPreviewMode,
  } = useEditorStore()

  const SaveStatus = useCallback(() => {
    if (saveStatus === 'saving') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 size={12} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>Saving…</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>Please wait</p>
          </div>
        </div>
      )
    }
    if (saveStatus === 'error') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: '#ef4444', margin: 0, lineHeight: 1.3 }}>Save failed</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>Please try again</p>
          </div>
        </div>
      )
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
            {isDirty ? 'Unsaved changes' : (saveStatus === 'saved' ? 'All saved' : pageTitle)}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>All changes saved locally</p>
        </div>
      </div>
    )
  }, [saveStatus, isDirty, pageTitle])

  const deviceModes: Array<{ mode: PreviewMode; Icon: typeof Monitor; label: string }> = [
    { mode: 'desktop', Icon: Monitor,    label: 'Desktop' },
    { mode: 'tablet',  Icon: Tablet,     label: 'Tablet'  },
    { mode: 'mobile',  Icon: Smartphone, label: 'Mobile'  },
  ]

  const iconBtn = (active?: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30, borderRadius: 6,
    border: 'none', background: 'none', cursor: 'pointer',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    opacity: 1,
  })

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 48, padding: '0 14px',
      borderBottom: '1px solid var(--lito-border)',
      background: 'white',
      flexShrink: 0, gap: 8,
    }}>
      {/* ── Left: save status ───────────────────────────────────────────────── */}
      <div style={{ flex: '0 0 auto' }}>
        <SaveStatus />
      </div>

      {/* ── Centre: device switcher ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          border: '1px solid var(--lito-border)',
          borderRadius: 8,
          background: 'var(--cms-surface-3)',
          padding: 2, gap: 2,
        }}>
          {deviceModes.map(({ mode, Icon, label }) => (
            <button
              key={mode}
              type="button"
              title={label}
              onClick={() => setPreviewMode(mode)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 28, borderRadius: 6,
                border: 'none', cursor: 'pointer',
                transition: 'background 150ms, color 150ms',
                background: previewMode === mode ? 'var(--lito-teal)' : 'transparent',
                color: previewMode === mode ? '#fff' : 'var(--text-muted)',
              }}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: controls ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {/* Zoom controls */}
        <div style={{
          display: 'flex', alignItems: 'center',
          border: '1px solid var(--lito-border)',
          borderRadius: 7, overflow: 'hidden',
        }}>
          <button type="button" title="Zoom out" style={{
            ...iconBtn(), width: 26, height: 28, borderRadius: 0,
          }}>
            <Minus size={11} />
          </button>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
            color: 'var(--text-primary)', padding: '0 6px', minWidth: 38,
            textAlign: 'center', userSelect: 'none',
            borderLeft: '1px solid var(--lito-border)',
            borderRight: '1px solid var(--lito-border)',
            lineHeight: '28px',
          }}>
            100%
          </span>
          <button type="button" title="Zoom in" style={{
            ...iconBtn(), width: 26, height: 28, borderRadius: 0,
          }}>
            <Plus size={11} />
          </button>
        </div>

        {/* Sep */}
        <div style={{ width: 1, height: 18, background: 'var(--lito-border)', margin: '0 2px' }} />

        {/* Undo */}
        <button
          type="button" onClick={undo} disabled={!canUndo()} title="Undo (⌘Z)"
          style={{ ...iconBtn(), opacity: canUndo() ? 1 : 0.35 }}
        >
          <Undo2 size={14} />
        </button>

        {/* Redo */}
        <button
          type="button" onClick={redo} disabled={!canRedo()} title="Redo (⌘⇧Z)"
          style={{ ...iconBtn(), opacity: canRedo() ? 1 : 0.35 }}
        >
          <Redo2 size={14} />
        </button>

        {/* Settings */}
        <button type="button" title="Editor settings" style={iconBtn()}>
          <Settings2 size={14} />
        </button>

        {/* Sep */}
        <div style={{ width: 1, height: 18, background: 'var(--lito-border)', margin: '0 2px' }} />

        {/* Preview */}
        <button
          type="button"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 7,
            border: '1px solid var(--lito-border)',
            background: 'white', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 12,
            fontWeight: 500, color: 'var(--text-primary)',
          }}
        >
          <Eye size={13} />
          Preview
        </button>

        {/* Publish + dropdown */}
        <div style={{ display: 'flex', borderRadius: 7, overflow: 'hidden' }}>
          <button
            type="button" onClick={onPublish}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 14px',
              border: 'none', background: 'var(--lito-teal)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              fontSize: 12, fontWeight: 600, color: '#fff',
            }}
          >
            <Rocket size={13} />
            Publish
          </button>
          <button
            type="button"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 26, height: 33,
              borderLeft: '1px solid rgba(255,255,255,0.25)',
              background: 'var(--lito-teal)', cursor: 'pointer',
              color: '#fff', border: 'none',
            }}
          >
            <ChevronDown size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}
