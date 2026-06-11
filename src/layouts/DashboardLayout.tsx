import { useEffect, useState } from 'react'
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useWebsiteStore } from '@/stores/website.store'
import { useOrgStore } from '@/stores/org.store'
import { useThemeStore } from '@/stores/theme.store'
import { AppSidebar } from '@/components/organisms/AppSidebar'
import { AppHeader } from '@/components/organisms/AppHeader'
import { CommandPalette } from '@/components/organisms/CommandPalette'

export function DashboardLayout() {
  const { isAuthenticated } = useAuthStore()
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

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--cms-main-bg)' }}>
      {/* Dark ink sidebar */}
      <AppSidebar />

      {/* Main column */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <AppHeader />

        {/* No-org banner — show everywhere except /organizations */}
        {!org && location.pathname !== '/organizations' && (
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
              to="/organizations"
              style={{
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                color: 'var(--lito-gold-deep)',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              Create one →
            </Link>
          </div>
        )}

        {/* No-site banner — only when org exists but no site selected */}
        {org && !activeSite && (
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
