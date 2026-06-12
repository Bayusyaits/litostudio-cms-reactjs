/**
 * EditorLeftSidebar — block library, pages, templates, media, patterns.
 */

import { useState } from 'react'
import {
  Layers, FileText, LayoutGrid, Image, Sparkles, Search,
} from 'lucide-react'
import { BLOCK_LIBRARY, BLOCK_CATEGORIES } from './blocks/blockLibrary'
import { useEditorStore, makeBlock } from '@/stores/editor.store'
import type { LeftPanelTab } from '@/types/editor.types'

// Lucide icon map (only what's used in blockLibrary)
import {
  Heading, AlignLeft, MousePointerClick, Minus, ArrowUpDown, Code2,
  Play, Star, Megaphone, DollarSign, Quote, HelpCircle, Users,
  BarChart3, MapPin, Package, Archive, BookOpen, Mail, Send, Share2,
} from 'lucide-react'

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Heading, AlignLeft, MousePointerClick, Minus, ArrowUpDown, Code2,
  Image, LayoutGrid, Play, Star, Megaphone, Layers, DollarSign, Quote,
  HelpCircle, Users, BarChart3, MapPin, Package, Archive, BookOpen,
  Mail, Send, Share2, FileText, Sparkles,
}

function BlockIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name]
  if (!Icon) return <span className="text-sm">{name}</span>
  return <Icon className="w-4 h-4" />
}

const TABS: Array<{ id: LeftPanelTab; icon: React.ReactNode; label: string }> = [
  { id: 'blocks',    icon: <Layers className="w-4 h-4" />,     label: 'Blocks' },
  { id: 'pages',     icon: <FileText className="w-4 h-4" />,   label: 'Pages' },
  { id: 'templates', icon: <LayoutGrid className="w-4 h-4" />, label: 'Templates' },
  { id: 'media',     icon: <Image className="w-4 h-4" />,      label: 'Media' },
  { id: 'patterns',  icon: <Sparkles className="w-4 h-4" />,   label: 'Patterns' },
]

export function EditorLeftSidebar() {
  const { activeLeftTab, setLeftTab, addBlock, selectedBlockId } = useEditorStore()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all')

  const filtered = BLOCK_LIBRARY.filter((b) => {
    const matchesSearch = !search || b.label.toLowerCase().includes(search.toLowerCase())
    const matchesCat    = activeCategory === 'all' || b.category === activeCategory
    return matchesSearch && matchesCat
  })

  const handleInsert = (item: typeof BLOCK_LIBRARY[number]) => {
    const block = makeBlock(
      item.type,
      structuredClone(item.defaultData),
      item.defaultStyles ? structuredClone(item.defaultStyles) : undefined,
    )
    addBlock(block, selectedBlockId ?? undefined)
  }

  return (
    <div className="flex flex-col h-full bg-[var(--cms-sidebar-bg)] border-r border-[var(--lito-border)] w-60 flex-shrink-0">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--lito-border)] overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setLeftTab(tab.id)}
            title={tab.label}
            className={`flex-1 flex items-center justify-center py-2.5 text-xs transition-colors min-w-0 ${
              activeLeftTab === tab.id
                ? 'border-b-2 border-[var(--lito-teal)] text-[var(--lito-teal)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeLeftTab === 'blocks' && (
          <div className="p-3 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search blocks..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--cms-surface-3)] border border-[var(--lito-border)] font-body text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--lito-teal)]"
              />
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-body transition-colors ${activeCategory === 'all' ? 'bg-[var(--lito-teal)] text-white' : 'bg-[var(--cms-surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                All
              </button>
              {BLOCK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-body transition-colors ${activeCategory === cat.id ? 'bg-[var(--lito-teal)] text-white' : 'bg-[var(--cms-surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Block list */}
            <div className="grid grid-cols-2 gap-1.5">
              {filtered.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleInsert(item)}
                  title={item.description}
                  className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[var(--cms-surface-2)] border border-[var(--lito-border)] hover:border-[var(--lito-teal)] hover:bg-[var(--lito-teal)]/5 transition-all text-center"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--cms-surface-3)] group-hover:bg-[var(--lito-teal)]/10 flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--lito-teal)] transition-colors">
                    <BlockIcon name={item.icon} />
                  </div>
                  <span className="font-body text-[10px] leading-tight text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="font-body text-xs text-[var(--text-muted)] text-center py-4">
                No blocks match "{search}"
              </p>
            )}
          </div>
        )}

        {activeLeftTab === 'pages' && (
          <div className="p-3">
            <p className="font-body text-xs text-[var(--text-muted)] text-center py-8">
              Page list coming soon
            </p>
          </div>
        )}

        {activeLeftTab === 'templates' && (
          <div className="p-3">
            <p className="font-body text-xs text-[var(--text-muted)] text-center py-8">
              Templates coming soon
            </p>
          </div>
        )}

        {activeLeftTab === 'media' && (
          <div className="p-3">
            <p className="font-body text-xs text-[var(--text-muted)] text-center py-8">
              Media library coming soon
            </p>
          </div>
        )}

        {activeLeftTab === 'patterns' && (
          <div className="p-3">
            <p className="font-body text-xs text-[var(--text-muted)] text-center py-8">
              Saved patterns coming soon
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      {activeLeftTab === 'blocks' && (
        <div className="p-3 border-t border-[var(--lito-border)]">
          <p className="font-body text-[10px] text-[var(--text-muted)] text-center">
            {filtered.length} blocks · click to insert
          </p>
        </div>
      )}
    </div>
  )
}
