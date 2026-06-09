'use client'
// apps/cms/src/app/(dashboard)/websites/[siteId]/layout.tsx
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@litostudio/ui'
import { api } from '@/lib/api'

const tabs = [
  { label: 'Overview', segment: '' },
  { label: 'Content', segment: 'content' },
  { label: 'Navigation', segment: 'navigation' },
  { label: 'SEO', segment: 'seo' },
  { label: 'Media', segment: 'media' },
  { label: 'Deployments', segment: 'deployments' },
  { label: 'Settings', segment: 'settings' },
]

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { siteId } = useParams<{ siteId: string }>()
  const pathname = usePathname()

  const { data: site } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => api.get<{ id: string; name: string }>(`/api/v1/cms/organizations/sites/${siteId}`),
    enabled: !!siteId,
  })

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground flex items-center gap-1">
        <Link href="/websites" className="hover:text-foreground">Websites</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{site?.name ?? '…'}</span>
      </div>

      <nav className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {tabs.map(({ label, segment }) => {
          const href = `/websites/${siteId}${segment ? `/${segment}` : ''}`
          const exact = !segment
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                active ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
