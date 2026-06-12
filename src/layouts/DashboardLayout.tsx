import { useEffect, useState } from 'react'
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useWebsiteStore } from '@/stores/website.store'
import { useOrgStore } from '@/stores/org.store'
import { useThemeStore } from '@/stores/theme.store'
import { AppSidebar } from '@/components/organisms/AppSidebar'
import { AppHeader } from '@/components/organisms/AppHeader'
import { CommandPalette } from '@/components/organisms/CommandPalette'
import { DashboardSkeleton } from '@/components/atoms/Skeleton'

/**
 * Routes that are accessible without an active organization.
 * Everything else requires org context — redirect to /organizations if missing.
 */
const ORG_EXEMPT_PATHS = new Set([
  '/dashboard',
  '/onboarding',   // setup wizard — shown instead of /organizations when no org
  '/organizations',
  '/unauthorized',
  '/analytics',    // coming soon stub
  '/campaigns',    // coming soon stub
  '/seo',          // coming soon stub
])

/** Returns true if the given pathname is accessible without an org */
function isOrgExempt(pathname: string): boolean {
  if (ORG_EXEMPT_PATHS.has(pathname)) return true
  // Auth utility pages
  if (pathname.startsWith('/auth/')) return true
  return false
}

export function DashboardLayout() {
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const { activeSite } = useWebsiteStore()
  const { org } = useOrgStore()
  const { applyTheme } = useThemeStore()
  const location = useLocation()
  const [cmdOpen, setCmdOpen] = useState(false)

  // Apply persisted theme on mount
  useEffect(() => { applyTheme() }, [applyTheme])

  // Global ⌘K shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── 1. Wait for Zustand persist to rehydrate before making auth decisions.
  // Without this guard, isAuthenticated starts false and every direct navigation
  // would flash a /login redirect.
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cms-main-bg)]">
        <div className="p-6 w-full max-w-4xl">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  // ── 2. Unauthenticated — redirect to login, preserve returnTo
  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />
  }

  // ── 3. No organization — redirect protected routes to /onboarding wizard.
  // Exempt paths (dashboard, /onboarding, /organizations) pass through so the
  // user can complete setup without triggering another redirect.
  if (!org && !isOrgExempt(location.pathname)) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--cms-main-bg)' }}>
      {/* Dark ink sidebar */}
      <AppSidebar />

      {/* Main column */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <AppHeader />

        {/* No-org banner — only on dashboard and org-exempt paths when no org */}
        {!org && location.pathname === '/dashboard' && (
          <div style={{
            padding: '8px 20px',
            background: 'rgba(212,168,83,0.10)',
            borderBottom: '1px solid rgba(212,168,83,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--lito-gold-deep)', margin: 0 }}>
              You need an organization to manage content.
            </p>
            <Link
              to="/onboarding"
              style={{
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                color: 'var(--lito-gold-deep)',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              Set up your workspace →
            </Link>
          </div>
        )}

        {/* No-site banner — only when org exists but no site selected */}
        {org && !activeSite && location.pathname !== '/organizations' && (
          <div style={{
            padding: '7px 20px',
            background: 'rgba(212,168,83,0.10)',
            borderBottom: '1px solid rgba(212,168,83,0.20)',
            textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--lito-gold-deep)' }}>
              Select a website from the workspace switcher to manage content.
            </p>
          </div>
        )}

        {/* Page */}
        <main id="main-content" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  )
}
