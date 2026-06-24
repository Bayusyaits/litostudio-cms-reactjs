import { RouterProvider } from 'react-router-dom'
import { QueryProvider }          from '@/providers/QueryProvider'
import { ThemeProvider }          from '@/providers/ThemeProvider'
import { TemplateSystemProvider } from '@/providers/TemplateSystemProvider'
import { AnalyticsProvider }      from '@/providers/AnalyticsProvider'
import { router } from './router'

export function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AnalyticsProvider>
          <TemplateSystemProvider>
            <RouterProvider router={router} />
          </TemplateSystemProvider>
        </AnalyticsProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
