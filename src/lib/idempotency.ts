/**
 * idempotency.ts — CMS client utility for the Idempotency-Key header.
 *
 * 2026-07 scoped idempotency implementation. See
 * migrations/081_idempotency_keys.sql and apps/backend/src/core/idempotency
 * for the backend side and full design rationale (single-table
 * UNIQUE-constraint approach, no Redis, scoped to 5 real risk areas).
 *
 * Design note — why this uses localStorage keyed by action, not a random
 * UUID generated fresh per function call:
 *
 * A naive "new crypto.randomUUID() every time this function runs" would
 * satisfy single-tab double-click protection (the button is disabled after
 * the first click, so a second call never happens from the same tab) but
 * would NOT satisfy the "three tabs, same Publish action, simultaneously"
 * requirement — three independent tabs would each generate a different
 * random key, and the backend's UNIQUE(key) constraint has no way to know
 * those three requests represent the same logical action, since keys (by
 * design, per Stripe's own model) aren't derived from request content.
 *
 * Instead, the key is stored in `localStorage` (shared across all tabs of
 * the same origin, unlike sessionStorage) under a name derived from the
 * ACTION being performed (e.g. `idempotency:publish:<pageId>`). Any tab
 * attempting the same action within the staleness window reads and reuses
 * the same stored key, so it sends the same `Idempotency-Key` header the
 * backend already knows how to dedupe. The key is cleared once the action
 * resolves (success or failure) so the next genuinely new action gets a
 * fresh key rather than being stuck replaying a stale result forever.
 */

const STORAGE_PREFIX = 'idempotency:'
// If a stored key is older than this, treat it as abandoned (e.g. the tab
// that created it crashed before clearing it) rather than reusing it
// forever. Generous relative to the backend's own 15-minute TTL, but still
// bounded — these are button clicks, not long-running async workflows.
const STALE_AFTER_MS = 2 * 60 * 1000 // 2 minutes

interface StoredKey {
  key: string
  createdAt: number
}

function storageKey(actionId: string): string {
  return `${STORAGE_PREFIX}${actionId}`
}

function readStored(actionId: string): StoredKey | null {
  try {
    const raw = localStorage.getItem(storageKey(actionId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredKey
    if (typeof parsed.key !== 'string' || typeof parsed.createdAt !== 'number') return null
    return parsed
  } catch {
    return null // corrupted entry, private-browsing storage exception, etc.
  }
}

function writeStored(actionId: string, value: StoredKey): void {
  try {
    localStorage.setItem(storageKey(actionId), JSON.stringify(value))
  } catch {
    // Storage full / disabled — the key still works for this call, it just
    // won't be shareable with other tabs or survive a refresh. Not fatal.
  }
}

/**
 * Get the Idempotency-Key for a given logical action, generating a fresh
 * one only if none exists yet (or the existing one is stale).
 *
 * `actionId` should uniquely identify the action being deduplicated, e.g.
 * `publish:${pageId}`, `create-organization`, `invite-member:${orgId}`,
 * `upload:${filename}:${size}`. Distinct actions must use distinct
 * actionIds — reusing the same actionId across genuinely different actions
 * would make the backend treat them as retries of each other (and reject
 * with 409 once it notices the request body differs).
 */
export function getOrCreateIdempotencyKey(actionId: string): string {
  const existing = readStored(actionId)
  if (existing && Date.now() - existing.createdAt < STALE_AFTER_MS) {
    return existing.key
  }

  const key = crypto.randomUUID()
  writeStored(actionId, { key, createdAt: Date.now() })
  return key
}

/**
 * Clear the stored key for an action once it has resolved (success or
 * failure that the user has been shown). Call this in a `finally` block
 * around the request — see useIdempotentAction below for the wrapped form.
 * The NEXT call to getOrCreateIdempotencyKey for the same actionId will
 * then generate a fresh key, appropriate for a genuinely new attempt
 * (e.g. the user fixed a validation error and is publishing again).
 */
export function clearIdempotencyKey(actionId: string): void {
  try {
    localStorage.removeItem(storageKey(actionId))
  } catch {
    // ignore
  }
}

/**
 * Convenience wrapper: runs `fn` with the Idempotency-Key header attached,
 * and clears the stored key afterwards regardless of outcome so the next
 * distinct attempt gets a fresh one.
 *
 * Usage:
 *   await withIdempotencyKey(`publish:${pageId}`, (headers) =>
 *     http.post(url, body, { headers })
 *   )
 */
export async function withIdempotencyKey<T>(
  actionId: string,
  fn: (headers: { 'Idempotency-Key': string }) => Promise<T>,
): Promise<T> {
  const key = getOrCreateIdempotencyKey(actionId)
  try {
    return await fn({ 'Idempotency-Key': key })
  } finally {
    clearIdempotencyKey(actionId)
  }
}
