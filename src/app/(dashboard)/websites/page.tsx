'use client'
// apps/cms/src/app/(dashboard)/websites/page.tsx
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Globe, ExternalLink } from 'lucide-react'
import { PageHeader, Button, Card, CardContent, Badge } from '@litostudio/ui'
import { api } from '@/lib/api'
import { formatRelative } from '@/lib/utils'

interface Site {
  id: string
  name: string
  slug: string
  domain?: string
  status: string
  updated_at: string
}

export default function WebsitesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => api.get<{ data: Site[] }>('/api/v1/cms/organizations/sites'),
  })

  const sites = data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Websites" description="Manage all your websites from one place.">
        <Button asChild>
          <Link href="/websites/new"><Plus className="h-4 w-4" /> Add website</Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5 h-28 animate-pulse bg-muted/40" /></Card>
          ))}
        </div>
      ) : sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Globe className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-sm font-medium mb-1">No websites yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first website to get started.</p>
          <Button asChild><Link href="/websites/new"><Plus className="h-4 w-4" /> Add website</Link></Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Link key={site.id} href={`/websites/${site.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                        <Globe className="h-4 w-4 text-stone-500" />
                      </div>
                      <p className="font-medium text-sm truncate">{site.name}</p>
                    </div>
                    <Badge variant={site.status === 'active' ? 'success' : 'muted'}>{site.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {site.domain ?? `litostudio.id/${site.slug}`}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Updated {formatRelative(site.updated_at)}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
