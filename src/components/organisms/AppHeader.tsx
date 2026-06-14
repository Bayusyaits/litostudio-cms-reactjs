// apps/cms/src/components/organisms/AppHeader.tsx
import { useEffect, useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Bell, Moon, Sun, Menu, Plus } from 'lucide-react'
import { useThemeStore } from '@/stores/theme.store'
import { useAuthStore } from '@/stores/auth.store'
import { useWebsiteStore } from '@/stores/website.store'
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

  const iconBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 6,
    border: '1px solid var(--lito-border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'border-color 150ms, color 150ms, background 150ms',
  }

  return (
    <>
      <header style={{
        height: 'var(--cms-header-h)',
        background: 'var(--cms-header-bg)',
        borderBottom: '1px solid var(--lito-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 20px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 100,
      }}>
        {/* Menu toggle */}
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={toggleSidebar}
          style={iconBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lito-ink)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--lito-border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <Menu size={15} />
        </button>

        {/* Breadcrumb */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {activeSite?.domain && (
            <>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {activeSite.domain}
              </span>
              <span style={{ fontSize: 12, color: 'var(--lito-border)' }}>/</span>
            </>
          )}
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {pageLabel}
          </span>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* ⌘K Search trigger */}
          <button
            type="button"
            aria-label="Open global search (⌘K)"
            onClick={openSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 999,
              border: '1px solid var(--lito-border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              transition: 'border-color 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--lito-ink)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--lito-border)')}
          >
            <Search size={12} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Search
              <kbd style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '1px 4px', borderRadius: 3,
                background: 'var(--lito-border)', color: 'var(--text-muted)',
                fontSize: 10, fontFamily: 'var(--font-body)',
              }}>⌘K</kbd>
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
            style={iconBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lito-ink)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--lito-border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Notifications bell */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-haspopup="true"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen(o => !o)}
              style={iconBtnStyle}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lito-ink)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--lito-border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <Bell size={14} />
            </button>

            {/* Badge */}
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: -4, right: -4,
                  minWidth: 16, height: 16,
                  padding: '0 3px',
                  borderRadius: 999,
                  background: 'var(--lito-gold)',
                  border: '1.5px solid var(--cms-header-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-body)',
                  fontSize: 9, fontWeight: 700,
                  color: '#fff',
                  pointerEvents: 'none',
                }}
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
              style={{
                width: 32, height: 32,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid var(--lito-border)',
                cursor: 'pointer',
              }}
            />
          ) : (
            <div style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: 'var(--lito-gold-soft)',
              border: '1px solid var(--lito-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: 12, fontWeight: 500,
              color: 'var(--lito-gold-deep)',
              cursor: 'pointer',
              flexShrink: 0,
            }}>
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
