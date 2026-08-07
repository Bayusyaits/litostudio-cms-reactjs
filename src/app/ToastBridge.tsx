// apps/cms/src/app/ToastBridge.tsx
// Renders nothing — registers this render tree's useToast() into
// lib/toastBridge.ts so the QueryClient's global MutationCache onError
// handler (see lib/queryClient.ts) can show error toasts without itself
// needing to call a hook. See toastBridge.ts's header comment for the full
// rationale. Must be mounted inside <ToastProvider> (App.tsx already does
// this — see that file).
import { useEffect } from 'react'
import { useToast } from '@litostudio/ui-cms'
import { registerToastBridge, unregisterToastBridge } from '@/lib/toastBridge'

export function ToastBridge() {
  const toast = useToast()

  useEffect(() => {
    registerToastBridge(toast.show)
    return () => unregisterToastBridge(toast.show)
  }, [toast.show])

  return null
}
