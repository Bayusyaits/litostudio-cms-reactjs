/**
 * EditorOutlinePanel — Gutenberg-parity Outline panel.
 *
 * Shows heading hierarchy (H1→H2→H3) derived from blockDoc.
 * Click heading → select + scroll to block.
 * Also shows document stats: chars / words / read-time.
 */

import { useEditorStore } from '@/stores/editor.store'
import type { Block, HeadingBlockData, TextBlockData } from '@/types/editor.types'

// ── Doc stats ─────────────────────────────────────────────────────────────────

function getDocStats(blocks: Block[]) {
  const text = blocks
    .flatMap((b) => {
      if (b.type === 'heading') return [(b.data as HeadingBlockData).text ?? '']
      if (b.type === 'text')    return [(b.data as TextBlockData).html.replace(/<[^>]+>/g, '')]
      return []
    })
    .join(' ')
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length
  return {
    chars:   text.length,
    words,
    readMin: Math.max(1, Math.round(words / 200)),
  }
}

// ── Outline entry ─────────────────────────────────────────────────────────────

interface OutlineItem {
  id:    string
  level: 1 | 2 | 3 | 4 | 5 | 6
  text:  string
}

function getOutline(blocks: Block[]): OutlineItem[] {
  return blocks
    .filter((b) => b.type === 'heading')
    .map((b) => ({
      id:    b.id,
      level: (b.data as HeadingBlockData).level,
      text:  (b.data as HeadingBlockData).text || 'Untitled',
    }))
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditorOutlinePanel() {
  const { blockDoc, selectedBlockId, selectBlock } = useEditorStore()
  const outline = getOutline(blockDoc.blocks)
  const stats   = getDocStats(blockDoc.blocks)

  const handleJump = (id: string) => {
    selectBlock(id)
    // Scroll to the block in the canvas
    const el = document.querySelector(`[data-block-id="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflowY: 'auto',
      padding: '12px 0',
    }}>
      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 14px 12px', borderBottom: '1px solid var(--lito-border)' }}>
        {[
          { label: 'Characters', value: stats.chars },
          { label: 'Words',      value: stats.words },
          { label: 'Read time',  value: `${stats.readMin} minute${stats.readMin !== 1 ? 's' : ''}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
              {label}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Heading tree ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '8px 0' }}>
        {outline.length === 0 ? (
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'var(--text-muted)', textAlign: 'center',
            padding: '24px 14px',
          }}>
            No headings yet. Add a Heading block to see the outline.
          </p>
        ) : (
          outline.map((item) => {
            const isActive = item.id === selectedBlockId
            const indent   = (item.level - 1) * 10

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleJump(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', textAlign: 'left',
                  padding: `5px 14px 5px ${14 + indent}px`,
                  border: 'none',
                  background: isActive ? 'rgba(var(--lito-teal-rgb, 15,118,110),0.08)' : 'transparent',
                  cursor: 'pointer',
                  borderLeft: isActive ? '2px solid var(--lito-teal)' : '2px solid transparent',
                  transition: 'background 100ms',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--cms-surface-3)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{
                  flexShrink: 0,
                  fontFamily: 'var(--font-body)',
                  fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: isActive ? 'var(--lito-teal)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(var(--lito-teal-rgb, 15,118,110),0.12)' : 'var(--cms-surface-3)',
                  border: `1px solid ${isActive ? 'var(--lito-teal)' : 'var(--lito-border)'}`,
                  borderRadius: 3,
                  padding: '1px 4px',
                  minWidth: 24, textAlign: 'center',
                }}>
                  H{item.level}
                </span>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  color: isActive ? 'var(--lito-teal)' : 'var(--text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontWeight: isActive ? 600 : 400,
                }}>
                  {item.text}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
