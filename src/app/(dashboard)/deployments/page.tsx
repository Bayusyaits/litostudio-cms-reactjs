'use client'
// apps/cms/src/app/(dashboard)/deployments/page.tsx
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, XCircle, Clock, Rocket } from 'lucide-react'
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, formatRelative, cn } from '@litostudio/ui'
import { api } from '@/lib/api'

interface Deployment {
  id: string
  site_name: string
  site_id: string
  status: 'success' | 'failed' | 'pending' | 'building'
  triggered_by: string
  created_at: string
  duration_seconds?: number
}

function StatusIcon({ status }: { status: Deployment['status'] }) {
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  if (status === 'failed') return <XCircle className="h-4 w-4 text-destructive" />
  return <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
}

export default function DeploymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['all-deployments'],
    queryFn: () => api.get<{ data: Deployment[] }>('/api/v1/cms/deployments'),
    refetchInterval: 10_000,
  })
  const deployments = data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Deployments" description="Build and deployment history across all websites." />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Rocket className="h-4 w-4" /> Recent deployments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse bg-muted/40 rounded-md" />
              ))}
            </div>
          ) : deployments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No deployments yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {deployments.map((d) => (
                <div key={d.id} className="flex items-center gap-3 py-3">
                  <StatusIcon status={d.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.site_name}</p>
                    <p className="text-xs text-muted-foreground">
                      by {d.triggered_by}
                      {d.duration_seconds != null && ` · ${d.duration_seconds}s`}
                    </p>
                  </div>
                  <Badge
                    variant={d.status === 'success' ? 'success' : d.status === 'failed' ? 'destructive' : 'warning'}
                    className="text-xs capitalize shrink-0"
                  >
                    {d.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">{formatRelative(d.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
