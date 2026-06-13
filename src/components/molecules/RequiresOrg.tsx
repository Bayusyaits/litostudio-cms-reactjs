/**
 * RequiresOrg — Feature-access guard component.
 *
 * Wraps any feature UI that requires an active organization.
 * When no org is present: renders a "Create Organization First" CTA
 * instead of redirecting or looping.
 *
 * Usage:
 *   <RequiresOrg feature="Products">
 *     <ProductsPage />
 *   </RequiresOrg>
 */

import { Link } from 'react-router-dom'
import { Building2, ArrowRight } from 'lucide-react'
import { useOrgStore } from '@/stores/org.store'

interface RequiresOrgProps {
  /** Displayed in the CTA: "Products requires an organization." */
  feature?: string
  children: React.ReactNode
}

export function RequiresOrg({ feature, children }: RequiresOrgProps) {
  const { org } = useOrgStore()

  if (org) return <>{children}</>

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center gap-5">
      <div className="w-14 h-14 rounded-2xl bg-[var(--cms-surface-3)] flex items-center justify-center">
        <Building2 className="w-7 h-7 text-[var(--text-muted)]" />
      </div>

      <div className="space-y-1 max-w-xs">
        <p className="font-display text-base font-semibold text-[var(--text-primary)]">
          {feature ? `${feature} requires an organization` : 'Organization required'}
        </p>
        <p className="font-body text-sm text-[var(--text-muted)]">
          Create your organization and website to unlock this feature.
        </p>
      </div>

      <Link
        to="/onboarding"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
          bg-[var(--lito-teal)] text-white font-body text-sm font-medium
          hover:bg-[var(--lito-teal)]/90 transition-colors"
      >
        Create organization
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
