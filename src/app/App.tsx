import { RouterProvider } from 'react-router-dom'
import { ToastProvider } from '@litostudio/ui-cms'
import { QueryProvider }          from '@/providers/QueryProvider'
import { ThemeProvider }          from '@/providers/ThemeProvider'
import { TemplateSystemProvider } from '@/providers/TemplateSystemProvider'
import { AnalyticsProvider }      from '@/providers/AnalyticsProvider'
import { router } from './router'

// ToastProvider mounted once here — EnterpriseDataTable (skin="cms") calls
// useToast() unconditionally even in read-only/no-adapter mode, so it
// throws without a provider somewhere above it in the tree. Same pattern as
// apps/cms-superadmin/src/app/App.tsx.
export function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <ToastProvider>
          <AnalyticsProvider>
            <TemplateSystemProvider>
              <RouterProvider router={router} />
            </TemplateSystemProvider>
          </AnalyticsProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
