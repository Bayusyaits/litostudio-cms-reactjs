// apps/cms/src/components/organisms/AppHeader.tsx
import { useEffect, useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Bell, Moon, Sun, Menu, Plus } from 'lucide-react'
import { useThemeStore } from '@/stores/theme.store'
import { useAuthStore } from '@/stores/auth.store'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { GlobalSearch } from './GlobalSearch'
import { NotificationsPanel, useUnreadCount } from './NotificationsPanel'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/analytics':    'Analytics',
  '/stories':      'Stories',
  '/journal':      'Journal',
  '/gallery':      'Gallery',
  '/media':        'Media',
  '/destinations': 'Destinations',
  '/campaigns':    'Campaigns',
  '/seo':          'SEO',
  '/pages':        'Pages',
  '/forms':        'Forms',
  '/themes':       'Themes',
  '/categories':   'Categories',
  '/tags':         'Tags',
  '/team':         'Team',
  '/settings':     'Settings',
}

function usePageLabel() {
  const { pathname } = useLocation()
  const base = '/' + pathname.split('/')[1]
  if (pathname.endsWith('/new'))   return (ROUTE_LABELS[base] ?? base) + ' / New'
  if (pathname.includes('/edit'))  return (ROUTE_LABELS[base] ?? base) + ' / Edit'
  return ROUTE_LABELS[base] ?? base
}

const iconBtnClass = 'flex items-center justify-center w-[34px] h-[34px] rounded-md border border-[var(--lito-border)] bg-transparent text-[var(--text-muted)] cursor-pointer transition-[border-color,color,background] duration-150 hover:border-[var(--lito-ink)] hover:text-[var(--text-primary)]'

export function AppHeader() {
  const { isDark, setColorMode, toggleSidebar } = useThemeStore()
  const { user } = useAuthStore()
  const { activeSite } = useWebsiteStore()
  const pageLabel = usePageLabel()
  const unreadCount = useUnreadCount()

  const [searchOpen,        setSearchOpen]        = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // ── ⌘K / Ctrl+K global shortcut ──────────────────────────────────────────
  const openSearch = useCallback(() => {
    setNotificationsOpen(false)
    setSearchOpen(true)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openSearch])

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  function toggleDark() {
    setColorMode(isDark ? 'light' : 'dark')
  }

  return (
    <>
      <header className="h-[var(--cms-header-h)] bg-[var(--cms-header-bg)] border-b border-[var(--lito-border)] flex items-center gap-3 px-5 shrink-0 relative z-[100]">
        {/* Menu toggle */}
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={toggleSidebar}
          className={iconBtnClass}
        >
          <Menu size={15} />
        </button>

        {/* Breadcrumb */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          {activeSite?.domain && (
            <>
              <span className="font-body text-xs text-[var(--text-muted)] truncate">
                {activeSite.domain}
              </span>
              <span className="text-xs text-[var(--lito-border)]">/</span>
            </>
          )}
          <span className="font-body text-[13px] font-medium text-[var(--text-muted)] truncate">
            {pageLabel}
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* ⌘K Search trigger */}
          <button
            type="button"
            aria-label="Open global search (⌘K)"
            onClick={openSearch}
            className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-full border border-[var(--lito-border)] bg-transparent text-[var(--text-muted)] cursor-pointer text-xs font-body transition-[border-color] duration-150 hover:border-[var(--lito-ink)]"
          >
            <Search size={12} />
            <span className="flex items-center gap-1">
              Search
              <kbd className="inline-flex items-center px-1 py-px rounded-[3px] bg-[var(--lito-border)] text-[var(--text-muted)] text-[10px] font-body">⌘K</kbd>
            </span>
          </button>

          {/* New Story */}
          <a
            href="/stories/new"
            className="cms-btn cms-btn-primary"
          >
            <Plus size={12} />
            New Story
          </a>

          {/* Dark mode toggle */}
          <button
            type="button"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleDark}
            className={iconBtnClass}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Notifications bell */}
          <div className="relative">
            <button
              type="button"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-haspopup="true"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen(o => !o)}
              className={iconBtnClass}
            >
              <Bell size={14} />
            </button>

            {/* Badge */}
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 min-w-4 h-4 px-[3px] rounded-full bg-[var(--lito-gold)] border-[1.5px] border-[var(--cms-header-bg)] flex items-center justify-center font-body text-[9px] font-bold text-white pointer-events-none"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}

            {/* Panel */}
            <NotificationsPanel
              open={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
            />
          </div>

          {/* Avatar */}
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name ?? 'User'}
              className="w-8 h-8 rounded-full object-cover border border-[var(--lito-border)] cursor-pointer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--lito-gold-soft)] border border-[var(--lito-border)] flex items-center justify-center font-body text-xs font-medium text-[var(--lito-gold-deep)] cursor-pointer shrink-0">
              {initials}
            </div>
          )}
        </div>
      </header>

      {/* Global search modal — rendered at document root level */}
      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  )
}
