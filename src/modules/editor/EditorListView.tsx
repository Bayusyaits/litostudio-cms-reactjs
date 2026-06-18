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
  portfolio:        { label: 'Portfolio',        emoji: '🎨' },
  booking:          { label: 'Booking',          emoji: '📅' },
  packages:         { label: 'Packages',         emoji: '🎁' },
  campaigns_grid:   { label: 'Campaigns',        emoji: '📢' },
  destinations_grid:{ label: 'Destinations',     emoji: '📍' },
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

const actionBtnCls = 'flex items-center justify-center w-[22px] h-[22px] rounded border-none bg-transparent cursor-pointer text-[var(--text-muted)]'

function BlockRow({ block, index }: { block: Block; index: number }) {
  const { selectedBlockId, selectBlock, updateVisibility, lockBlock, removeBlock } = useEditorStore()
  const isSelected  = selectedBlockId === block.id
  const isHidden    = block.visibility?.desktop === false
  const isLocked    = block.locked === true

  return (
    <div
      className={`flex items-center py-1 px-[10px] pl-2 gap-[6px] cursor-pointer select-none border-l-2 transition-[background] duration-[80ms] ${
        isHidden ? 'opacity-40' : 'opacity-100'
      } ${
        isSelected
          ? 'bg-[rgba(15,118,110,0.08)] border-l-[var(--lito-teal)]'
          : 'bg-transparent border-l-transparent hover:bg-[var(--cms-surface-3)]'
      }`}
      onClick={() => selectBlock(block.id)}
    >
      {/* Drag handle (visual only — reorder via moveBlockUp/Down) */}
      <span className="text-[var(--text-muted)] shrink-0 cursor-grab leading-none">
        <GripVertical size={13} />
      </span>

      {/* Index */}
      <span className="font-body text-[9px] font-bold text-[var(--text-muted)] min-w-4 text-right shrink-0">
        {index + 1}
      </span>

      {/* Icon */}
      <span className={`font-mono text-[11px] shrink-0 min-w-[18px] text-center ${isSelected ? 'text-[var(--lito-teal)]' : 'text-[var(--text-muted)]'}`}>
        {blockEmoji(block)}
      </span>

      {/* Label */}
      <span className={`font-body text-xs flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
        isSelected
          ? 'text-[var(--lito-teal)] font-semibold'
          : 'text-[var(--text-secondary)] font-normal'
      }`}>
        {blockLabel(block)}
      </span>

      {/* Action buttons — visible on hover / selected */}
      <div className="flex gap-0.5 shrink-0">
        {/* Visibility toggle */}
        <button
          type="button"
          title={isHidden ? 'Show block' : 'Hide block'}
          onClick={(e) => {
            e.stopPropagation()
            updateVisibility(block.id, { desktop: isHidden, tablet: isHidden, mobile: isHidden })
          }}
          className={actionBtnCls}
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
          className={actionBtnCls}
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
          className={`${actionBtnCls} hover:text-[#ef4444]`}
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
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-3 pt-[10px] pb-[6px] border-b border-[var(--lito-border)] shrink-0">
        <p className="font-body text-[10px] font-bold tracking-[0.06em] text-[var(--text-muted)] m-0">
          {blocks.length} BLOCK{blocks.length !== 1 ? 'S' : ''}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pt-1">
        {blocks.length === 0 ? (
          <p className="font-body text-xs text-[var(--text-muted)] text-center px-[14px] py-6 m-0">
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
