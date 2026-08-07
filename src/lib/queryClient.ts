import { QueryClient, MutationCache } from '@tanstack/react-query'
import { getErrorMessage } from '@litostudio/ui-cms'
import { showGlobalErrorToast } from './toastBridge'

export const queryClient = new QueryClient({
  // SYSTEMIC BUG FIX (QA-AUDIT-2026-08-05.md findings 2.1/2.2): 20+
  // containers across this app had zero onError handler on their
  // mutations — page-section toggle/delete/reorder, order status changes,
  // product delete/bulk-delete, team member remove/role-change, and many
  // more — so a failed delete/toggle/reorder/status-change left the UI
  // showing stale or wrong state with no feedback at all. This had already
  // been fixed once, piecemeal, for the Pages module (see
  // PagesPageContainer.tsx's per-mutation onError calls) but the sweep
  // never reached the rest of the app.
  //
  // Rather than repeat that sweep 20+ more times (and have it drift out of
  // sync again the next time someone adds a module — see AppSidebar.tsx's
  // icon-registry gap for a fresh example of exactly that failure mode),
  // this is a single global fallback: MutationCache.onError fires for
  // EVERY mutation in the app, in addition to any onError the mutation
  // itself defines. Mutations that already handle their own errors (like
  // PagesPageContainer.tsx's) are left untouched — `mutation.options.onError`
  // being set is used as the signal that a more specific, action-aware
  // message is already being shown, so this generic fallback backs off
  // rather than double-toasting. Every mutation that previously had NO
  // handler at all now gets at least a generic "Something went wrong" toast
  // instead of silently doing nothing. See lib/toastBridge.ts for why this
  // needs an indirection layer to reach the toast system from here.
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.options.onError) return
      showGlobalErrorToast({
        message: 'Something went wrong',
        description: getErrorMessage(error),
      })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 min
      gcTime:    1000 * 60 * 10,      // 10 min
      retry:     (failureCount, error) => {
        const msg = getErrorMessage(error)
        if (msg.includes('401') || msg.includes('403')) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
