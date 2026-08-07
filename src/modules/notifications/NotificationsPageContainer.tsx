// Full notifications page — the "View all" destination from the header
// bell dropdown (NotificationsPanel). Same org-wide system-checks feed,
// just with error/warning expanded by default and room to load more items
// per check instead of the dropdown's compact collapsed-by-default view.
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { orgService, SystemChecksList, Skeleton } from '@litostudio/ui-cms'

export default function NotificationsPageContainer() {
  const { data: checks, isLoading } = useQuery({
    queryKey: ['dashboard', 'system-checks'],
    queryFn: () => orgService.getSystemChecks(),
    staleTime: 60 * 1000,
  })

  const totalItems = checks?.reduce((sum, c) => sum + c.count, 0) ?? 0

  return (
    <div className="cms-page p-8 overflow-y-auto h-full bg-[var(--cms-main-bg)]">
      <div className="mb-6 flex items-center gap-2">
        <Bell size={18} className="text-[var(--text-muted)]" />
        <h1 className="font-display text-2xl font-normal text-[var(--text-primary)]">
          Notifications {!isLoading && `(${totalItems})`}
        </h1>
      </div>

      <div className="cms-card px-5 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !checks || checks.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Bell size={28} className="text-[var(--lito-border)] mx-auto mb-3" />
            <p className="font-body text-[13px] text-[var(--text-muted)]">
              You're all caught up!
            </p>
          </div>
        ) : (
          <SystemChecksList checks={checks} defaultExpandedLevels={['error', 'warning']} />
        )}
      </div>
    </div>
  )
}
