import { useLocation } from 'react-router-dom'
import { Search, Bell, Moon, Sun, Menu, Plus } from 'lucide-react'
import { useThemeStore } from '@/stores/theme.store'
import { useAuthStore } from '@/stores/auth.store'
import { useWebsiteStore } from '@/stores/website.store'

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
  '/navigation':   'Navigation',
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
    <header style={{
      height: 'var(--cms-header-h)',
      background: 'var(--cms-header-bg)',
      borderBottom: '1px solid var(--lito-border)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 20px',
      flexShrink: 0,
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
        {/* ⌘K Search */}
        <button
          type="button"
          aria-label="Open command palette (⌘K)"
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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 13px',
            borderRadius: 999,
            background: 'var(--lito-ink)',
            color: 'var(--lito-cream)',
            fontSize: 12,
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'background 150ms',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2B2B2B')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--lito-ink)')}
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

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label="Notifications"
            style={iconBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lito-ink)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--lito-border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <Bell size={14} />
          </button>
          {/* Gold dot indicator */}
          <span style={{
            position: 'absolute',
            top: 7, right: 7,
            width: 6, height: 6,
            borderRadius: '50%',
            background: 'var(--lito-gold)',
            border: '1.5px solid var(--cms-header-bg)',
            pointerEvents: 'none',
          }} />
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
  )
}
