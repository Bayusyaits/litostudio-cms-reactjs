import { useQuery } from '@tanstack/react-query'
import { useWebsiteStore } from '@/stores/website.store'
import { orgService } from '@/services/org.service'
import { DashboardPageView } from './DashboardPageView'

export default function DashboardPageContainer() {
  const { activeSite } = useWebsiteStore()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats', activeSite?.id],
    queryFn: () => orgService.getDashboardStats(activeSite!.id),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const { data: recent, isLoading: recentLoading } = useQuery({
    queryKey: ['dashboard', 'recent', activeSite?.id],
    queryFn: () => orgService.getDashboardRecent(activeSite!.id),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  return (
    <DashboardPageView
      stats={stats}
      recent={recent}
      loading={statsLoading || recentLoading}
      siteName={activeSite?.name}
    />
  )
}
