import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { FormField } from '@/components/molecules/FormField'
import { authService } from '@/services/auth.service'
import { getErrorMessage } from '@/lib/axios'

const schema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})
type ResetForm = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: ResetForm) => {
    setError(null)
    try {
      await authService.resetPassword(token, values.password)
      setSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Invalid link
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)]">
          This reset link is missing or invalid. Request a new one.
        </p>
        <Link to="/forgot-password" className="font-body text-sm text-[var(--lito-teal)] hover:underline block">
          Request new link
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <CheckCircle className="w-12 h-12 text-[var(--lito-teal)]" />
        </div>
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Password updated
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)]">
          Your password has been reset successfully. You can now sign in.
        </p>
        <Link to="/login" className="font-body text-sm text-[var(--lito-teal)] hover:underline block">
          Sign in now
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Set new password
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)] mt-1">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField
          label="New Password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          required
          hint="At least 8 characters, one uppercase letter and one number"
          error={errors.password?.message}
          {...register('password')}
        />
        <FormField
          label="Confirm New Password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your new password"
          required
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200" role="alert">
            <p className="font-body text-xs text-red-600">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          leftIcon={<KeyRound className="w-4 h-4" />}
          loading={isSubmitting}
        >
          Reset password
        </Button>
      </form>
    </div>
  )
}
