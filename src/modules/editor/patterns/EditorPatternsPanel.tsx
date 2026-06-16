/**
 * EditorPatternsPanel — Gutenberg-parity Patterns inserter.
 *
 * Renders pattern cards grouped by category.
 * Click → inserts all pattern blocks after the currently selected block.
 */

import { useState } from 'react'
import { useEditorStore } from '@/stores/editor.store'
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

  const tabBtn = (id: PatternCategory | 'all', label: string, emoji: string) => {
    const active = activeCategory === id
    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveCategory(id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 6, border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: 11,
          fontWeight: active ? 600 : 400,
          background: active ? 'var(--lito-teal)' : 'transparent',
          color: active ? '#fff' : 'var(--text-muted)',
          transition: 'background 100ms, color 100ms',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{emoji}</span>
        {label}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Search */}
      <div style={{ padding: '10px 12px 0', flexShrink: 0 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patterns…"
          style={{
            width: '100%', padding: '6px 10px',
            border: '1px solid var(--lito-border)',
            borderRadius: 8,
            background: 'var(--cms-surface-3)',
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'var(--text-primary)', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Category tabs */}
      <div style={{
        display: 'flex', gap: 2, padding: '8px 10px',
        overflowX: 'auto', flexShrink: 0,
        borderBottom: '1px solid var(--lito-border)',
      }}>
        {tabBtn('all', 'All', '✨')}
        {PATTERN_CATEGORIES.map((c) => tabBtn(c.id, c.label, c.emoji))}
      </div>

      {/* Pattern list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px 16px' }}>
        {filtered.length === 0 ? (
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'var(--text-muted)', textAlign: 'center',
            padding: '24px 0', margin: 0,
          }}>
            No patterns match.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((pattern) => (
              <button
                key={pattern.id}
                type="button"
                onClick={() => handleInsert(pattern.id)}
                title={`Insert: ${pattern.name}`}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px', borderRadius: 10,
                  border: '1px solid var(--lito-border)',
                  background: 'var(--cms-card-bg)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 100ms, box-shadow 100ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--lito-teal)'
                  e.currentTarget.style.boxShadow = '0 0 0 1px var(--lito-teal)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--lito-border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Preview emoji */}
                <span style={{
                  fontSize: 24, lineHeight: 1, flexShrink: 0,
                  width: 40, height: 40, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'var(--cms-surface-3)',
                  borderRadius: 8,
                }}>
                  {pattern.preview}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                    color: 'var(--text-primary)', margin: '0 0 3px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {pattern.name}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 11,
                    color: 'var(--text-muted)', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {pattern.description}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 10,
                    color: 'var(--lito-teal)', margin: '4px 0 0',
                    fontWeight: 600,
                  }}>
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
