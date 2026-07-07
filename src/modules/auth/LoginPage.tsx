import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogIn, Chrome } from 'lucide-react'
import { Button } from '@litostudio/ui-cms'
import { FormField } from '@/components/molecules/FormField'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { getErrorMessage } from '@litostudio/ui-cms'

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const justRegistered = searchParams.get('registered') === 'true'
  const oauthError = searchParams.get('error')
  // Preserve the page the user was trying to reach before session expired
  const returnToParam = searchParams.get('returnTo')

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginForm) => {
    setError(null)
    try {
      const result = await authService.login(values.email, values.password)
      setAuth(result.user, result.access_token, result.expires_at, result.refresh_token)
      // Navigate back to the page the user was on before session expired.
      // Validate the returnTo is a local path to prevent open-redirect attacks.
      const dest = returnToParam?.startsWith('/')
        ? decodeURIComponent(returnToParam)
        : '/dashboard'
      navigate(dest, { replace: true })
    } catch (err) {
      // Keep email populated, clear only the password field, then refocus it
      setValue('password', '')
      setFocus('password')
      setError(getErrorMessage(err))
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      // Persist returnTo across the OAuth redirect (external round-trip to Google)
      // OAuthCallbackPage reads this key and navigates there after exchange.
      if (returnToParam?.startsWith('/')) {
        sessionStorage.setItem('oauth_return_to', returnToParam)
      } else {
        sessionStorage.removeItem('oauth_return_to')
      }
      await authService.loginWithGoogle()
    } catch (err) {
      setError(getErrorMessage(err))
      setGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Sign in to your workspace
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)] mt-1">
          Manage your visual stories and content
        </p>
      </div>

      {oauthError && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200" role="alert">
          <p className="font-body text-xs text-red-600">
            Google sign-in failed: {oauthError.replace(/_/g, ' ')}. Please try again.
          </p>
        </div>
      )}

      {justRegistered && (
        <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-200" role="status">
          <p className="font-body text-xs text-green-700">
            Account created — check your email to verify, then sign in below.
          </p>
        </div>
      )}

      {/* Google OAuth — primary */}
      <Button skin="cms"
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

        <Button skin="cms"
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
