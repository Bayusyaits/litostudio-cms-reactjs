/**
 * workspace.ts — centralized workspace state helpers.
 *
 * shouldShowOnboarding logic:
 *   SHOW  → user has no org_id (never created one)
 *   SHOW  → org exists in DB but no active site
 *   HIDE  → org + activeSite both present and active
 *   WAIT  → org_id known but org object not yet loaded (hydrating)
 */

import type { User, Organization, Site } from '@/types/auth.types'

export type WorkspaceState =
  | 'loading'      // org_id known but org not yet fetched
  | 'onboarding'   // no org_id → show setup wizard
  | 'no-site'      // org exists, no active site → site step
  | 'ready'        // org + activeSite both present

/**
 * Derive the workspace state from current store values.
 * Pass `isHydrating` = true while the API fetch is in-flight.
 */
export function getWorkspaceState(
  user: User | null,
  org: Organization | null,
  activeSite: Site | null,
  isHydrating: boolean,
): WorkspaceState {
  // Not logged in — caller should redirect to /login
  if (!user) return 'loading'

  // org_id present in user record but store not yet hydrated
  if (user.org_id && !org) {
    if (isHydrating) return 'loading'
    // Hydration finished but org still null → stale store, treat as no-org
    return 'onboarding'
  }

  // No org at all
  if (!user.org_id || !org) return 'onboarding'

  // Org present but no active site
  if (!activeSite) return 'no-site'

  return 'ready'
}

/**
 * Simple boolean gate — use for conditional rendering.
 * Returns true ONLY when onboarding wizard should be displayed.
 */
export function shouldShowOnboarding(
  user: User | null,
  org: Organization | null,
  activeSite: Site | null,
  isHydrating: boolean,
): boolean {
  const state = getWorkspaceState(user, org, activeSite, isHydrating)
  return state === 'onboarding' || state === 'no-site'
}
