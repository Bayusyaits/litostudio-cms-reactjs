/**
 * EditorPatternsPanel — Gutenberg-parity Patterns inserter.
 *
 * Renders pattern cards grouped by category.
 * Click → inserts all pattern blocks after the currently selected block.
 */

import { useState } from 'react'
import { useEditorStore } from '@/stores/editor.store'
import { BlockIcon } from '../blocks/blockIcons'
import {
  PATTERN_LIBRARY, PATTERN_CATEGORIES,
  instantiatePattern,
  type PatternCategory,
} from './patternLibrary'

export function EditorPatternsPanel() {
  const { addBlock, selectedBlockId } = useEditorStore()
  const [activeCategory, setActiveCategory] = useState<PatternCategory | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = PATTERN_LIBRARY.filter((p) => {
    const matchCat  = activeCategory === 'all' || p.category === activeCategory
    const matchSearch = !search.trim() || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleInsert = (patternId: string) => {
    const pattern = PATTERN_LIBRARY.find((p) => p.id === patternId)
    if (!pattern) return
    const blocks = instantiatePattern(pattern)
    // Insert blocks sequentially after selectedBlockId
    let insertAfter: string | undefined = selectedBlockId ?? undefined
    for (const block of blocks) {
      addBlock(block, insertAfter)
      insertAfter = block.id
    }
  }

  const tabBtn = (id: PatternCategory | 'all', label: string, iconName: string) => {
    const active = activeCategory === id
    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveCategory(id)}
        className={`flex items-center gap-[5px] px-[10px] py-1 rounded-md border-none cursor-pointer font-body text-[11px] whitespace-nowrap transition-[background,color] duration-100 ${
          active
            ? 'font-semibold bg-[var(--lito-teal)] text-white'
            : 'font-normal bg-transparent text-[var(--text-muted)]'
        }`}
      >
        <BlockIcon name={iconName} size={12} />
        {label}
      </button>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="px-3 pt-[10px] shrink-0">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patterns…"
          className="w-full px-[10px] py-[6px] border border-[var(--lito-border)] rounded-lg bg-[var(--cms-surface-3)] font-body text-xs text-[var(--text-primary)] outline-none box-border"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-0.5 px-[10px] py-2 overflow-x-auto shrink-0 border-b border-[var(--lito-border)]">
        {tabBtn('all', 'All', 'Sparkles')}
        {PATTERN_CATEGORIES.map((c) => tabBtn(c.id, c.label, c.icon))}
      </div>

      {/* Pattern list */}
      <div className="flex-1 overflow-y-auto px-3 pt-[10px] pb-4">
        {filtered.length === 0 ? (
          <p className="font-body text-xs text-[var(--text-muted)] text-center py-6 m-0">
            No patterns match.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((pattern) => (
              <button
                key={pattern.id}
                type="button"
                onClick={() => handleInsert(pattern.id)}
                title={`Insert: ${pattern.name}`}
                className="flex items-start gap-3 p-3 rounded-[10px] border border-[var(--lito-border)] bg-[var(--cms-card-bg)] cursor-pointer text-left transition-[border-color,box-shadow] duration-100 hover:border-[var(--lito-teal)] hover:shadow-[0_0_0_1px_var(--lito-teal)]"
              >
                {/* Preview icon */}
                <span className="shrink-0 w-10 h-10 flex items-center justify-center bg-[var(--cms-surface-3)] rounded-lg text-[var(--text-secondary)]">
                  <BlockIcon name={pattern.preview} size={18} />
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs font-semibold text-[var(--text-muted)] mt-0 mb-[3px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {pattern.name}
                  </p>
                  <p className="font-body text-[11px] text-[var(--text-muted)] m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    {pattern.description}
                  </p>
                  <p className="font-body text-[10px] text-[var(--lito-teal)] mt-1 mb-0 font-semibold">
                    {pattern.blocks.length} block{pattern.blocks.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
