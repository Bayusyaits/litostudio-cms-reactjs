import { Suspense } from 'react'
import { DashboardSkeleton } from '@litostudio/ui-cms'

// Extracted from router.tsx so that file only exports the non-component
// `router` object (react-refresh/only-export-components requires a file to
// export either only components or only non-components for Fast Refresh to
// work correctly).

export function PageLoader() {
  return (
    <div className="p-6">
      <DashboardSkeleton />
    </div>
  )
}

export function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}
