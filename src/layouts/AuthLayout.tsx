import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore()
  const { pathname } = useLocation()

  // Allow callback/verify pages to render even when already "authenticated"
  // in persisted state — they need to complete their own flows first.
  const isPassthrough = pathname.startsWith('/auth/')

  if (isAuthenticated && !isPassthrough) return <Navigate to="/dashboard" replace />

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[var(--cms-surface-2)]"
      style={{ backgroundImage: 'radial-gradient(ellipse at 60% 40%, rgba(212,168,83,0.06) 0%, transparent 60%)' }}
    >
      <div className="w-full max-w-md px-4">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <img
            src="/logo/logo-horizontal-black.png"
            alt="Lito Studio"
            style={{ height: 36, margin: '0 auto 8px', display: 'block' }}
          />
          <p className="font-body text-sm text-[var(--text-muted)]">
            Visual storytelling CMS
          </p>
        </div>

        {/* Auth card */}
        <div className="cms-card p-8">
          <Outlet />
        </div>

        <p className="text-center font-body text-xs text-[var(--text-muted)] mt-6">
          © {new Date().getFullYear()} Lito Studio. All rights reserved.
        </p>
      </div>
    </div>
  )
}
