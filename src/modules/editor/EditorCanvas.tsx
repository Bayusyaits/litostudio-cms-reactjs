/**
 * EditorCanvas — the visual editing area.
 *
 * Renders blocks in order. Clicking a block selects it.
 * Selected block gets a visible border + action bar (move up/down, duplicate, delete).
 * Drag handles allow reordering via HTML5 DnD.
 * Empty state shows an "Add your first block" CTA.
 */

import { useRef, useState } from 'react'
import {
  Plus, ChevronUp, ChevronDown, Copy, Trash2, GripVertical,
} from 'lucide-react'
import { useEditorStore } from '@/stores/editor.store'
import { BlockRenderer } from './blocks/BlockRenderer'
import type { Block } from '@/types/editor.types'

interface BlockActionsProps {
  block: Block
  isFirst: boolean
  isLast: boolean
}

function BlockActions({ block, isFirst, isLast }: BlockActionsProps) {
  const { moveBlockUp, moveBlockDown, duplicateBlock, removeBlock } = useEditorStore()
  return (
    <div className="absolute right-2 top-2 z-10 flex items-center gap-1 bg-[var(--cms-sidebar-bg)] border border-[var(--lito-border)] rounded-lg shadow-md p-0.5">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); moveBlockUp(block.id) }}
        disabled={isFirst}
        className="p-1 rounded hover:bg-[var(--cms-surface-3)] text-[var(--text-muted)] disabled:opacity-25 disabled:cursor-not-allowed"
        title="Move up"
      >
        <ChevronUp className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); moveBlockDown(block.id) }}
        disabled={isLast}
        className="p-1 rounded hover:bg-[var(--cms-surface-3)] text-[var(--text-muted)] disabled:opacity-25 disabled:cursor-not-allowed"
        title="Move down"
      >
        <ChevronDown className="w-3 h-3" />
      </button>
      <div className="w-px h-4 bg-[var(--lito-border)]" />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id) }}
        className="p-1 rounded hover:bg-[var(--cms-surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        title="Duplicate"
      >
        <Copy className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); removeBlock(block.id) }}
        className="p-1 rounded hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500"
        title="Delete"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  )
}

export function EditorCanvas() {
  const {
    blockDoc: doc, selectedBlockId, selectBlock,
    reorderBlocks, previewMode,
  } = useEditorStore()

  const dragIdx = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  // Canvas width by preview mode
  const canvasWidth =
    previewMode === 'mobile' ? 375 :
    previewMode === 'tablet' ? 768 :
    '100%'

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOver(idx)
  }

  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault()
    if (dragIdx.current !== null && dragIdx.current !== toIdx) {
      reorderBlocks(dragIdx.current, toIdx)
    }
    dragIdx.current = null
    setDragOver(null)
  }

  const handleDragEnd = () => {
    dragIdx.current = null
    setDragOver(null)
  }

  const addEmptyBlock = () => {
    // Open left sidebar to blocks tab — for now just add a heading
    const { addBlock: add } = useEditorStore.getState()
    add({
      id:   Math.random().toString(36).slice(2, 10),
      type: 'heading',
      data: { text: 'New Heading', level: 2 },
      styles: {},
      visibility: { desktop: true, tablet: true, mobile: true },
    })
  }

  return (
    <div
      className="flex-1 overflow-y-auto bg-[var(--cms-main-bg)] flex justify-center"
      style={{ minHeight: 0 }}
    >
      <div
        className="w-full bg-white shadow-[0_0_0_1px_var(--lito-border)] transition-all duration-300"
        style={{
          maxWidth: canvasWidth,
          minHeight: '100%',
        }}
      >
        {doc.blocks.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 p-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--cms-surface-3)] flex items-center justify-center">
              <Plus className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-display text-base font-semibold text-[var(--text-primary)]">
                No blocks yet
              </p>
              <p className="font-body text-sm text-[var(--text-muted)]">
                Pick a block from the left panel to start building your page.
              </p>
            </div>
            <button
              type="button"
              onClick={addEmptyBlock}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-[var(--lito-border)] text-[var(--text-muted)] font-body text-sm hover:border-[var(--lito-teal)] hover:text-[var(--lito-teal)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Heading block
            </button>
          </div>
        ) : (
          <div className="relative">
            {doc.blocks.map((block, idx) => {
              const isSelected = block.id === selectedBlockId
              const isFirst    = idx === 0
              const isLast     = idx === doc.blocks.length - 1
              const isDragTarget = dragOver === idx

              return (
                <div
                  key={block.id}
                  className={[
                    'relative group transition-all',
                    isSelected
                      ? 'outline outline-2 outline-[var(--lito-teal)] outline-offset-[-2px] z-10'
                      : 'hover:outline hover:outline-1 hover:outline-[var(--lito-teal)]/40 hover:outline-offset-[-1px]',
                    isDragTarget
                      ? 'border-t-2 border-[var(--lito-teal)]'
                      : '',
                  ].join(' ')}
                  onClick={() => selectBlock(block.id)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                >
                  {/* Drag handle */}
                  <div
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragEnd={handleDragEnd}
                    className="absolute left-1 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded bg-[var(--cms-sidebar-bg)] border border-[var(--lito-border)] shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="w-3 h-3 text-[var(--text-muted)]" />
                  </div>

                  {/* Block type badge */}
                  {isSelected && (
                    <div className="absolute left-2 top-0 -translate-y-full z-20">
                      <span className="px-2 py-0.5 bg-[var(--lito-teal)] text-white text-[10px] font-body font-medium rounded-t-md">
                        {block.type}
                      </span>
                    </div>
                  )}

                  {/* Block actions */}
                  {isSelected && (
                    <BlockActions block={block} isFirst={isFirst} isLast={isLast} />
                  )}

                  {/* Block content */}
                  <BlockRenderer block={block} />

                  {/* Add block between separator */}
                  <div
                    className="absolute bottom-0 left-0 right-0 flex items-center justify-center h-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity z-10"
                    style={{ bottom: -1 }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const { addBlock: add } = useEditorStore.getState()
                        add({
                          id:   Math.random().toString(36).slice(2, 10),
                          type: 'spacer',
                          data: { height: 48 },
                          styles: {},
                          visibility: { desktop: true, tablet: true, mobile: true },
                        }, block.id)
                      }}
                      className="w-5 h-5 rounded-full bg-[var(--lito-teal)] text-white flex items-center justify-center shadow hover:scale-110 transition-transform"
                      title="Add block after"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
