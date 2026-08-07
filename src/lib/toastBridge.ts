// apps/cms/src/lib/toastBridge.ts
//
// QA-AUDIT-2026-08-05.md findings 2.1/2.2: 20+ CMS containers had zero
// onError handler on their mutations — a failed delete/toggle/reorder/
// status-change left the UI showing stale state with no feedback at all.
// The fix is a single global fallback registered on the QueryClient's
// MutationCache (see lib/queryClient.ts) rather than patching every
// container individually — that sweep was already attempted once for the
// Pages module (see PagesPageContainer.tsx's per-mutation onError calls)
// and didn't get applied consistently everywhere else.
//
// The wrinkle: `queryClient` is a plain module-level singleton created
// OUTSIDE React (see lib/queryClient.ts, imported by QueryProvider.tsx
// before any component renders), but this app's toast system (useToast()
// from @litostudio/ui-cms) is a React Context hook that can only be called
// inside a component, and only below <ToastProvider> in the tree. This
// module is the bridge between the two: a small component (ToastBridge,
// mounted once inside <ToastProvider> in App.tsx) calls useToast() and
// registers the real show() function here on mount. queryClient.ts then
// calls showGlobalErrorToast() without ever needing to call a hook itself.
//
// Until ToastBridge has mounted (should be near-instant on app start),
// calls are simply dropped — a startup-timing race losing one error toast
// is a far better failure mode than throwing/crashing the app.
import type { ToastOptions } from '@litostudio/ui-cms'

let showFn: ((opts: ToastOptions) => string) | null = null

export function registerToastBridge(fn: (opts: ToastOptions) => string): void {
  showFn = fn
}

export function unregisterToastBridge(fn: (opts: ToastOptions) => string): void {
  // Only clear if this is still the currently-registered function — guards
  // against a stale unmount clearing a newer registration (shouldn't happen
  // with a single ToastBridge instance, but cheap to guard).
  if (showFn === fn) showFn = null
}

export function showGlobalErrorToast(opts: Omit<ToastOptions, 'variant'>): void {
  showFn?.({ ...opts, variant: 'error' })
}
