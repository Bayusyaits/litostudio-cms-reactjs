'use client'
// apps/cms/src/app/(dashboard)/page.tsx — Dashboard overview
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Globe, FileText, ImageIcon, Rocket, ArrowRight, TrendingUp } from 'lucide-react'
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, formatRelative } from '@litostudio/ui'
import { api } from '@/lib/api'

interface DashboardStats { sites: number; stories: number; media: number; deployments: number }
interface RecentItem { id: string; title: string; type: string; updated_at: string; status: string }

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStats>('/api/v1/cms/dashboard/stats'),
  })

  const { data: recent } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: () => api.get<{ data: RecentItem[] }>('/api/v1/cms/dashboard/recent'),
  })

  const statCards = [
    { label: 'Websites', value: stats?.sites ?? '—', icon: Globe, href: '/websites' },
    { label: 'Content pieces', value: stats?.stories ?? '—', icon: FileText, href: '/content' },
    { label: 'Media files', value: stats?.media ?? '—', icon: ImageIcon, href: '/media' },
    { label: 'Deployments', value: stats?.deployments ?? '—', icon: Rocket, href: '/deployments' },
  ]

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Welcome back. Here's what's happening." />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.label} href={s.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="rounded-lg bg-muted p-2.5 shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'New story', href: '/content/stories/new', icon: FileText },
            { label: 'New page', href: '/content/pages/new', icon: FileText },
            { label: 'Add website', href: '/websites/new', icon: Globe },
            { label: 'Upload media', href: '/media', icon: ImageIcon },
          ].map((a) => {
            const Icon = a.icon
            return (
              <Link
                key={a.label}
                href={a.href}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {a.label}
                <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recent?.data?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No recent activity.</p>
          ) : (
            <div className="divide-y divide-border">
              {recent.data.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                  </div>
                  <Badge variant={item.status === 'active' ? 'success' : 'muted'} className="shrink-0">
                    {item.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">{formatRelative(item.updated_at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
