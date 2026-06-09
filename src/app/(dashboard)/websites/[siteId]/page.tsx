'use client'
// apps/cms/src/app/(dashboard)/websites/[siteId]/page.tsx
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Rocket } from 'lucide-react'
import { PageHeader, Button, Card, CardContent, CardHeader, CardTitle, Badge, formatDateTime } from '@litostudio/ui'
import { api } from '@/lib/api'

interface Site { id: string; name: string; slug: string; domain?: string; status: string; updated_at: string }
interface Deployment { id: string; status: string; created_at: string; deployed_by: string }

export default function SiteOverviewPage() {
  const { siteId } = useParams<{ siteId: string }>()

  const { data: site } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => api.get<Site>(`/api/v1/cms/organizations/sites/${siteId}`),
  })

  const { data: deployments } = useQuery({
    queryKey: ['site-deployments', siteId],
    queryFn: () => api.get<{ data: Deployment[] }>(`/api/v1/cms/sites/${siteId}/deployments?limit=5`),
  })

  const deploy = useMutation({
    mutationFn: () => api.post(`/api/v1/cms/sites/${siteId}/deployments`, {}),
    onSuccess: () => toast.success('Deployment triggered'),
    onError: () => toast.error('Deployment failed'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{site?.name ?? '…'}</h2>
          <p className="text-sm text-muted-foreground font-mono">{site?.domain ?? `litostudio.id/${site?.slug ?? ''}`}</p>
        </div>
        <Button onClick={() => deploy.mutate()} disabled={deploy.isPending}>
          <Rocket className="h-4 w-4" />
          {deploy.isPending ? 'Deploying…' : 'Deploy'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Status', value: <Badge variant={site?.status === 'active' ? 'success' : 'muted'}>{site?.status ?? '—'}</Badge> },
          { label: 'Slug', value: <span className="font-mono text-sm">{site?.slug ?? '—'}</span> },
          { label: 'Last updated', value: <span className="text-sm">{site?.updated_at ? formatDateTime(site.updated_at) : '—'}</span> },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              {item.value}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Recent deployments</CardTitle></CardHeader>
        <CardContent>
          {!deployments?.data?.length ? (
            <p className="text-sm text-muted-foreground">No deployments yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {deployments.data.map((d) => (
                <div key={d.id} className="flex items-center gap-3 py-3">
                  <Badge variant={d.status === 'success' ? 'success' : d.status === 'failed' ? 'destructive' : 'warning'}>
                    {d.status}
                  </Badge>
                  <span className="text-sm flex-1">{formatDateTime(d.created_at)}</span>
                  <span className="text-xs text-muted-foreground">{d.deployed_by}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
