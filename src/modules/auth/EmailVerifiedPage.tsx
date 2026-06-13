// Landing page for Supabase email-confirmation redirects.
// Backend sets emailRedirectTo = CMS_ORIGIN + /auth/verify.
// Supabase verifies the email server-side before redirecting here,
// so this page only needs to confirm success and point to login.
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

export default function EmailVerifiedPage() {
  return (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <CheckCircle className="w-12 h-12 text-[var(--lito-teal)]" />
      </div>
      <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
        Email verified!
      </h2>
      <p className="font-body text-sm text-[var(--text-muted)]">
        Your account is now active. You can sign in with your email and password.
      </p>
      <Link
        to="/login"
        className="inline-block font-body text-sm text-[var(--lito-teal)] hover:underline"
      >
        Sign in now →
      </Link>
    </div>
  )
}
