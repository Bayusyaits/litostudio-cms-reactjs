import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LayoutDashboard, BookOpen, FileText, Image, Map,
  FolderOpen, Settings, Users, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  action?: () => void
  category: string
}

const STATIC_COMMANDS: Command[] = [
  { id: 'dashboard',    label: 'Dashboard',          icon: LayoutDashboard, href: '/dashboard',    category: 'Navigate' },
  { id: 'stories',      label: 'Stories',            icon: BookOpen,        href: '/stories',      category: 'Navigate' },
  { id: 'journal',      label: 'Journal',            icon: FileText,        href: '/journal',      category: 'Navigate' },
  { id: 'gallery',      label: 'Gallery',            icon: Image,           href: '/gallery',      category: 'Navigate' },
  { id: 'destinations', label: 'Destinations',       icon: Map,             href: '/destinations', category: 'Navigate' },
  { id: 'media',        label: 'Media Library',      icon: FolderOpen,      href: '/media',        category: 'Navigate' },
  { id: 'team',         label: 'Team',               icon: Users,           href: '/team',         category: 'Navigate' },
  { id: 'settings',     label: 'Settings',           icon: Settings,        href: '/settings',     category: 'Navigate' },
  { id: 'new-story',    label: 'New Story',          icon: BookOpen,        href: '/stories/new',  category: 'Create', description: 'Write a new travel story' },
  { id: 'new-journal',  label: 'New Journal Post',   icon: FileText,        href: '/journal/new',  category: 'Create' },
  { id: 'upload-media', label: 'Upload Media',       icon: Image,           href: '/media?upload=1', category: 'Create' },
]

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const filtered = query.trim()
    ? STATIC_COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : STATIC_COMMANDS

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {})

  const flat = Object.values(grouped).flat()

  const runCommand = useCallback(
    (cmd: Command) => {
      if (cmd.href) navigate(cmd.href)
      else cmd.action?.()
      onClose()
    },
    [navigate, onClose],
  )

  // Focus input when open
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, flat.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        const cmd = flat[activeIndex]
        if (cmd) runCommand(cmd)
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, flat, activeIndex, runCommand, onClose])

  // Reset active on query change
  useEffect(() => { setActiveIndex(0) }, [query])

  if (!open) return null

  let flatIndex = 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full max-w-lg',
          'bg-[var(--cms-surface)] border border-[var(--lito-border)] rounded-xl shadow-2xl',
          'overflow-hidden',
        )}
      >
        {/* Search input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--lito-border)]">
          <Search className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or jump to…"
            className={cn(
              'flex-1 bg-transparent outline-none',
              'font-body text-sm text-[var(--text-primary)]',
              'placeholder:text-[var(--text-muted)]',
            )}
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-results"
            aria-activedescendant={flat[activeIndex] ? `cmd-${flat[activeIndex].id}` : undefined}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--cms-surface-2)] transition-colors"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden />
          </button>
        </div>

        {/* Results */}
        <div
          id="cmd-results"
          role="listbox"
          className="max-h-80 overflow-y-auto py-2"
        >
          {flat.length === 0 ? (
            <p className="px-4 py-6 text-center font-body text-sm text-[var(--text-muted)]">
              No results for "{query}"
            </p>
          ) : (
            Object.entries(grouped).map(([category, cmds]) => (
              <div key={category}>
                <p className="px-4 py-1.5 font-body text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {category}
                </p>
                {cmds.map((cmd) => {
                  const currentIndex = flatIndex++
                  const isActive = currentIndex === activeIndex
                  const Icon = cmd.icon
                  return (
                    <button
                      key={cmd.id}
                      id={`cmd-${cmd.id}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => runCommand(cmd)}
                      onMouseEnter={() => setActiveIndex(currentIndex)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left',
                        'transition-colors',
                        isActive
                          ? 'bg-[var(--lito-gold-soft)] text-[var(--lito-gold)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--cms-surface-2)]',
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden />
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium truncate">{cmd.label}</p>
                        {cmd.description && (
                          <p className="font-body text-xs text-[var(--text-muted)] truncate">{cmd.description}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-[var(--lito-border)] flex gap-4">
          {[
            { keys: ['↑', '↓'], label: 'Navigate' },
            { keys: ['↵'], label: 'Select' },
            { keys: ['Esc'], label: 'Close' },
          ].map(({ keys, label }) => (
            <span key={label} className="flex items-center gap-1 font-body text-[10px] text-[var(--text-muted)]">
              {keys.map((k) => (
                <kbd
                  key={k}
                  className="px-1 py-0.5 rounded bg-[var(--cms-surface-2)] border border-[var(--lito-border)] font-mono text-[10px]"
                >
                  {k}
                </kbd>
              ))}
              <span>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
