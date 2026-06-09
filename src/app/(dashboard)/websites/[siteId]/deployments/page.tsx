'use client'
// apps/cms/src/app/(dashboard)/websites/[siteId]/deployments/page.tsx
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Rocket, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { PageHeader, Button, Card, CardContent, Badge, formatDateTime } from '@litostudio/ui'
import { api } from '@/lib/api'

interface Deployment { id: string; status: 'success' | 'failed' | 'pending' | 'building'; created_at: string; deployed_by: string }

export default function SiteDeploymentsPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['site-deployments', siteId],
    queryFn: () => api.get<{ data: Deployment[] }>(`/api/v1/cms/sites/${siteId}/deployments`),
  })

  const deploy = useMutation({
    mutationFn: () => api.post(`/api/v1/cms/sites/${siteId}/deployments`, {}),
    onSuccess: () => toast.success('Deployment triggered'),
    onError: () => toast.error('Deployment failed'),
  })

  const deployments = data?.data ?? []

  function StatusIcon({ status }: { status: Deployment['status'] }) {
    if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500" />
    return <Clock className="h-4 w-4 text-amber-500" />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Deployments" description="Deploy your website to production.">
        <Button onClick={() => deploy.mutate()} disabled={deploy.isPending}>
          <Rocket className="h-4 w-4" />{deploy.isPending ? 'Deploying…' : 'Deploy now'}
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="p-4 h-14 animate-pulse bg-muted/40" /></Card>)}</div>
      ) : deployments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Rocket className="h-10 w-10 mx-auto mb-3 opacity-40" /><p>No deployments yet.</p></div>
      ) : (
        <div className="space-y-2">
          {deployments.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <StatusIcon status={d.status} />
                <div className="flex-1"><p className="text-sm">{formatDateTime(d.created_at)}</p><p className="text-xs text-muted-foreground">by {d.deployed_by}</p></div>
                <Badge variant={d.status === 'success' ? 'success' : d.status === 'failed' ? 'destructive' : 'warning'} className="capitalize">{d.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
