/**
 * EditorShortcutsModal — Keyboard shortcuts reference panel.
 *
 * Triggered by the ⌘ button in EditorToolbar.
 * Renders as a centered modal overlay.
 */

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
}

// ── Shortcut data ─────────────────────────────────────────────────────────────

const GROUPS: Array<{
  label: string
  shortcuts: Array<{ keys: string[]; description: string }>
}> = [
  {
    label: 'Document',
    shortcuts: [
      { keys: ['⌘', 'S'],         description: 'Save' },
      { keys: ['⌘', 'Z'],         description: 'Undo' },
      { keys: ['⌘', '⇧', 'Z'],   description: 'Redo' },
      { keys: ['⌘', '⇧', 'P'],   description: 'Open shortcuts' },
    ],
  },
  {
    label: 'Block Selection',
    shortcuts: [
      { keys: ['Click'],           description: 'Select block' },
      { keys: ['Esc'],             description: 'Deselect / close panel' },
      { keys: ['Delete'],          description: 'Delete selected block' },
      { keys: ['⌘', 'D'],         description: 'Duplicate block' },
      { keys: ['⌘', 'C'],         description: 'Copy block' },
      { keys: ['⌘', 'X'],         description: 'Cut block' },
      { keys: ['⌘', 'V'],         description: 'Paste block' },
    ],
  },
  {
    label: 'Block Movement',
    shortcuts: [
      { keys: ['⌘', '↑'],         description: 'Move block up' },
      { keys: ['⌘', '↓'],         description: 'Move block down' },
    ],
  },
  {
    label: 'Editor',
    shortcuts: [
      { keys: ['⌘', '\\'],        description: 'Toggle sidebar' },
      { keys: ['⌘', 'K'],         description: 'Focus block search' },
      { keys: ['⌘', '⇧', 'E'],   description: 'Toggle Code / Visual mode' },
    ],
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function EditorShortcutsModal({ onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const Kbd = ({ k }: { k: string }) => (
    <kbd style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 22, height: 22, padding: '0 5px',
      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
      background: 'var(--cms-surface-3)',
      border: '1px solid var(--lito-border)',
      borderBottom: '2px solid var(--lito-border)',
      borderRadius: 5, color: 'var(--text-primary)',
      userSelect: 'none',
    }}>
      {k}
    </kbd>
  )

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10000,
        width: 520, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        background: 'var(--cms-card-bg)',
        border: '1px solid var(--lito-border)',
        borderRadius: 14,
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--lito-border)',
          flexShrink: 0,
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
              color: 'var(--text-primary)', margin: 0,
            }}>
              Keyboard Shortcuts
            </p>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 11,
              color: 'var(--text-muted)', margin: '2px 0 0',
            }}>
              Press <strong>Esc</strong> to close
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 8,
              border: '1px solid var(--lito-border)',
              background: 'var(--cms-surface-3)', cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 20px 20px' }}>
          {GROUPS.map(({ label, shortcuts }) => (
            <div key={label} style={{ marginBottom: 20 }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.07em', color: 'var(--text-muted)',
                margin: '0 0 8px', textTransform: 'uppercase',
              }}>
                {label}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {shortcuts.map(({ keys, description }) => (
                  <div key={description} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderRadius: 8,
                    background: 'var(--cms-surface-3)',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 12,
                      color: 'var(--text-secondary)',
                    }}>
                      {description}
                    </span>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      {keys.map((k, i) => (
                        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Kbd k={k} />
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
