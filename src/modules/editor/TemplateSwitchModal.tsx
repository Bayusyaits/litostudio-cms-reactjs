/**
 * TemplateSwitchModal — shown when a user changes the site's template_slug
 * in site settings. Offers two choices:
 *
 *   • Keep content  — only CSS/palette changes; existing blocks are preserved.
 *   • Apply defaults — existing blocks are discarded and replaced with the
 *                      new template's page defaults for the current page.
 *
 * The parent (SettingsPageContainer) is responsible for applying the chosen
 * action after the modal resolves.
 */

import { useRef } from 'react'
import { X, RefreshCw, Layers } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

export interface TemplateSwitchResult {
  action: 'keep' | 'apply-defaults' | 'cancel'
}

interface TemplateSwitchModalProps {
  /** The template the user is switching TO */
  newTemplateName: string
  onResolve: (result: TemplateSwitchResult) => void
}

export function TemplateSwitchModal({ newTemplateName, onResolve }: TemplateSwitchModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  // AC-08: trap Tab/Shift+Tab within dialog; Escape closes
  useFocusTrap(dialogRef, true, () => onResolve({ action: 'cancel' }))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tpl-switch-title"
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-[rgba(0,0,0,0.45)]"
      onClick={(e) => { if (e.target === e.currentTarget) onResolve({ action: 'cancel' }) }}
      ref={dialogRef}
    >
      <div className="bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-xl px-7 py-6 w-[420px] max-w-[90vw] shadow-[0_16px_48px_rgba(0,0,0,0.18)]">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p id="tpl-switch-title" className="font-display text-[17px] font-semibold text-[var(--text-primary)] m-0">
              Switch to {newTemplateName}?
            </p>
            <p className="font-body text-xs text-[var(--text-muted)] mt-1 mb-0">
              What should happen to the current page content?
            </p>
          </div>
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => onResolve({ action: 'cancel' })}
            className="flex items-center bg-transparent border-none cursor-pointer text-[var(--text-muted)] p-1 rounded-md"
          >
            <X size={16} />
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-[10px]">
          {/* Keep content */}
          <button
            type="button"
            onClick={() => onResolve({ action: 'keep' })}
            className="flex items-start gap-3 px-4 py-[14px] rounded-lg cursor-pointer border-[1.5px] border-[var(--lito-border)] bg-[var(--cms-surface-2)] text-left w-full"
          >
            <Layers size={18} className="text-[var(--lito-teal)] shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-[13px] font-semibold text-[var(--text-primary)] m-0">
                Keep existing content
              </p>
              <p className="font-body text-[11px] text-[var(--text-muted)] mt-[3px] mb-0">
                Palette, fonts and colours update automatically. All blocks are preserved.
              </p>
            </div>
          </button>

          {/* Apply defaults */}
          <button
            type="button"
            onClick={() => onResolve({ action: 'apply-defaults' })}
            className="flex items-start gap-3 px-4 py-[14px] rounded-lg cursor-pointer border-[1.5px] border-[var(--lito-border)] bg-[var(--cms-surface-2)] text-left w-full"
          >
            <RefreshCw size={18} className="text-[var(--lito-gold)] shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-[13px] font-semibold text-[var(--text-primary)] m-0">
                Apply {newTemplateName} defaults
              </p>
              <p className="font-body text-[11px] text-[var(--text-muted)] mt-[3px] mb-0">
                Replace blocks with the starter content for this template. Current blocks will be lost.
              </p>
            </div>
          </button>
        </div>

        {/* Footer hint */}
        <p className="font-body text-[10px] text-[var(--text-muted)] mt-[14px] mb-0 text-center">
          You can always undo with ⌘Z after switching.
        </p>
      </div>
    </div>
  )
}
