import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2, Globe, Moon, Sun, Monitor, Check, AlertCircle, Layout, Palette, Phone,
} from 'lucide-react'
import type { Organization, Site } from '@/types/auth.types'
import type { Theme } from '@/services/theme.service'
import { PhoneNumberManager } from './PhoneNumberManager'

type ColorMode = 'light' | 'dark' | 'system'

// ── Schemas ───────────────────────────────────────────────────────────────────

const orgSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
})

const siteSchema = z.object({
  name:   z.string().min(1, 'Site name is required').max(200),
  domain: z.string().max(253).optional(),
})

type OrgValues  = z.infer<typeof orgSchema>
type SiteValues = z.infer<typeof siteSchema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  org:             Organization | null
  activeSite:      Site | null
  colorMode:       ColorMode
  onSetColorMode:  (mode: ColorMode) => void
  onSaveOrg:       (payload: { name?: string; settings?: Record<string, unknown> }) => void
  onSaveSite:      (payload: { name?: string; domain?: string; settings?: Record<string, unknown> }) => void
  saving:          boolean
  saveError:       string | null
  saveSuccess:     boolean
  // Theme
  themes:          Theme[]
  activeThemeId:   string | null
  onApplyTheme:    (id: string) => void
  applyingTheme:   boolean
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function FormRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-6 items-start mb-[18px]" style={{ gridTemplateColumns: '200px 1fr' }}>
      <div>
        <div className="font-body text-[13px] font-medium text-[var(--text-primary)]">{label}</div>
        {hint && (
          <div className="font-body text-[11px] text-[var(--text-muted)] mt-0.5">{hint}</div>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}

// ── Theme picker ──────────────────────────────────────────────────────────────

function ThemePicker({ themes, activeThemeId, onApply, applying }: {
  themes:        Theme[]
  activeThemeId: string | null
  onApply:       (id: string) => void
  applying:      boolean
}) {
  if (themes.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-3 rounded-lg border border-dashed border-[var(--lito-border)] bg-[var(--cms-surface-3)] font-body text-xs text-[var(--text-muted)]">
        <Palette size={14} aria-hidden="true" />
        No themes available — add themes in the Themes module.
      </div>
    )
  }

  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
      {themes.map((theme) => {
        const isActive = theme.id === activeThemeId
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => !isActive && !applying && onApply(theme.id)}
            aria-pressed={isActive}
            disabled={applying && !isActive}
            title={theme.description ?? theme.name}
            className={`flex flex-col gap-0 rounded-lg overflow-hidden text-left border-2 border-solid bg-[var(--cms-surface-2)] transition-[border-color] duration-150 p-0 ${
              isActive
                ? 'border-[var(--lito-gold)] cursor-default'
                : applying
                ? 'border-[var(--lito-border)] cursor-wait opacity-50'
                : 'border-[var(--lito-border)] cursor-pointer'
            }`}
          >
            {/* Preview image */}
            <div className="h-20 bg-[var(--cms-surface-3)] relative overflow-hidden shrink-0">
              {theme.preview_image ? (
                <img
                  src={theme.preview_image}
                  alt={theme.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Palette size={20} className="text-[var(--text-muted)] opacity-30" aria-hidden="true" />
                </div>
              )}
              {isActive && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[var(--lito-gold)] flex items-center justify-center">
                  <Check size={11} color="#fff" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="px-2.5 py-2 flex-1">
              <div className={`font-body text-xs font-semibold mb-0.5 ${isActive ? 'text-[var(--lito-gold-deep)]' : 'text-[var(--text-primary)]'}`}>
                {theme.name}
              </div>
              {theme.description && (
                <div className="font-body text-[10px] text-[var(--text-muted)] leading-[1.4] line-clamp-2">
                  {theme.description}
                </div>
              )}
              <div className="mt-1.5">
                {isActive ? (
                  <span className="font-body text-[10px] font-medium text-[var(--lito-gold-deep)] flex items-center gap-[3px]">
                    <Check size={10} aria-hidden="true" /> Active
                  </span>
                ) : (
                  <span className="font-body text-[10px] text-[var(--lito-teal)]">
                    Click to apply
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Color mode constants ──────────────────────────────────────────────────────

const COLOR_MODE_OPTIONS: { value: ColorMode; label: string; icon: React.ElementType }[] = [
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'dark',   label: 'Dark',   icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

// ── Main view ─────────────────────────────────────────────────────────────────

export function SettingsPageView({
  org, activeSite, colorMode, onSetColorMode,
  onSaveOrg, onSaveSite, saving, saveError, saveSuccess,
  themes, activeThemeId, onApplyTheme, applyingTheme,
}: Props) {
  const orgForm = useForm<OrgValues>({
    resolver: zodResolver(orgSchema),
    mode: 'onChange',
    defaultValues: { name: org?.name ?? '' },
  })

  const siteForm = useForm<SiteValues>({
    resolver: zodResolver(siteSchema),
    mode: 'onChange',
    defaultValues: { name: activeSite?.name ?? '', domain: activeSite?.domain ?? '' },
  })

  // Sync forms when props change (e.g. after save or site switch)
  useEffect(() => {
    orgForm.reset({ name: org?.name ?? '' })
  }, [org?.name])   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    siteForm.reset({ name: activeSite?.name ?? '', domain: activeSite?.domain ?? '' })
  }, [activeSite?.id, activeSite?.name, activeSite?.domain])   // eslint-disable-line react-hooks/exhaustive-deps

  function handleSaveSite(v: SiteValues) {
    const existing = (activeSite?.settings ?? {}) as Record<string, unknown>
    onSaveSite({ name: v.name, domain: v.domain || undefined, settings: existing })
  }

  return (
    <div className="cms-page p-8 overflow-y-auto h-full max-w-[760px]">

      {/* Header */}
      <div className="mb-7">
        <h1 className="font-display text-[28px] font-normal text-[var(--text-primary)]">Settings</h1>
        <p className="font-body text-xs text-[var(--text-muted)] mt-[3px]">
          Manage your workspace, website, and appearance preferences
        </p>
      </div>

      {/* Feedback banners */}
      {saveSuccess && (
        <div className="flex items-center gap-2 mb-4 px-3.5 py-2.5 rounded-md bg-[var(--s-pub-bg)] border border-[rgba(26,74,90,0.2)] text-xs font-body text-[var(--s-pub-fg)]">
          <Check size={14} aria-hidden="true" /> Changes saved successfully
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-2 mb-4 px-3.5 py-2.5 rounded-md bg-[var(--cms-danger-bg)] border border-[rgba(163,48,40,0.2)] text-xs font-body text-[var(--cms-danger)]">
          <AlertCircle size={14} aria-hidden="true" /> {saveError}
        </div>
      )}

      {/* ── Organization ── */}
      <SectionCard icon={Building2} title="Organization" description="General information about your organization">
        <form onSubmit={orgForm.handleSubmit(v => onSaveOrg({ name: v.name }))} noValidate>
          <FormRow label="Organization name" hint="The display name for your workspace">
            <div>
              <input
                {...orgForm.register('name')}
                type="text"
                className="cms-input h-[34px]"
                placeholder="e.g. Lito Studio"
                aria-invalid={!!orgForm.formState.errors.name}
              />
              {orgForm.formState.errors.name && (
                <p role="alert" className="mt-1 text-[11px] text-[var(--s-danger)] font-body">
                  {orgForm.formState.errors.name.message}
                </p>
              )}
            </div>
          </FormRow>
          <FormRow label="Plan" hint="Your current subscription tier">
            <span
              className="status-badge capitalize"
              style={{ color: 'var(--lito-teal)', background: 'rgba(26,74,90,0.10)' }}
            >
              {org?.plan ?? 'Free'}
            </span>
          </FormRow>
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={saving || !orgForm.formState.isDirty || !orgForm.formState.isValid}
              className="cms-btn cms-btn-primary cms-btn-sm"
            >
              {saving ? 'Saving…' : 'Save organization'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Website ── */}
      {activeSite && (
        <SectionCard icon={Globe} title="Website" description="Settings for the currently active website">
          <form onSubmit={siteForm.handleSubmit(handleSaveSite)} noValidate>
            <FormRow label="Site name" hint="Internal display name for this website">
              <div>
                <input
                  {...siteForm.register('name')}
                  type="text"
                  className="cms-input h-[34px]"
                  placeholder="e.g. Lito Studio Photography"
                  aria-invalid={!!siteForm.formState.errors.name}
                />
                {siteForm.formState.errors.name && (
                  <p role="alert" className="mt-1 text-[11px] text-[var(--s-danger)] font-body">
                    {siteForm.formState.errors.name.message}
                  </p>
                )}
              </div>
            </FormRow>

            <FormRow label="Domain" hint="The primary domain for this website">
              <input
                {...siteForm.register('domain')}
                type="text"
                className="cms-input h-[34px]"
                placeholder="e.g. litostudio.id"
              />
            </FormRow>

            <FormRow label="Site ID" hint="Read-only unique identifier">
              <input
                type="text"
                className="cms-input h-[34px] opacity-60 cursor-default font-mono text-[11px]"
                value={activeSite.id}
                readOnly
              />
            </FormRow>

            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={saving || !siteForm.formState.isDirty || !siteForm.formState.isValid}
                className="cms-btn cms-btn-primary cms-btn-sm"
              >
                {saving ? 'Saving…' : 'Save website'}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* ── Template / Theme ── */}
      {activeSite && (
        <SectionCard
          icon={Layout}
          title="Template & Theme"
          description="Select the active template. Controls the block editor's default page structure and the website's visual design."
        >
          <div className="mb-2.5">
            <p className="font-body text-xs text-[var(--text-muted)] mb-3">
              Clicking a theme below activates it instantly — no save button needed.
              The block editor will use this template's defaults when opening empty pages.
              Manage full theme settings (colours, fonts, logo) in the{' '}
              <a href="/themes" className="text-[var(--lito-teal)] underline">
                Themes module
              </a>.
            </p>
            <ThemePicker
              themes={themes}
              activeThemeId={activeThemeId}
              onApply={onApplyTheme}
              applying={applyingTheme}
            />
          </div>

          {activeThemeId && (
            <div className="mt-2.5 px-3 py-2 rounded-md border border-[rgba(26,74,90,0.2)] bg-[rgba(26,74,90,0.06)] font-body text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
              <Check size={11} className="text-[var(--lito-teal)] shrink-0" aria-hidden="true" />
              Active theme slug is used as the editor template for page defaults.
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Appearance ── */}
      <SectionCard icon={Moon} title="Appearance" description="Choose your preferred colour mode for the CMS">
        <div className="flex gap-2.5">
          {COLOR_MODE_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = colorMode === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onSetColorMode(value)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-2 px-5 py-3.5 rounded-lg border-[1.5px] border-solid cursor-pointer flex-1 transition-all duration-[180ms] ${
                  active
                    ? 'border-[var(--lito-ink)] bg-[var(--lito-ink)]'
                    : 'border-[var(--lito-border)] bg-transparent'
                }`}
              >
                <Icon size={20} style={{ color: active ? 'var(--lito-cream)' : 'var(--text-muted)' }} aria-hidden="true" />
                <span
                  className="font-body text-xs font-medium"
                  style={{ color: active ? 'var(--lito-cream)' : 'var(--text-muted)' }}
                >
                  {label}
                </span>
                {active && (
                  <div className="w-4 h-4 rounded-full bg-[var(--lito-gold)] flex items-center justify-center">
                    <Check size={9} color="#111" strokeWidth={3} aria-hidden="true" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </SectionCard>

      {/* ── Phone number + WhatsApp verification ── */}
      <SectionCard
        icon={Phone}
        title="Phone Number"
        description="Add and verify a phone number for WhatsApp notifications and bookings"
      >
        <PhoneNumberManager />
      </SectionCard>

      {/* ── Danger zone ── */}
      <div className="cms-card border border-[rgba(163,48,40,0.25)] overflow-hidden">
        <div className="px-6 pt-[18px] pb-3.5 border-b border-[rgba(163,48,40,0.15)]">
          <h2 className="font-body text-sm font-medium text-[var(--cms-danger)]">Danger zone</h2>
          <p className="font-body text-[11px] text-[var(--text-muted)] mt-px">
            Irreversible actions — proceed with caution
          </p>
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-body text-[13px] font-medium text-[var(--text-primary)]">
              Delete this website
            </div>
            <div className="font-body text-[11px] text-[var(--text-muted)]">
              Permanently removes the website and all its content
            </div>
          </div>
          <button
            type="button"
            disabled={!activeSite}
            className={`px-4 py-[7px] rounded-full bg-[var(--cms-danger-bg)] text-[var(--cms-danger)] border border-[rgba(163,48,40,0.25)] text-xs font-medium cursor-pointer font-body whitespace-nowrap ${!activeSite ? 'opacity-40' : ''}`}
          >
            Delete website
          </button>
        </div>
      </div>
    </div>
  )
}
