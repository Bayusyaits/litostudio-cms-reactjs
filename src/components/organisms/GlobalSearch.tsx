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
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        style={{
          position: 'fixed',
          top: '10vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 640,
          background: 'var(--cms-sidebar-bg)',
          border: '1px solid var(--lito-border)',
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxHeight: '75vh',
        }}
      >
        {/* Search input row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px',
          borderBottom: `1px solid var(--lito-border)`,
        }}>
          {loading
            ? <Loader2 size={16} style={{ color: 'var(--lito-gold)', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
            : <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          }
          <input
            ref={inputRef}
            type="text"
            placeholder="Search everything… (products, pages, journal, stories)"
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(-1) }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none', outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--text-primary)',
            }}
            aria-autocomplete="list"
            aria-controls="search-results"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <kbd style={{
            padding: '2px 6px', borderRadius: 4,
            background: 'var(--cms-surface-3)',
            border: '1px solid var(--lito-border)',
            fontFamily: 'var(--font-body)', fontSize: 10,
            color: 'var(--text-muted)', flexShrink: 0,
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div
          id="search-results"
          ref={listRef}
          role="listbox"
          style={{ overflowY: 'auto', flex: 1, padding: query ? '8px 0' : 0 }}
        >
          {/* Empty state — no query */}
          {!query && (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <Search size={28} style={{ color: 'var(--lito-border)', margin: '0 auto 12px' }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
                Start typing to search across all modules
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Products, pages, journal, stories, collections, categories, tags
              </p>
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !loading && results.length === 0 && !error && (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
                No results for <strong>"{query}"</strong>
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '16px 24px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--s-danger)' }}>{error}</p>
            </div>
          )}

          {/* Grouped results */}
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              {/* Group header */}
              <div style={{
                padding: '6px 16px 4px',
                fontFamily: 'var(--font-body)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}>
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
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      background: isActive ? 'var(--lito-gold-soft)' : 'transparent',
                      transition: 'background 100ms',
                    }}
                  >
                    <span style={{ color: isActive ? 'var(--lito-gold)' : 'var(--text-muted)', flexShrink: 0 }}>
                      {TYPE_ICONS[type] ?? <FileText size={13} />}
                    </span>
                    <span style={{
                      flex: 1, minWidth: 0,
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        maxWidth: 160,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        {item.subtitle}
                      </span>
                    )}
                    {item.status && (
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 10,
                        color: statusColor(item.status),
                        flexShrink: 0,
                        textTransform: 'capitalize',
                      }}>
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
            <div style={{
              display: 'flex', gap: 12, padding: '8px 16px',
              borderTop: '1px solid var(--lito-border)',
              marginTop: 4,
            }}>
              {[
                { key: '↑↓', label: 'navigate' },
                { key: '↵', label: 'open' },
                { key: 'esc', label: 'close' },
              ].map(({ key, label }) => (
                <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <kbd style={{
                    padding: '1px 5px', borderRadius: 3,
                    background: 'var(--cms-surface-3)',
                    border: '1px solid var(--lito-border)',
                    fontFamily: 'var(--font-body)', fontSize: 10,
                    color: 'var(--text-muted)',
                  }}>{key}</kbd>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)' }}>
                    {label}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
