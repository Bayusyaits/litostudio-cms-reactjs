import { useQuery } from '@tanstack/react-query'
import { useWebsiteStore, useOrgStore, orgService } from '@litostudio/ui-cms'
import { useAuthStore } from '@/stores/auth.store'
import { DashboardPageView } from './DashboardPageView'
import { WelcomeBackDashboard } from './WelcomeBackDashboard'
import { getWorkspaceState } from '@/lib/workspace'

export default function DashboardPageContainer() {
  const { user } = useAuthStore()
  const { org } = useOrgStore()
  const { activeSite } = useWebsiteStore()

  const wsState = getWorkspaceState(user, org, activeSite, false)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats', activeSite?.id],
    queryFn: () => orgService.getDashboardStats(activeSite!.id),
    enabled: wsState === 'ready',
    staleTime: 2 * 60 * 1000,
  })

  const { data: recent, isLoading: recentLoading } = useQuery({
    queryKey: ['dashboard', 'recent', activeSite?.id],
    queryFn: () => orgService.getDashboardRecent(activeSite!.id),
    enabled: wsState === 'ready',
    staleTime: 2 * 60 * 1000,
  })

  const { data: readiness } = useQuery({
    queryKey: ['dashboard', 'commerce-readiness'],
    queryFn: () => orgService.getCommerceReadiness(),
    enabled: wsState === 'ready',
    staleTime: 2 * 60 * 1000,
  })

  const { data: lowStock } = useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: () => orgService.getLowStockProducts(),
    enabled: wsState === 'ready',
    staleTime: 2 * 60 * 1000,
  })

  // ── CASE 2: Org + Site present → rich dashboard ───────────────────────────
  if (wsState === 'ready') {
    return (
      <DashboardPageView
        stats={stats}
        recent={recent}
        loading={statsLoading || recentLoading}
        siteName={activeSite?.name}
        org={org!}
        site={activeSite!}
        readiness={readiness}
        lowStock={lowStock}
      />
    )
  }

  // ── CASE 1: No org or no site → Welcome Back workspace setup card ─────────
  return <WelcomeBackDashboard />
}
