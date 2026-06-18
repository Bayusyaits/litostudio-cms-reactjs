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
    <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-[5px] font-body text-[11px] font-semibold bg-[var(--cms-surface-3)] border border-[var(--lito-border)] border-b-2 rounded-[5px] text-[var(--text-primary)] select-none">
      {k}
    </kbd>
  )

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[9999] bg-[rgba(0,0,0,0.45)] backdrop-blur-[2px]"
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-[520px] max-h-[80vh] flex flex-col bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-[14px] shadow-[0_24px_64px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--lito-border)] shrink-0">
          <div>
            <p className="font-body text-[15px] font-bold text-[var(--text-primary)] m-0">
              Keyboard Shortcuts
            </p>
            <p className="font-body text-[11px] text-[var(--text-muted)] mt-0.5 mb-0">
              Press <strong>Esc</strong> to close
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-3)] cursor-pointer text-[var(--text-muted)]"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 pt-4 pb-5">
          {GROUPS.map(({ label, shortcuts }) => (
            <div key={label} className="mb-5">
              <p className="font-body text-[10px] font-bold tracking-[0.07em] text-[var(--text-muted)] mt-0 mb-2 uppercase">
                {label}
              </p>

              <div className="flex flex-col gap-1">
                {shortcuts.map(({ keys, description }) => (
                  <div key={description} className="flex items-center justify-between px-[10px] py-[6px] rounded-lg bg-[var(--cms-surface-3)]">
                    <span className="font-body text-xs text-[var(--text-secondary)]">
                      {description}
                    </span>
                    <div className="flex gap-[3px] items-center">
                      {keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-[3px]">
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
