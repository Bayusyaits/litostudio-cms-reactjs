'use client'
// apps/cms/src/app/(auth)/auth/error/page.tsx
// Shown when OAuth callback fails. Provides a clear message and a retry link.
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const ERROR_MESSAGES: Record<string, string> = {
  missing_code:     'The authorization code was missing from the callback.',
  missing_verifier: 'The PKCE verifier cookie was lost. Please try again.',
  exchange_failed:  'The login session could not be established. Please try again.',
  access_denied:    'Access was denied by the identity provider.',
}

function ErrorContent() {
  const params  = useSearchParams()
  const code    = params.get('error') ?? 'unknown'
  const message = ERROR_MESSAGES[code] ?? 'An unexpected error occurred during sign-in.'

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-200 p-8 space-y-6 text-center">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-stone-900">Sign-in failed</h1>
          <p className="text-sm text-stone-500">{message}</p>
        </div>
        <a
          href="/login"
          className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 transition-colors"
        >
          Try again
        </a>
      </div>
    </main>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  )
}
