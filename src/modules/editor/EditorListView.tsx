/**
 * EditorListView — Full block tree, Gutenberg "List View" parity.
 *
 * Renders every block in document order.
 * Click → select. Drag the grip handle to reorder via HTML5 drag API → reorderBlocks().
 */

import { useRef, useState } from 'react'
import { GripVertical, Eye, EyeOff, Lock, Unlock, Trash2, Square } from 'lucide-react'
import { useEditorStore } from '@/stores/editor.store'
import { getBlockDef } from './blocks/blockLibrary'
import { BlockIcon } from './blocks/blockIcons'
import type { Block } from '@/types/editor.types'

// ── Block type → human label + icon ───────────────────────────────────────────
// 2026-07 icon cleanup: this used to hand-maintain its own emoji per block
// type in a separate BLOCK_META map, independent from (and inconsistent
// with) the icon each block type already declares in blockLibrary.ts. Now
// resolves the same single source of truth via getBlockDef() + BlockIcon,
// so there's exactly one icon assignment per block type, not two.

function blockLabel(block: Block): string {
  if (block.name) return block.name
  const def = getBlockDef(block.type)
  return def ? def.label : block.type
}

function blockIconName(block: Block): string | undefined {
  return getBlockDef(block.type)?.icon
}

// ── Row ───────────────────────────────────────────────────────────────────────

const actionBtnCls = 'flex items-center justify-center w-[22px] h-[22px] rounded border-none bg-transparent cursor-pointer text-[var(--text-muted)]'

interface BlockRowProps {
  block:       Block
  index:       number
  dragIndex:   number | null
  overIndex:   number | null
  onDragStart: (i: number) => void
  onDragOver:  (i: number) => void
  onDrop:      () => void
  onDragEnd:   () => void
}

function BlockRow({ block, index, dragIndex, overIndex, onDragStart, onDragOver, onDrop, onDragEnd }: BlockRowProps) {
  const { selectedBlockId, selectBlock, updateVisibility, lockBlock, removeBlock } = useEditorStore()
  const isSelected  = selectedBlockId === block.id
  const isHidden    = block.visibility?.desktop === false
  const isLocked    = block.locked === true
  const isDragging  = dragIndex === index
  const isOver      = overIndex === index && dragIndex !== null && dragIndex !== index

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(index) }}
      onDragOver={(e)  => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver(index) }}
      onDrop={(e)      => { e.preventDefault(); onDrop() }}
      onDragEnd={onDragEnd}
      className={`flex items-center py-1 px-[10px] pl-2 gap-[6px] cursor-pointer select-none border-l-2 transition-[background] duration-[80ms] ${
        isDragging ? 'opacity-30' : isHidden ? 'opacity-40' : 'opacity-100'
      } ${isOver ? 'border-t-2 border-t-[var(--lito-teal)]' : ''} ${
        isSelected
          ? 'bg-[rgba(15,118,110,0.08)] border-l-[var(--lito-teal)]'
          : 'bg-transparent border-l-transparent hover:bg-[var(--cms-surface-3)]'
      }`}
      onClick={() => selectBlock(block.id)}
    >
      {/* Drag handle — activates HTML5 drag on the whole row */}
      <span className="text-[var(--text-muted)] shrink-0 cursor-grab leading-none">
        <GripVertical size={13} />
      </span>

      {/* Index */}
      <span className="font-body text-[9px] font-bold text-[var(--text-muted)] min-w-4 text-right shrink-0">
        {index + 1}
      </span>

      {/* Icon */}
      <span className={`shrink-0 min-w-[18px] flex items-center justify-center ${isSelected ? 'text-[var(--lito-teal)]' : 'text-[var(--text-muted)]'}`}>
        {blockIconName(block) ? <BlockIcon name={blockIconName(block)!} size={13} /> : <Square size={13} />}
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
  const { blockDoc, reorderBlocks } = useEditorStore()
  const blocks = blockDoc.blocks

  // C-02: drag-to-reorder state (HTML5 drag API, no external deps)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  // Track latest values in a ref so event handlers always see current state
  const dragRef = useRef<{ from: number | null; to: number | null }>({ from: null, to: null })

  const handleDragStart = (i: number) => {
    setDragIndex(i)
    dragRef.current.from = i
  }
  const handleDragOver = (i: number) => {
    setOverIndex(i)
    dragRef.current.to = i
  }
  const handleDrop = () => {
    const { from, to } = dragRef.current
    if (from !== null && to !== null && from !== to) {
      reorderBlocks(from, to)
    }
  }
  const handleDragEnd = () => {
    setDragIndex(null)
    setOverIndex(null)
    dragRef.current = { from: null, to: null }
  }

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
            <BlockRow
              key={block.id}
              block={block}
              index={i}
              dragIndex={dragIndex}
              overIndex={overIndex}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </div>
    </div>
  )
}
