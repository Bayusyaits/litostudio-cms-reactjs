import { RouterProvider } from 'react-router-dom'
import { QueryProvider }          from '@/providers/QueryProvider'
import { ThemeProvider }          from '@/providers/ThemeProvider'
import { TemplateSystemProvider } from '@/providers/TemplateSystemProvider'
import { router } from './router'

export function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <TemplateSystemProvider>
          <RouterProvider router={router} />
        </TemplateSystemProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
