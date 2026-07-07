import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, CheckCircle } from 'lucide-react'
import { Button } from '@litostudio/ui-cms'
import { FormField } from '@/components/molecules/FormField'
import { authService } from '@/services/auth.service'
import { getErrorMessage } from '@/lib/axios'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})
type ForgotForm = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: ForgotForm) => {
    setError(null)
    try {
      await authService.forgotPassword(values.email)
      setSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <CheckCircle className="w-12 h-12 text-[var(--lito-teal)]" />
        </div>
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Reset link sent
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)]">
          If that email is registered, you'll receive a password reset link shortly. Check your inbox.
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
          Forgot your password?
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)] mt-1">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@litostudio.id"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200" role="alert">
            <p className="font-body text-xs text-red-600">{error}</p>
          </div>
        )}

        <Button skin="cms"
          type="submit"
          className="w-full"
          leftIcon={<Mail className="w-4 h-4" />}
          loading={isSubmitting}
        >
          Send reset link
        </Button>
      </form>

      <p className="font-body text-center text-xs text-[var(--text-muted)]">
        Remember your password?{' '}
        <Link to="/login" className="text-[var(--lito-teal)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
