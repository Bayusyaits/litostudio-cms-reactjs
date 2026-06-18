import { useEffect, useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useWebsiteStore } from '@/stores/website.store'
import { useOrgStore } from '@/stores/org.store'
import { useThemeStore } from '@/stores/theme.store'
import { AppSidebar } from '@/components/organisms/AppSidebar'
import { AppHeader } from '@/components/organisms/AppHeader'
import { CommandPalette } from '@/components/organisms/CommandPalette'
import { DashboardSkeleton } from '@/components/atoms/Skeleton'
import { useWorkspaceHydration } from '@/hooks/useWorkspaceHydration'
import { getWorkspaceState } from '@/lib/workspace'

/**
 * Routes accessible without an active organization or website.
 * All other routes require org context.
 */
const ORG_EXEMPT_PATHS = new Set([
  '/dashboard',
  '/onboarding',
  '/organizations',
  '/unauthorized',
  '/analytics',
  '/campaigns',
  '/seo',
])

function isOrgExempt(pathname: string): boolean {
  if (ORG_EXEMPT_PATHS.has(pathname)) return true
  if (pathname.startsWith('/auth/')) return true
  return false
}

export function DashboardLayout() {
  const { isAuthenticated, _hasHydrated, user } = useAuthStore()
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

  // ── Auto-hydrate org + site stores from API ───────────────────────────────
  // This runs whenever user.org_id is set but org/activeSite are null.
  // isHydrating stays true until the fetch resolves — prevents a flash
  // of the onboarding wizard for users who already have an org.
  const { isHydrating } = useWorkspaceHydration()

  // ── 1. Wait for Zustand persist to rehydrate ──────────────────────────────
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cms-main-bg)]">
        <div className="p-6 w-full max-w-4xl">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  // ── 2. Unauthenticated → /login ───────────────────────────────────────────
  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />
  }

  // ── 3. While hydrating org/site → show skeleton, never redirect to onboarding
  // This prevents the "Let's get you set up" flash for existing users whose
  // Zustand store is empty on first load but whose org exists in the DB.
  if (isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cms-main-bg)]">
        <div className="p-6 w-full max-w-4xl">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  // ── 4. Derive workspace state ─────────────────────────────────────────────
  const wsState = getWorkspaceState(user, org, activeSite, isHydrating)

  // ── 5. Protect routes that need org/site ─────────────────────────────────
  // Only redirect when we are certain the user has no org (wsState = 'onboarding')
  // and they are trying to access a protected page.
  if (wsState === 'onboarding' && !isOrgExempt(location.pathname)) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--cms-main-bg)]">
      {/* Dark ink sidebar */}
      <AppSidebar />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader />

        {/* No-site banner — only when org is known but no active site has been selected */}
        {wsState === 'no-site' && location.pathname !== '/organizations' && location.pathname !== '/onboarding' && (
          <div className="px-5 py-[7px] bg-[rgba(212,168,83,0.10)] border-b border-[rgba(212,168,83,0.20)] text-center">
            <p className="font-body text-xs text-[var(--lito-gold-deep)] m-0">
              Select a website from the workspace switcher to manage content.
            </p>
          </div>
        )}

        {/* Page */}
        <main id="main-content" className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  )
}
