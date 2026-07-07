import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { configureHttp } from '@litostudio/ui-cms'
import { App } from './app/App'
import { getStoredToken, handleUnauthorized, handleForbidden } from '@/lib/http/auth'
import './styles/globals.css'

// Wire @litostudio/ui-cms's injectable HTTP client to this app's own
// token storage and 401/403 handling — required before mounting anything
// that uses ui-cms services/stores built on that client (e.g. the
// Gutenberg editor's pagesService/mediaService/themeService/aiAssistantService).
// See packages/ui-cms/src/http/config.ts's file header for why this is
// injected rather than imported directly.
configureHttp({
  baseUrl: import.meta.env.VITE_API_URL ?? '',
  getToken: getStoredToken,
  onUnauthorized: handleUnauthorized,
  onForbidden: handleForbidden,
})

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
