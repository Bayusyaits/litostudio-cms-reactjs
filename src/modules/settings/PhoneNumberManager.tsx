// apps/cms/src/modules/settings/PhoneNumberManager.tsx
// Phone number management with WhatsApp OTP verification.
// Supports: Indonesia (+62), Singapore (+65), Netherlands (+31),
//           UAE/Dubai (+971), Australia (+61), Saudi Arabia (+966)

import { useState, useEffect } from 'react'
import { CheckCircle2, Send, ShieldCheck, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

// ── Country definitions ───────────────────────────────────────────────────────

interface Country {
  code:  string   // E.164 prefix
  flag:  string   // Unicode flag emoji
  name:  string
  hint:  string   // Example local format
  maxDigits: number
}

const COUNTRIES: Country[] = [
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia',    hint: '81234567890',  maxDigits: 12 },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore',    hint: '81234567',     maxDigits: 8  },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands',  hint: '612345678',    maxDigits: 9  },
  { code: '+971', flag: '🇦🇪', name: 'UAE (Dubai)',   hint: '501234567',    maxDigits: 9  },
  { code: '+61',  flag: '🇦🇺', name: 'Australia',    hint: '412345678',    maxDigits: 9  },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia', hint: '501234567',    maxDigits: 9  },
]

// ── API helpers ───────────────────────────────────────────────────────────────

const BASE = '/api/v1/auth/phone'

async function apiFetch(path: string, method: string, token: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message ?? `Request failed (${res.status})`)
  return json
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface PhoneRecord {
  country_code: string
  local_number: string
  full_number:  string
  verified:     boolean
  verified_at:  string | null
  created_at:   string
}

type Step = 'idle' | 'input' | 'otp' | 'verified'

// ── Style class constants ─────────────────────────────────────────────────────

const inputCls = 'h-9 px-3 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-3)] font-body text-[13px] text-[var(--text-primary)] outline-none'

const btnBase = 'inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg font-body text-xs font-medium transition-[background] duration-150'
const btnPrimary   = `${btnBase} border-none bg-[var(--lito-teal)] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`
const btnSecondary = `${btnBase} border border-[var(--lito-border)] bg-[var(--cms-surface-2)] text-[var(--text-secondary)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`
const btnDanger    = `${btnBase} border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)] text-[#ef4444] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`

// ── Component ─────────────────────────────────────────────────────────────────

export function PhoneNumberManager() {
  const { token: accessToken } = useAuthStore()

  const [record,   setRecord]   = useState<PhoneRecord | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [step,     setStep]     = useState<Step>('idle')
  const [country,  setCountry]  = useState<Country>(COUNTRIES[0])
  const [localNum, setLocalNum] = useState('')
  const [otp,      setOtp]      = useState('')
  const [busy,     setBusy]     = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [devOtp,   setDevOtp]   = useState<string | null>(null)

  // ── Load existing phone record ─────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return
    apiFetch('', 'GET', accessToken)
      .then(({ data }) => {
        setRecord(data)
        setStep(data?.verified ? 'verified' : data ? 'otp' : 'idle')
        if (data && !data.verified) {
          const found = COUNTRIES.find(c => c.code === data.country_code)
          if (found) setCountry(found)
          setLocalNum(data.local_number)
        }
      })
      .catch(() => setRecord(null))
      .finally(() => setLoading(false))
  }, [accessToken])

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleSendOtp() {
    if (!accessToken) return
    setError(null); setBusy(true); setDevOtp(null)
    try {
      const res = await apiFetch('/send-otp', 'POST', accessToken, {
        country_code: country.code,
        local_number: localNum.replace(/\D/g, ''),
      })
      setDevOtp(res.dev_otp ?? null)
      setStep('otp')
      setOtp('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP')
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyOtp() {
    if (!accessToken) return
    setError(null); setBusy(true)
    try {
      await apiFetch('/verify-otp', 'POST', accessToken, { otp })
      const { data } = await apiFetch('', 'GET', accessToken)
      setRecord(data)
      setStep('verified')
      setDevOtp(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!accessToken || !window.confirm('Remove your phone number?')) return
    setBusy(true); setError(null)
    try {
      await apiFetch('', 'DELETE', accessToken)
      setRecord(null); setStep('idle'); setLocalNum(''); setOtp(''); setDevOtp(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove phone')
    } finally {
      setBusy(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-[var(--text-muted)] font-body text-[13px]">
        <Loader2 size={14} className="animate-spin" />
        Loading…
      </div>
    )
  }

  return (
    <div className="font-body">

      {/* ── Verified banner ─────────────────────────────────────────────── */}
      {step === 'verified' && record && (
        <div className="flex items-center justify-between px-4 py-3 rounded-[10px] bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)] mb-3.5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-[#10b981] shrink-0" />
            <div>
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                {record.country_code} {record.local_number}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-px">
                Verified via WhatsApp
                {record.verified_at && ` · ${new Date(record.verified_at).toLocaleDateString()}`}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setStep('input'); setLocalNum(record.local_number) }}
              className={btnSecondary}
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className={btnDanger}
            >
              <Trash2 size={12} />
              Remove
            </button>
          </div>
        </div>
      )}

      {/* ── Input step ──────────────────────────────────────────────────── */}
      {(step === 'idle' || step === 'input') && (
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            Add a phone number to receive booking inquiries and enable WhatsApp notifications.
          </p>

          <div className="flex gap-2.5 mb-2.5">
            <select
              value={country.code}
              onChange={e => setCountry(COUNTRIES.find(c => c.code === e.target.value) ?? COUNTRIES[0])}
              className={`${inputCls} w-[180px]`}
              aria-label="Country code"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.code})
                </option>
              ))}
            </select>

            <input
              type="tel"
              inputMode="numeric"
              placeholder={`e.g. ${country.hint}`}
              value={localNum}
              maxLength={country.maxDigits + 2}
              onChange={e => setLocalNum(e.target.value.replace(/[^\d]/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter') handleSendOtp() }}
              className={`${inputCls} flex-1`}
              aria-label="Local phone number"
            />
          </div>

          <div className="text-[11px] text-[var(--text-muted)] mb-3.5">
            Enter without leading zero or country code. E.g. for +62 Indonesia: <strong>81234567890</strong>
          </div>

          {error && <ErrorBox message={error} />}

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={busy || localNum.length < 6}
            className={btnPrimary}
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Send WhatsApp OTP
          </button>
        </div>
      )}

      {/* ── OTP step ────────────────────────────────────────────────────── */}
      {step === 'otp' && (
        <div>
          <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-[rgba(59,130,246,0.07)] border border-[rgba(59,130,246,0.2)] mb-3.5">
            <ShieldCheck size={16} className="text-[#3b82f6] shrink-0" />
            <div className="text-xs text-[var(--text-primary)]">
              OTP sent via WhatsApp to <strong>{country.code} {localNum}</strong>. Expires in 10 minutes.
            </div>
          </div>

          {devOtp && (
            <div className="px-3.5 py-2.5 rounded-lg mb-3 bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.3)] text-xs text-[var(--text-primary)]">
              <strong>Dev mode:</strong> Twilio not configured. OTP = <code className="font-bold tracking-[3px]">{devOtp}</code>
            </div>
          )}

          <div className="flex gap-2.5 mb-2.5">
            <input
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              value={otp}
              maxLength={6}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter' && otp.length === 6) handleVerifyOtp() }}
              className={`${inputCls} flex-1 tracking-[8px] text-lg text-center`}
              aria-label="One-time password"
              autoComplete="one-time-code"
            />
          </div>

          {error && <ErrorBox message={error} />}

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={busy || otp.length !== 6}
              className={btnPrimary}
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Verify OTP
            </button>
            <button
              type="button"
              onClick={() => { setStep('input'); setError(null) }}
              className={btnSecondary}
            >
              Change Number
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={busy}
              className={btnSecondary}
            >
              Resend OTP
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Error box ─────────────────────────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg mb-3 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-xs text-[#ef4444]">
      <AlertCircle size={13} className="shrink-0" />
      {message}
    </div>
  )
}
