// apps/cms/src/components/StepUpConfirmDialog.tsx
//
// Live TOTP confirmation gate for high-impact promotion actions — activating
// a promotion, setting it org-wide, or deleting one.
// dev-spec-promo-tier1-display-multisite-mfa-2026-07-15.md, Workstream H,
// Requirement #11.
//
// UI/flow modeled directly on cms-superadmin's LoginPage.tsx enroll → QR →
// verify pattern (including the same svgToDataUri base64 approach — see
// that file's comment for why base64, not percent-encoding, is used for the
// SVG data URI). This is NOT the login-time MFA gate — tenant CMS doesn't
// require MFA to sign in at all; this is a step-up confirmation invoked
// right before a specific mutating action, reusing the same backend
// /api/v1/auth/mfa/* routes (confirmed "not SA-specific by construction" in
// that route file's own header comment).
//
// If the user has zero verified factors yet, this walks them through
// enrollment inline before requesting the confirming code — per spec: "the
// gate walks them through enrollment inline before requesting the
// confirming code."
import { useEffect, useRef, useState } from 'react'
import { X, ShieldCheck } from 'lucide-react'
import { useFocusTrap } from '@litostudio/ui-cms'
import { mfaService } from '@/services/mfa.service'
import { useAuthStore } from '@/stores/auth.store'

/** Base64 (not percent-encoded) data URI — see cms-superadmin's LoginPage.tsx
 * for why this is more reliably rendered by <img> across browsers than
 * `data:image/svg+xml;utf-8,${encodeURIComponent(...)}`. */
function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}

interface Props {
  open: boolean
  onClose: () => void
  /** Called once the code is verified — the caller performs the actual
   * gated mutation (activate/org-wide save/delete) from here. */
  onConfirmed: () => void
  /** e.g. "Activate this promotion?" */
  title: string
  /** e.g. "This will make the promotion live immediately." */
  description: string
}

export function StepUpConfirmDialog({ open, onClose, onConfirmed, title, description }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, open, onClose)

  const token = useAuthStore((s) => s.token)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const updateTokens = useAuthStore((s) => s.updateTokens)

  const [loading, setLoading] = useState(true)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [enrollment, setEnrollment] = useState<{ qrCodeSvg: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Kick off factor lookup (+ enroll-and-challenge, or challenge-only) fresh
  // every time the dialog opens — never reuse a stale challenge_id across
  // opens, TOTP challenges expire quickly.
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    setCode('')
    setEnrollment(null)
    setFactorId(null)
    setChallengeId(null)

    async function init() {
      if (!token || !refreshToken) {
        setError('Your session is missing required tokens. Please sign in again.')
        setLoading(false)
        return
      }
      try {
        const factors = await mfaService.factors(token, refreshToken)
        if (factors.length === 0) {
          const enrolled = await mfaService.enroll(token, refreshToken)
          const ch = await mfaService.challenge(token, refreshToken, enrolled.factor_id)
          setFactorId(enrolled.factor_id)
          setChallengeId(ch.challenge_id)
          setEnrollment({ qrCodeSvg: enrolled.qr_code_svg, secret: enrolled.secret })
        } else {
          const factor = factors[0]!
          const ch = await mfaService.challenge(token, refreshToken, factor.id)
          setFactorId(factor.id)
          setChallengeId(ch.challenge_id)
        }
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    void init()
  }, [open, token, refreshToken])

  if (!open) return null

  async function onVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !refreshToken || !factorId || !challengeId) return
    setBusy(true)
    setError(null)
    try {
      const elevated = await mfaService.verify(token, refreshToken, factorId, challengeId, code)
      // Keep the store's session in sync with the aal2-elevated tokens —
      // same reasoning as cms-superadmin's completeLogin(): the backend now
      // considers this session elevated, the frontend's stored token must
      // match or the very next authenticated request would carry a stale
      // (pre-elevation) token.
      updateTokens(elevated.access_token, elevated.refresh_token, elevated.expires_at)
      onConfirmed()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  async function onGetNewCode() {
    if (!token || !refreshToken || !factorId) return
    setBusy(true)
    setError(null)
    try {
      const ch = await mfaService.challenge(token, refreshToken, factorId)
      setChallengeId(ch.challenge_id)
      setCode('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="stepup-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 z-[1000] bg-[rgba(0,0,0,0.55)] flex items-center justify-center p-5 [animation:cmsPageIn_160ms_ease-out_both]"
    >
      <div className="w-full max-w-[440px] bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-[18px] border-b border-[var(--lito-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[rgba(212,168,83,0.12)] flex items-center justify-center">
              <ShieldCheck size={16} className="text-[var(--lito-gold-deep)]" />
            </div>
            <h2 id="stepup-modal-title" className="font-display text-[18px] font-normal text-[var(--text-muted)]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="bg-transparent border-none cursor-pointer text-[var(--text-muted)] p-1 rounded flex"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onVerify} className="px-5 pt-4 pb-5">
          <p className="font-body text-[13px] text-[var(--text-muted)] mb-4">{description}</p>

          {loading ? (
            <p className="font-body text-sm text-[var(--text-muted)] py-6 text-center">Preparing verification…</p>
          ) : (
            <>
              {enrollment && (
                <div className="mb-4 p-4 rounded-md bg-[var(--cms-surface-2,#fff)] border border-[var(--lito-border)] text-center">
                  <p className="font-body text-[12.5px] text-[var(--text-muted)] mb-3">
                    This action requires an authenticator app. Scan the QR code below, or enter the key manually, then enter the 6-digit code it generates.
                  </p>
                  <img
                    src={svgToDataUri(enrollment.qrCodeSvg)}
                    alt="Scan with your authenticator app"
                    width={150}
                    height={150}
                    className="mx-auto mb-3 block"
                  />
                  <div className="text-xs text-[var(--text-muted)] mb-1">Can&apos;t scan? Enter this key manually:</div>
                  <code className="text-sm font-mono break-all text-[var(--text-primary,#111)]">
                    {enrollment.secret}
                  </code>
                </div>
              )}

              {factorId && challengeId && (
                <>
                  <label className="cms-label" htmlFor="stepup-code">Verification code</label>
                  <input
                    id="stepup-code"
                    className="cms-input h-11 tracking-[0.3em] text-center text-lg"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    autoFocus
                    required
                  />
                </>
              )}

              {error && (
                <div role="alert" className="mt-3 py-2 px-3 rounded-sm text-[12.5px] text-[var(--cms-danger)] bg-[var(--cms-danger-bg)]">
                  {error}
                </div>
              )}

              {factorId && challengeId && (
                <>
                  <button
                    type="submit"
                    className="cms-btn cms-btn-primary w-full justify-center mt-4"
                    disabled={busy || code.length !== 6}
                  >
                    {busy ? 'Verifying…' : enrollment ? 'Confirm and enable' : 'Confirm'}
                  </button>
                  <div className="flex justify-between mt-3">
                    <button
                      type="button"
                      onClick={onGetNewCode}
                      disabled={busy}
                      className="bg-transparent border-none cursor-pointer text-[var(--lito-teal)] text-xs font-medium p-0"
                    >
                      Code expired? Get a new one
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={busy}
                      className="bg-transparent border-none cursor-pointer text-[var(--text-muted)] text-xs p-0"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  )
}
