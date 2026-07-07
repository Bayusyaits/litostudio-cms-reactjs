import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, Chrome, CheckCircle } from 'lucide-react'
import { Button } from '@litostudio/ui-cms'
import { FormField } from '@/components/molecules/FormField'
import { authService } from '@/services/auth.service'
import { getErrorMessage } from '@litostudio/ui-cms'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email:     z.string().email('Enter a valid email'),
  password:  z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})
type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (values: RegisterForm) => {
    setError(null)
    try {
      await authService.register({
        email:     values.email,
        password:  values.password,
        full_name: values.full_name,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login?registered=true', { replace: true }), 2500)
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

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <CheckCircle className="w-12 h-12 text-[var(--lito-teal)]" />
        </div>
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Check your email
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)]">
          We sent a verification link to your email address. Click the link to activate your account.
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
          Create your account
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)] mt-1">
          Join Lito Studio to manage your visual stories
        </p>
      </div>

      <Button skin="cms"
        variant="secondary"
        className="w-full"
        leftIcon={<Chrome className="w-4 h-4" />}
        loading={googleLoading}
        onClick={handleGoogleLogin}
      >
        Sign up with Google
      </Button>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--lito-border)]" />
        <span className="font-body text-xs text-[var(--text-muted)]">or</span>
        <div className="flex-1 h-px bg-[var(--lito-border)]" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField
          label="Full Name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          required
          error={errors.full_name?.message}
          {...register('full_name')}
        />
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
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          required
          hint="At least 8 characters, one uppercase letter and one number"
          error={errors.password?.message}
          {...register('password')}
        />
        <FormField
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          required
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200" role="alert">
            <p className="font-body text-xs text-red-600">{error}</p>
          </div>
        )}

        <Button skin="cms"
          type="submit"
          className="w-full"
          leftIcon={<UserPlus className="w-4 h-4" />}
          loading={isSubmitting}
        >
          Create account
        </Button>
      </form>

      <p className="font-body text-center text-xs text-[var(--text-muted)]">
        Already have an account?{' '}
        <Link to="/login" className="text-[var(--lito-teal)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
