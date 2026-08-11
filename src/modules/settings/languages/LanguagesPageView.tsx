// modules/settings/languages/LanguagesPageView.tsx
import { useState } from 'react'
import { Globe, Lock, Star, AlertCircle, Check, Plus } from 'lucide-react'
import type { OrgLanguage, PlatformLocale } from '@/services/languages.service'

interface Props {
  languages:                OrgLanguage[]
  multiLanguageAddonActive: boolean
  catalog:                  PlatformLocale[]
  isLoading:                boolean
  actionError:              string | null
  onDismissError:           () => void
  onEnable:                 (locale: string) => void
  onSetActive:              (locale: string, isActive: boolean) => void
  onSetPrimary:             (locale: string) => void
  onSaveCurrency:           (locale: string, currencyCode: string, currencySymbol: string) => void
  saving:                   boolean
  onGoToAddons:             () => void
}

function SectionCard({ icon: Icon, title, description, children }: {
  icon: React.ElementType; title: string; description: string; children: React.ReactNode
}) {
  return (
    <div className="cms-card mb-5 overflow-hidden">
      <div className="px-6 pt-[18px] pb-3.5 border-b border-[var(--lito-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(17,17,17,0.06)] flex items-center justify-center shrink-0">
            <Icon size={15} className="text-[var(--text-muted)]" />
          </div>
          <div>
            <h2 className="font-body text-sm font-medium text-[var(--text-muted)]">{title}</h2>
            <p className="font-body text-[11px] text-[var(--text-muted)] mt-px">{description}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function CurrencyEditor({ language, onSave, disabled }: {
  language: OrgLanguage
  onSave: (code: string, symbol: string) => void
  disabled: boolean
}) {
  const [code, setCode]     = useState(language.currency_code)
  const [symbol, setSymbol] = useState(language.currency_symbol)
  const dirty = code !== language.currency_code || symbol !== language.currency_symbol

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
        disabled={disabled}
        className="cms-input h-[28px] w-[64px] text-[11px] font-mono uppercase"
        aria-label={`Currency code for ${language.name}`}
      />
      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.slice(0, 4))}
        disabled={disabled}
        className="cms-input h-[28px] w-[44px] text-[11px] text-center"
        aria-label={`Currency symbol for ${language.name}`}
      />
      {dirty && (
        <button
          type="button"
          onClick={() => onSave(code, symbol)}
          disabled={disabled}
          className="cms-btn cms-btn-primary cms-btn-sm h-[28px] px-2.5 text-[11px]"
        >
          Save
        </button>
      )}
    </div>
  )
}

export function LanguagesPageView({
  languages, multiLanguageAddonActive, catalog, isLoading,
  actionError, onDismissError,
  onEnable, onSetActive, onSetPrimary, onSaveCurrency, saving, onGoToAddons,
}: Props) {
  const [pickerLocale, setPickerLocale] = useState('')

  const activeCount = languages.filter((l) => l.is_active).length
  const wouldNeedAddon = !multiLanguageAddonActive && activeCount >= 1

  const addedCodes = new Set(languages.map((l) => l.locale))
  const addableLocales = catalog.filter((c) => !addedCodes.has(c.code))

  return (
    <div className="cms-page p-8 overflow-y-auto h-full max-w-[760px]">
      <div className="mb-7">
        <h1 className="font-display text-[28px] font-normal text-[var(--text-muted)]">Languages</h1>
        <p className="font-body text-xs text-[var(--text-muted)] mt-[3px]">
          Manage the languages your website is available in, the primary language, and per-language currency.
        </p>
      </div>

      {actionError && (
        <div className="flex items-start gap-2 mb-4 px-3.5 py-2.5 rounded-md bg-[var(--cms-danger-bg)] border border-[rgba(163,48,40,0.2)] text-xs font-body text-[var(--cms-danger)]">
          <AlertCircle size={14} className="shrink-0 mt-px" aria-hidden="true" />
          <span className="flex-1">{actionError}</span>
          <button type="button" onClick={onDismissError} className="bg-transparent border-none cursor-pointer text-[var(--cms-danger)] font-body text-xs underline shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* ── Upsell banner — matches MULTIPLE-LANGUAGE-PLAN.md's exact copy ── */}
      {!multiLanguageAddonActive && (
        <div className="flex items-center justify-between gap-4 mb-5 px-5 py-4 rounded-lg border border-dashed border-[var(--lito-border)] bg-[var(--cms-surface-3)]">
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-[var(--text-muted)] shrink-0" aria-hidden="true" />
            <div>
              <div className="font-body text-[13px] font-medium text-[var(--text-primary)]">
                Multiple Languages 🔒
              </div>
              <div className="font-body text-[11px] text-[var(--text-muted)] mt-0.5">
                Requires Multi Language Add-on — $10/month. Unlocks unlimited languages, translation management, language routing, SEO hreflang, and multi-currency support.
              </div>
            </div>
          </div>
          <button type="button" onClick={onGoToAddons} className="cms-btn cms-btn-primary cms-btn-sm shrink-0">
            Activate
          </button>
        </div>
      )}

      <SectionCard icon={Globe} title="Your languages" description="Enable, disable, and set the primary language for your website">
        {isLoading ? (
          <p className="font-body text-xs text-[var(--text-muted)]">Loading…</p>
        ) : languages.length === 0 ? (
          <p className="font-body text-xs text-[var(--text-muted)]">No languages configured yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {languages.map((lang) => (
              <div
                key={lang.locale}
                className={`flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-[var(--lito-border)] ${lang.is_active ? 'bg-[var(--cms-card-bg)]' : 'bg-[var(--cms-surface-3)] opacity-70'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-[10px] font-semibold uppercase text-[var(--text-muted)] bg-[var(--cms-surface-3)] rounded px-1.5 py-0.5 shrink-0">
                    {lang.locale}
                  </span>
                  <div className="min-w-0">
                    <div className="font-body text-[13px] font-medium text-[var(--text-primary)] truncate flex items-center gap-1.5">
                      {lang.name}
                      {lang.is_default && (
                        <span className="inline-flex items-center gap-1 font-body text-[10px] font-medium text-[var(--lito-gold-deep)]">
                          <Star size={10} fill="currentColor" aria-hidden="true" /> Primary
                        </span>
                      )}
                    </div>
                    <div className="font-body text-[11px] text-[var(--text-muted)] truncate">{lang.native_name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <CurrencyEditor language={lang} onSave={(code, symbol) => onSaveCurrency(lang.locale, code, symbol)} disabled={saving} />

                  {!lang.is_default && (
                    <button
                      type="button"
                      onClick={() => onSetPrimary(lang.locale)}
                      disabled={saving || !lang.is_active}
                      title={!lang.is_active ? 'Enable this language first' : 'Set as primary language'}
                      className="cms-btn cms-btn-sm h-[28px] px-2.5 text-[11px]"
                    >
                      Set primary
                    </button>
                  )}

                  <label className="flex items-center gap-1.5 font-body text-[11px] text-[var(--text-muted)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={lang.is_active}
                      disabled={saving || lang.is_default}
                      title={lang.is_default ? 'Cannot disable the primary language' : undefined}
                      onChange={(e) => onSetActive(lang.locale, e.target.checked)}
                    />
                    Active
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard icon={Plus} title="Add a language" description="Add another language from the platform catalog">
        {addableLocales.length === 0 ? (
          <p className="font-body text-xs text-[var(--text-muted)]">Every available language has already been added.</p>
        ) : (
          <div className="flex items-center gap-2.5">
            <select
              value={pickerLocale}
              onChange={(e) => setPickerLocale(e.target.value)}
              className="cms-input h-[34px] flex-1"
            >
              <option value="">Select a language…</option>
              {addableLocales.map((c) => (
                <option key={c.code} value={c.code}>{c.name} ({c.native_name}) — {c.code}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={!pickerLocale || saving}
              onClick={() => { if (pickerLocale) { onEnable(pickerLocale); setPickerLocale('') } }}
              className="cms-btn cms-btn-primary cms-btn-sm"
            >
              {wouldNeedAddon ? (
                <span className="flex items-center gap-1.5"><Lock size={11} aria-hidden="true" /> Add (requires add-on)</span>
              ) : (
                <span className="flex items-center gap-1.5"><Check size={11} aria-hidden="true" /> Add language</span>
              )}
            </button>
          </div>
        )}
        {wouldNeedAddon && (
          <p className="font-body text-[11px] text-[var(--text-muted)] mt-2.5">
            Your organization currently has one free language. Adding another requires the Multi Language add-on ($10/month) — you'll see the option to activate it if you try.
          </p>
        )}
      </SectionCard>
    </div>
  )
}
