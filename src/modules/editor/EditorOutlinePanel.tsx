/**
 * EditorOutlinePanel — Gutenberg-parity Outline panel.
 */

import { useEditorStore } from '@/stores/editor.store'
import type { Block, HeadingBlockData, TextBlockData } from '@/types/editor.types'

function getDocStats(blocks: Block[]) {
  const text = blocks
    .flatMap((b) => {
      if (b.type === 'heading') return [(b.data as HeadingBlockData).text ?? '']
      if (b.type === 'text')    return [(b.data as TextBlockData).html.replace(/<[^>]+>/g, '')]
      return []
    })
    .join(' ')
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length
  return { chars: text.length, words, readMin: Math.max(1, Math.round(words / 200)) }
}

interface OutlineItem { id: string; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }

function getOutline(blocks: Block[]): OutlineItem[] {
  return blocks
    .filter((b) => b.type === 'heading')
    .map((b) => ({ id: b.id, level: (b.data as HeadingBlockData).level, text: (b.data as HeadingBlockData).text || 'Untitled' }))
}

export function EditorOutlinePanel() {
  const { blockDoc, selectedBlockId, selectBlock } = useEditorStore()
  const outline = getOutline(blockDoc.blocks)
  const stats   = getDocStats(blockDoc.blocks)

  const handleJump = (id: string) => {
    selectBlock(id)
    const el = document.querySelector(`[data-block-id="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto py-3">
      {/* Stats */}
      <div className="px-[14px] pb-3 border-b border-[var(--lito-border)]">
        {[
          { label: 'Characters', value: stats.chars },
          { label: 'Words',      value: stats.words },
          { label: 'Read time',  value: `${stats.readMin} minute${stats.readMin !== 1 ? 's' : ''}` },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between mb-1">
            <span className="font-body text-xs text-[var(--text-muted)]">{label}</span>
            <span className="font-body text-xs font-semibold text-[var(--text-primary)]">{value}</span>
          </div>
        ))}
      </div>

      {/* Heading tree */}
      <div className="flex-1 py-2">
        {outline.length === 0 ? (
          <p className="font-body text-xs text-[var(--text-muted)] text-center px-[14px] py-6">
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
                className={`flex items-center gap-2 w-full text-left border-none cursor-pointer border-l-2 transition-[background] duration-100 ${
                  isActive
                    ? 'bg-[rgba(15,118,110,0.08)] border-l-[var(--lito-teal)]'
                    : 'bg-transparent border-l-transparent hover:bg-[var(--cms-surface-3)]'
                }`}
                // padding-left is dynamic (indent level) — keep as style
                style={{ padding: `5px 14px 5px ${14 + indent}px` }}
              >
                <span className={`shrink-0 font-body text-[9px] font-bold tracking-[0.04em] rounded-[3px] px-1 py-[1px] min-w-6 text-center border ${
                  isActive
                    ? 'text-[var(--lito-teal)] bg-[rgba(15,118,110,0.12)] border-[var(--lito-teal)]'
                    : 'text-[var(--text-muted)] bg-[var(--cms-surface-3)] border-[var(--lito-border)]'
                }`}>
                  H{item.level}
                </span>
                <span className={`font-body text-xs overflow-hidden text-ellipsis whitespace-nowrap ${
                  isActive ? 'text-[var(--lito-teal)] font-semibold' : 'text-[var(--text-secondary)] font-normal'
                }`}>
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
