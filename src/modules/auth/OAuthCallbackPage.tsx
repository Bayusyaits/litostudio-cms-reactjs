// OAuth callback — handles the redirect from Google after user grants permission.
// Flow: Google → /auth/callback?code=... → exchange code → set auth → /dashboard
import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'

export default function OAuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const didRun = useRef(false)

  useEffect(() => {
    // Strict Mode fires effects twice in dev — guard with a ref
    if (didRun.current) return
    didRun.current = true

    async function handleCallback() {
      const code = params.get('code')
      const error = params.get('error')
      const errorDescription = params.get('error_description')

      if (error) {
        console.error('OAuth error:', error, errorDescription)
        navigate(`/login?error=${encodeURIComponent(errorDescription ?? error)}`, { replace: true })
        return
      }

      if (!code) {
        navigate('/login?error=missing_code', { replace: true })
        return
      }

      const codeVerifier = sessionStorage.getItem('oauth_code_verifier')
      if (!codeVerifier) {
        navigate('/login?error=missing_verifier', { replace: true })
        return
      }

      sessionStorage.removeItem('oauth_code_verifier')

      try {
        const result = await authService.exchangeOAuthCode(code, codeVerifier)
        setAuth(
          {
            id:         result.user.id,
            email:      result.user.email,
            full_name:  result.user.full_name,
            avatar_url: result.user.avatar_url,
            // OAuth exchange doesn't resolve org membership — will be populated
            // on first dashboard load via GET /api/v1/auth/session
            org_id:   null,
            org_role: null,
          },
          result.access_token,
          result.expires_at,
        )
        navigate('/dashboard', { replace: true })
      } catch (err) {
        console.error('OAuth exchange failed:', err)
        navigate('/login?error=exchange_failed', { replace: true })
      }
    }

    void handleCallback()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <Loader className="w-8 h-8 animate-spin text-[var(--lito-teal)]" />
      <p className="font-body text-sm text-[var(--text-muted)]">
        Completing sign-in…
      </p>
    </div>
  )
}
