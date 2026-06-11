import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { FormField } from '@/components/molecules/FormField'
import { authService } from '@/services/auth.service'
import { getErrorMessage } from '@/lib/axios'

const resendSchema = z.object({
  email: z.string().email('Enter a valid email'),
})
type ResendForm = z.infer<typeof resendSchema>

export default function EmailVerificationPage() {
  const [params] = useSearchParams()
  const token = params.get('token')

  const [status, setStatus]   = useState<'idle' | 'verifying' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [resent, setResent]   = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendForm>({ resolver: zodResolver(resendSchema) })

  // When a ?token= param is present the user has been redirected here from a
  // Supabase-sent link (e.g. "resend verification" deep-link).  The token is a
  // hash, NOT an email address — passing it to verifyEmail() would fail with a
  // validation error because the endpoint expects an email.
  // Supabase itself already confirmed the email before redirecting here; we
  // just need to show a success state.
  useEffect(() => {
    if (!token) return
    setStatus('success')
  }, [token])

  const onResend = async (values: ResendForm) => {
    try {
      await authService.resendVerification(values.email)
      setResent(true)
    } catch (err) {
      setMessage(getErrorMessage(err))
    }
  }

  // Auto-verifying
  if (token && status === 'verifying') {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <Loader className="w-12 h-12 text-[var(--lito-teal)] animate-spin" />
        </div>
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Verifying your email…
        </h2>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <CheckCircle className="w-12 h-12 text-[var(--lito-teal)]" />
        </div>
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Email verified!
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)]">
          Your account is now active. You can sign in.
        </p>
        <Link to="/login" className="font-body text-sm text-[var(--lito-teal)] hover:underline block">
          Sign in now
        </Link>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Verification failed
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)]">
          {message ?? 'This link may have expired.'}
        </p>
        <Link to="/email-verification" className="font-body text-sm text-[var(--lito-teal)] hover:underline block">
          Request a new link
        </Link>
      </div>
    )
  }

  // No token — show resend form
  if (resent) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <CheckCircle className="w-12 h-12 text-[var(--lito-teal)]" />
        </div>
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Verification email sent
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)]">
          Check your inbox for the verification link.
        </p>
        <Link to="/login" className="font-body text-sm text-[var(--lito-teal)] hover:underline block">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Verify your email
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)] mt-1">
          Didn't receive the email? Enter your address below to resend.
        </p>
      </div>

      <form onSubmit={handleSubmit(onResend)} noValidate className="space-y-4">
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@litostudio.id"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        {message && (
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200" role="alert">
            <p className="font-body text-xs text-red-600">{message}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          loading={isSubmitting}
        >
          Resend verification email
        </Button>
      </form>

      <p className="font-body text-center text-xs text-[var(--text-muted)]">
        <Link to="/login" className="text-[var(--lito-teal)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
