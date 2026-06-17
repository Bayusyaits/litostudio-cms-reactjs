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

// ── Component ─────────────────────────────────────────────────────────────────

export function PhoneNumberManager() {
  const { token: accessToken } = useAuthStore()

  const [record,      setRecord]      = useState<PhoneRecord | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [step,        setStep]        = useState<Step>('idle')
  const [country,     setCountry]     = useState<Country>(COUNTRIES[0])
  const [localNum,    setLocalNum]    = useState('')
  const [otp,         setOtp]         = useState('')
  const [busy,        setBusy]        = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [devOtp,      setDevOtp]      = useState<string | null>(null)

  // ── Load existing phone record ─────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return
    apiFetch('', 'GET', accessToken)
      .then(({ data }) => {
        setRecord(data)
        setStep(data?.verified ? 'verified' : data ? 'otp' : 'idle')
        if (data && !data.verified) {
          // Pre-fill country + number so user can resend
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
    setError(null)
    setBusy(true)
    setDevOtp(null)
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
    setError(null)
    setBusy(true)
    try {
      await apiFetch('/verify-otp', 'POST', accessToken, { otp })
      // Refresh record
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
    setBusy(true)
    setError(null)
    try {
      await apiFetch('', 'DELETE', accessToken)
      setRecord(null)
      setStep('idle')
      setLocalNum('')
      setOtp('')
      setDevOtp(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove phone')
    } finally {
      setBusy(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        Loading…
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>

      {/* ── Verified banner ─────────────────────────────────────────────── */}
      {step === 'verified' && record && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {record.country_code} {record.local_number}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                Verified via WhatsApp
                {record.verified_at && ` · ${new Date(record.verified_at).toLocaleDateString()}`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setStep('input'); setLocalNum(record.local_number) }}
              style={btnStyle('secondary')}
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              style={btnStyle('danger')}
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
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            Add a phone number to receive booking inquiries and enable WhatsApp notifications.
          </p>

          {/* Country selector */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <select
              value={country.code}
              onChange={e => setCountry(COUNTRIES.find(c => c.code === e.target.value) ?? COUNTRIES[0])}
              style={inputStyle({ width: 180 })}
              aria-label="Country code"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.code})
                </option>
              ))}
            </select>

            {/* Local number input */}
            <input
              type="tel"
              inputMode="numeric"
              placeholder={`e.g. ${country.hint}`}
              value={localNum}
              maxLength={country.maxDigits + 2}
              onChange={e => setLocalNum(e.target.value.replace(/[^\d]/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter') handleSendOtp() }}
              style={inputStyle({ flex: 1 })}
              aria-label="Local phone number"
            />
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
            Enter without leading zero or country code. E.g. for +62 Indonesia: <strong>81234567890</strong>
          </div>

          {error && <ErrorBox message={error} />}

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={busy || localNum.length < 6}
            style={btnStyle('primary', busy || localNum.length < 6)}
          >
            {busy ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
            Send WhatsApp OTP
          </button>
        </div>
      )}

      {/* ── OTP step ────────────────────────────────────────────────────── */}
      {step === 'otp' && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px', borderRadius: 10,
            background: 'rgba(59,130,246,0.07)',
            border: '1px solid rgba(59,130,246,0.2)',
            marginBottom: 14,
          }}>
            <ShieldCheck size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
              OTP sent via WhatsApp to <strong>{country.code} {localNum}</strong>. Expires in 10 minutes.
            </div>
          </div>

          {/* Dev OTP hint */}
          {devOtp && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 12,
              background: 'rgba(234,179,8,0.1)',
              border: '1px solid rgba(234,179,8,0.3)',
              fontSize: 12, color: 'var(--text-primary)',
            }}>
              <strong>Dev mode:</strong> Twilio not configured. OTP = <code style={{ fontWeight: 700, letterSpacing: 3 }}>{devOtp}</code>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              value={otp}
              maxLength={6}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter' && otp.length === 6) handleVerifyOtp() }}
              style={{ ...inputStyle({ flex: 1 }), letterSpacing: 8, fontSize: 18, textAlign: 'center' }}
              aria-label="One-time password"
              autoComplete="one-time-code"
            />
          </div>

          {error && <ErrorBox message={error} />}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={busy || otp.length !== 6}
              style={btnStyle('primary', busy || otp.length !== 6)}
            >
              {busy ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={13} />}
              Verify OTP
            </button>
            <button
              type="button"
              onClick={() => { setStep('input'); setError(null) }}
              style={btnStyle('secondary')}
            >
              Change Number
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={busy}
              style={btnStyle('secondary', busy)}
            >
              Resend OTP
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Style helpers ─────────────────────────────────────────────────────────────

function inputStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    height: 36, padding: '0 12px', borderRadius: 8,
    border: '1px solid var(--lito-border)',
    background: 'var(--cms-surface-3)',
    fontFamily: 'var(--font-body)', fontSize: 13,
    color: 'var(--text-primary)',
    outline: 'none',
    ...extra,
  }
}

function btnStyle(variant: 'primary' | 'secondary' | 'danger', disabled = false): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
    opacity: disabled ? 0.5 : 1,
    transition: 'background 150ms',
  }
  if (variant === 'primary')   return { ...base, background: 'var(--lito-teal)', color: '#fff' }
  if (variant === 'danger')    return { ...base, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }
  return { ...base, background: 'var(--cms-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--lito-border)' }
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 8, marginBottom: 12,
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.2)',
      fontSize: 12, color: '#ef4444',
    }}>
      <AlertCircle size={13} style={{ flexShrink: 0 }} />
      {message}
    </div>
  )
}
