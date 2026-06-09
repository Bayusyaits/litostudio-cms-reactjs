import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogIn, Chrome } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { FormField } from '@/components/molecules/FormField'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { getErrorMessage } from '@/lib/axios'

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { setAuth } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginForm) => {
    setError(null)
    try {
      const result = await authService.login(values.email, values.password)
      setAuth(result.user, result.access_token, result.expires_at)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      await authService.loginWithGoogle()
    } catch (err) {
      setError(getErrorMessage(err))
      setGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Sign in to your workspace
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)] mt-1">
          Manage your visual stories and content
        </p>
      </div>

      {/* Google OAuth — primary */}
      <Button
        variant="secondary"
        className="w-full"
        leftIcon={<Chrome className="w-4 h-4" />}
        loading={googleLoading}
        onClick={handleGoogleLogin}
      >
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--lito-border)]" />
        <span className="font-body text-xs text-[var(--text-muted)]">or</span>
        <div className="flex-1 h-px bg-[var(--lito-border)]" />
      </div>

      {/* Email/password form */}
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
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="text-right">
          <Link
            to="/forgot-password"
            className="font-body text-xs text-[var(--lito-teal)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200" role="alert">
            <p className="font-body text-xs text-red-600">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          leftIcon={<LogIn className="w-4 h-4" />}
          loading={isSubmitting}
        >
          Sign in
        </Button>
      </form>

      <p className="font-body text-center text-xs text-[var(--text-muted)]">
        Don't have an account?{' '}
        <Link to="/register" className="text-[var(--lito-teal)] hover:underline">
          Create account
        </Link>
      </p>
    </div>
  )
}
