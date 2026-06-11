/**
 * axios.ts — compatibility shim (axios fully removed).
 *
 * Non-service files (queryClient.ts, auth pages) still import
 * `getErrorMessage` and `SESSION_COOKIE` from '@/lib/axios'.
 * This shim forwards those exports from the canonical `@/lib/http` module.
 *
 * New code should import directly from '@/lib/http'.
 *
 * @deprecated Use `@/lib/http` directly for new code.
 */
export {
  SESSION_COOKIE,
  getErrorMessage,
  HttpError as RequestError,
  HttpError,
} from '@/lib/http'
