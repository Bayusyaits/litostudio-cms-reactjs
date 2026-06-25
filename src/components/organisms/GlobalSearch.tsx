// apps/cms/src/components/organisms/GlobalSearch.tsx
// Shopify / Notion-style global search — ⌘K command palette
import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2, FileText, Package, FolderOpen, BookOpen, Tag, Image, Layers } from 'lucide-react'
import { useWebsiteStore } from '@/stores/website.store'
import { searchService } from '@/services/search.service'
import type { SearchResult } from '@/services/search.service'

// ── Type icon map ────────────────────────────────────────────────────────────
const TYPE_ICONS: Record<string, React.ReactNode> = {
  journal:    <BookOpen  size={13} />,
  page:       <FileText  size={13} />,
  product:    <Package   size={13} />,
  collection: <Layers    size={13} />,
  category:   <FolderOpen size={13} />,
  tag:        <Tag       size={13} />,
  story:      <Image     size={13} />,
}

const TYPE_LABELS: Record<string, string> = {
  journal: 'Journal', page: 'Page', product: 'Product',
  collection: 'Collection', category: 'Category', tag: 'Tag', story: 'Story',
}

// ── Status badge color ───────────────────────────────────────────────────────
function statusColor(status?: string): string {
  if (!status) return 'var(--text-muted)'
  if (status === 'active' || status === 'published') return 'var(--lito-teal)'
  if (status === 'draft') return 'var(--text-muted)'
  if (status === 'archived') return 'var(--s-danger)'
  return 'var(--text-muted)'
}

interface Props {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: Props) {
  const navigate    = useNavigate()
  const { activeSite } = useWebsiteStore()
  const inputRef    = useRef<HTMLInputElement>(null)
  const listRef     = useRef<HTMLDivElement>(null)

  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [cursor,  setCursor]  = useState(-1)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Focus input when opened ────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setError(null)
      setCursor(-1)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // ── Debounced search ───────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() || query.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchService.search(query.trim(), {
          site_id: activeSite?.id,
          limit: 30,
        })
        setResults(res.data ?? [])
      } catch {
        setError('Search failed. Please try again.')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, activeSite?.id])

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor(c => Math.min(c + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor(c => Math.max(c - 1, -1))
    } else if (e.key === 'Enter' && cursor >= 0 && results[cursor]) {
      e.preventDefault()
      navigate(results[cursor].url)
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [results, cursor, navigate, onClose])

  // ── Global ⌘K / Ctrl+K shortcut ───────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (!open) {
          // handled by parent via AppHeader
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // ── Scroll cursor into view ────────────────────────────────────────────────
  useEffect(() => {
    if (cursor >= 0 && listRef.current) {
      const item = listRef.current.children[cursor] as HTMLElement | undefined
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [cursor])

  if (!open) return null

  // ── Group results by type ──────────────────────────────────────────────────
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    acc[r.type] = acc[r.type] ?? []
    acc[r.type].push(r)
    return acc
  }, {})

  const flat = results // For cursor tracking

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(0,0,0,0.45)] backdrop-blur-[3px] z-[1000]"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        className="fixed top-[10vh] left-1/2 -translate-x-1/2 w-full max-w-[640px] bg-[var(--cms-sidebar-bg)] border border-[var(--lito-border)] rounded-[14px] shadow-[0_24px_64px_rgba(0,0,0,0.25)] z-[1001] flex flex-col overflow-hidden max-h-[75vh]"
      >
        {/* Search input row */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--lito-border)]">
          {loading
            ? <Loader2 size={16} className="text-[var(--lito-gold)] shrink-0 animate-spin" />
            : <Search size={16} className="text-[var(--text-muted)] shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            placeholder="Search everything… (products, pages, journal, stories)"
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(-1) }}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none outline-none bg-transparent font-body text-[14px] text-[var(--text-primary)]"
            aria-autocomplete="list"
            aria-controls="search-results"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
              className="bg-transparent border-none cursor-pointer text-[var(--text-muted)] p-0"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="px-1.5 py-[2px] rounded border border-[var(--lito-border)] bg-[var(--cms-surface-3)] font-body text-[10px] text-[var(--text-muted)] shrink-0">ESC</kbd>
        </div>

        {/* Results */}
        <div
          id="search-results"
          ref={listRef}
          role="listbox"
          className={`overflow-y-auto flex-1 ${query ? 'py-2' : 'p-0'}`}
        >
          {/* Empty state — no query */}
          {!query && (
            <div className="px-6 py-8 text-center">
              <Search size={28} className="text-[var(--lito-border)] mx-auto mb-3" />
              <p className="font-body text-[13px] text-[var(--text-muted)]">
                Start typing to search across all modules
              </p>
              <p className="font-body text-[11px] text-[var(--text-muted)] mt-1">
                Products, pages, journal, stories, collections, categories, tags
              </p>
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !loading && results.length === 0 && !error && (
            <div className="px-6 py-8 text-center">
              <p className="font-body text-[13px] text-[var(--text-muted)]">
                No results for <strong>"{query}"</strong>
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-6 py-4 text-center">
              <p className="font-body text-[13px] text-[var(--s-danger)]">{error}</p>
            </div>
          )}

          {/* Grouped results */}
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              {/* Group header */}
              <div className="px-4 pt-1.5 pb-1 font-body text-[10px] font-semibold tracking-[0.08em] uppercase text-[var(--text-muted)]">
                {TYPE_LABELS[type] ?? type}
              </div>
              {/* Items */}
              {items.map((item) => {
                const globalIdx = flat.indexOf(item)
                const isActive  = globalIdx === cursor
                return (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => { navigate(item.url); onClose() }}
                    onMouseEnter={() => setCursor(globalIdx)}
                    className={`flex items-center gap-2.5 px-4 py-2 cursor-pointer transition-[background] duration-100 ${isActive ? 'bg-[var(--lito-gold-soft)]' : 'bg-transparent'}`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-[var(--lito-gold)]' : 'text-[var(--text-muted)]'}`}>
                      {TYPE_ICONS[type] ?? <FileText size={13} />}
                    </span>
                    <span className="flex-1 min-w-0 font-body text-[13px] font-medium text-[var(--text-muted)] truncate">
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="font-body text-[11px] text-[var(--text-muted)] max-w-[160px] truncate shrink-0">
                        {item.subtitle}
                      </span>
                    )}
                    {item.status && (
                      <span
                        className="font-body text-[10px] shrink-0 capitalize"
                        style={{ color: statusColor(item.status) }}
                      >
                        {item.status}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Footer hint */}
          {results.length > 0 && (
            <div className="flex gap-3 px-4 py-2 border-t border-[var(--lito-border)] mt-1">
              {[
                { key: '↑↓', label: 'navigate' },
                { key: '↵', label: 'open' },
                { key: 'esc', label: 'close' },
              ].map(({ key, label }) => (
                <span key={key} className="flex items-center gap-1">
                  <kbd className="px-[5px] py-[1px] rounded-[3px] bg-[var(--cms-surface-3)] border border-[var(--lito-border)] font-body text-[10px] text-[var(--text-muted)]">{key}</kbd>
                  <span className="font-body text-[10px] text-[var(--text-muted)]">{label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
