import { useEffect } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { useOrgStore } from '@litostudio/ui-cms'
import { useThemeStore } from '@/stores/theme.store'
import { AppSidebar } from '@/components/organisms/AppSidebar'
import { AppHeader } from '@/components/organisms/AppHeader'
import { DashboardSkeleton } from '@litostudio/ui-cms'
import { useWorkspaceHydration } from '@/hooks/useWorkspaceHydration'
import { useTokenRefresh } from '@/hooks/useTokenRefresh'
import { getWorkspaceState } from '@/lib/workspace'
import { useAnalyticsIdentify } from '@/hooks/useAnalyticsIdentify'

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

  // Wire PostHog identify — re-runs when user id, role, or org plan changes.
  // resetAnalytics() clears the PostHog distinct_id cookie on logout.
  const { resetAnalytics } = useAnalyticsIdentify()

  // Reset PostHog identity when the session ends (catches both soft and full logout)
  useEffect(() => {
    if (!isAuthenticated) resetAnalytics()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  // Apply persisted theme on mount
  useEffect(() => { applyTheme() }, [applyTheme])

  // AC-06: Move focus to #main-content on SPA route change (WCAG 2.4.3 / 4.1.3)
  useEffect(() => {
    const main = document.getElementById('main-content')
    if (main) main.focus({ preventScroll: true })
  }, [location.pathname])

  // A1-4: Update document.title on route change
  useEffect(() => {
    const routeLabels: Record<string, string> = {
      '/dashboard':   'Dashboard',
      '/pages':       'Pages',
      '/stories':     'Stories',
      '/media':       'Media',
      '/settings':    'Settings',
      '/themes':      'Themes',
      '/seo':         'SEO',
      '/analytics':   'Analytics',
      '/domains':     'Domains',
      '/team':        'Team',
      '/products':    'Products',
      '/orders':      'Orders',
      '/reviews':     'Reviews',
      '/newsletter':  'Newsletter',
      '/messages':    'Messages',
      '/gallery':     'Gallery',
      '/services':    'Services',
      '/testimonials':'Testimonials',
      '/faqs':        'FAQs',
      '/pricing':     'Pricing',
      '/campaigns':   'Campaigns',
      '/journal':     'Journal',
      '/destinations':'Destinations',
      '/hero':        'Hero',
      '/legal':       'Legal Center',
      '/onboarding':  'Welcome',
    }
    const match = Object.keys(routeLabels)
      .sort((a, b) => b.length - a.length) // longest first for specificity
      .find(k => location.pathname.startsWith(k))
    const label = match ? routeLabels[match] : 'Lito Studio'
    document.title = `${label} — Lito Studio`
  }, [location.pathname])

  // Global ⌘K shortcut — owned by AppHeader (opens SearchDialog, which now
  // also surfaces the Navigate/Create quick actions this layout's separate
  // CommandPalette + duplicate ⌘K listener used to own). Two listeners on
  // the same keydown meant ⌘K used to open both dialogs stacked at once.

  // ── Proactive token refresh (keeps session alive up to 6 hours) ─────────────
  useTokenRefresh()

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
      {/* AC-02: Skip nav link — WCAG 2.4.1 (Bypass Blocks) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:rounded focus:bg-[var(--lito-teal)] focus:px-3 focus:py-2 focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>

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
    </div>
  )
}
