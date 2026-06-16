/**
 * EditorListView — Full block tree, Gutenberg "List View" parity.
 *
 * Renders every block in document order.
 * Click → select. Drag handle visible (drag-to-reorder is a future Sprint 2 task).
 */

import { GripVertical, Eye, EyeOff, Lock, Unlock, Trash2 } from 'lucide-react'
import { useEditorStore } from '@/stores/editor.store'
import type { Block } from '@/types/editor.types'

// ── Block type → human label + icon emoji ─────────────────────────────────────

const BLOCK_META: Record<string, { label: string; emoji: string }> = {
  text:             { label: 'Text',            emoji: '¶'  },
  heading:          { label: 'Heading',          emoji: 'H'  },
  image:            { label: 'Image',            emoji: '🖼' },
  gallery:          { label: 'Gallery',          emoji: '📷' },
  video:            { label: 'Video',            emoji: '▶'  },
  button:           { label: 'Button',           emoji: '◉'  },
  spacer:           { label: 'Spacer',           emoji: '↕'  },
  divider:          { label: 'Divider',          emoji: '—'  },
  hero:             { label: 'Hero',             emoji: '★'  },
  cta:              { label: 'CTA',              emoji: '📣' },
  services:         { label: 'Services',         emoji: '⚙'  },
  pricing:          { label: 'Pricing',          emoji: '$'  },
  testimonials:     { label: 'Testimonials',     emoji: '💬' },
  faq:              { label: 'FAQ',              emoji: '?'  },
  team:             { label: 'Team',             emoji: '👥' },
  statistics:       { label: 'Statistics',       emoji: '📊' },
  products:         { label: 'Products',         emoji: '📦' },
  collections:      { label: 'Collections',      emoji: '🗂' },
  journal:          { label: 'Journal',          emoji: '📝' },
  story:            { label: 'Story',            emoji: '📖' },
  contact_form:     { label: 'Contact Form',     emoji: '✉'  },
  newsletter:       { label: 'Newsletter',       emoji: '📨' },
  map:              { label: 'Map',              emoji: '🗺' },
  social_links:     { label: 'Social Links',     emoji: '🔗' },
  html:             { label: 'HTML',             emoji: '</>' },
  destinations_grid:{ label: 'Destinations',     emoji: '✈'  },
  experiences:      { label: 'Experiences',      emoji: '🌄' },
  portfolio:        { label: 'Portfolio',        emoji: '🎨' },
  booking:          { label: 'Booking',          emoji: '📅' },
  packages:         { label: 'Packages',         emoji: '🎁' },
  campaigns_grid:   { label: 'Campaigns',        emoji: '📢' },
}

function blockLabel(block: Block): string {
  if (block.name) return block.name
  const meta = BLOCK_META[block.type]
  return meta ? meta.label : block.type
}

function blockEmoji(block: Block): string {
  return BLOCK_META[block.type]?.emoji ?? '□'
}

// ── Row ───────────────────────────────────────────────────────────────────────

function BlockRow({ block, index }: { block: Block; index: number }) {
  const { selectedBlockId, selectBlock, updateVisibility, lockBlock, removeBlock } = useEditorStore()
  const isSelected  = selectedBlockId === block.id
  const isHidden    = block.visibility?.desktop === false
  const isLocked    = block.locked === true

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center',
        padding: '4px 10px 4px 8px', gap: 6,
        background: isSelected ? 'rgba(var(--lito-teal-rgb, 15,118,110),0.08)' : 'transparent',
        borderLeft: isSelected ? '2px solid var(--lito-teal)' : '2px solid transparent',
        cursor: 'pointer', userSelect: 'none',
        opacity: isHidden ? 0.4 : 1,
        transition: 'background 80ms',
      }}
      onClick={() => selectBlock(block.id)}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--cms-surface-3)' }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      {/* Drag handle (visual only — reorder via moveBlockUp/Down) */}
      <span style={{ color: 'var(--text-muted)', flexShrink: 0, cursor: 'grab', lineHeight: 0 }}>
        <GripVertical size={13} />
      </span>

      {/* Index */}
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700,
        color: 'var(--text-muted)', minWidth: 16, textAlign: 'right', flexShrink: 0,
      }}>
        {index + 1}
      </span>

      {/* Icon */}
      <span style={{
        fontFamily: 'monospace', fontSize: 11, flexShrink: 0,
        color: isSelected ? 'var(--lito-teal)' : 'var(--text-muted)',
        minWidth: 18, textAlign: 'center',
      }}>
        {blockEmoji(block)}
      </span>

      {/* Label */}
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 12, flex: 1,
        color: isSelected ? 'var(--lito-teal)' : 'var(--text-secondary)',
        fontWeight: isSelected ? 600 : 400,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {blockLabel(block)}
      </span>

      {/* Action buttons — visible on hover / selected */}
      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {/* Visibility toggle */}
        <button
          type="button"
          title={isHidden ? 'Show block' : 'Hide block'}
          onClick={(e) => {
            e.stopPropagation()
            updateVisibility(block.id, { desktop: isHidden, tablet: isHidden, mobile: isHidden })
          }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: 4,
            border: 'none', background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
        </button>

        {/* Lock toggle */}
        <button
          type="button"
          title={isLocked ? 'Unlock block' : 'Lock block'}
          onClick={(e) => {
            e.stopPropagation()
            lockBlock(block.id, !isLocked)
          }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: 4,
            border: 'none', background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
        </button>

        {/* Delete */}
        <button
          type="button"
          title="Delete block"
          onClick={(e) => {
            e.stopPropagation()
            removeBlock(block.id)
          }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: 4,
            border: 'none', background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditorListView() {
  const { blockDoc } = useEditorStore()
  const blocks = blockDoc.blocks

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px 6px',
        borderBottom: '1px solid var(--lito-border)',
        flexShrink: 0,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.06em', color: 'var(--text-muted)',
          margin: 0,
        }}>
          {blocks.length} BLOCK{blocks.length !== 1 ? 'S' : ''}
        </p>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 4 }}>
        {blocks.length === 0 ? (
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'var(--text-muted)', textAlign: 'center',
            padding: '24px 14px', margin: 0,
          }}>
            No blocks yet. Use the Blocks tab to insert content.
          </p>
        ) : (
          blocks.map((block, i) => (
            <BlockRow key={block.id} block={block} index={i} />
          ))
        )}
      </div>
    </div>
  )
}
