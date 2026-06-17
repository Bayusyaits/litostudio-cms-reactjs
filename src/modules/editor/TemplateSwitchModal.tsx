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

import { X, RefreshCw, Layers } from 'lucide-react'

export interface TemplateSwitchResult {
  action: 'keep' | 'apply-defaults' | 'cancel'
}

interface TemplateSwitchModalProps {
  /** The template the user is switching TO */
  newTemplateName: string
  onResolve: (result: TemplateSwitchResult) => void
}

export function TemplateSwitchModal({ newTemplateName, onResolve }: TemplateSwitchModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tpl-switch-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onResolve({ action: 'cancel' }) }}
    >
      <div style={{
        background: 'var(--cms-card-bg)',
        border: '1px solid var(--lito-border)',
        borderRadius: 12,
        padding: '24px 28px',
        width: 420, maxWidth: '90vw',
        boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p id="tpl-switch-title" style={{
              fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600,
              color: 'var(--text-primary)', margin: 0,
            }}>
              Switch to {newTemplateName}?
            </p>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 12,
              color: 'var(--text-muted)', margin: '4px 0 0',
            }}>
              What should happen to the current page content?
            </p>
          </div>
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => onResolve({ action: 'cancel' })}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 4, borderRadius: 6,
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Keep content */}
          <button
            type="button"
            onClick={() => onResolve({ action: 'keep' })}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 16px', borderRadius: 8, cursor: 'pointer',
              border: '1.5px solid var(--lito-border)',
              background: 'var(--cms-surface-2)',
              textAlign: 'left', width: '100%',
            }}
          >
            <Layers size={18} style={{ color: 'var(--lito-teal)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                color: 'var(--text-primary)', margin: 0,
              }}>
                Keep existing content
              </p>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 11,
                color: 'var(--text-muted)', margin: '3px 0 0',
              }}>
                Palette, fonts and colours update automatically. All blocks are preserved.
              </p>
            </div>
          </button>

          {/* Apply defaults */}
          <button
            type="button"
            onClick={() => onResolve({ action: 'apply-defaults' })}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 16px', borderRadius: 8, cursor: 'pointer',
              border: '1.5px solid var(--lito-border)',
              background: 'var(--cms-surface-2)',
              textAlign: 'left', width: '100%',
            }}
          >
            <RefreshCw size={18} style={{ color: 'var(--lito-gold)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                color: 'var(--text-primary)', margin: 0,
              }}>
                Apply {newTemplateName} defaults
              </p>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 11,
                color: 'var(--text-muted)', margin: '3px 0 0',
              }}>
                Replace blocks with the starter content for this template. Current blocks will be lost.
              </p>
            </div>
          </button>
        </div>

        {/* Footer hint */}
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 10,
          color: 'var(--text-muted)', margin: '14px 0 0', textAlign: 'center',
        }}>
          You can always undo with ⌘Z after switching.
        </p>
      </div>
    </div>
  )
}
