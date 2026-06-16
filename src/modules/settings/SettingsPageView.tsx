import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2, Globe, Moon, Sun, Monitor, Check, AlertCircle, Layout, Palette,
} from 'lucide-react'
import type { Organization, Site } from '@/types/auth.types'
import type { Theme } from '@/services/theme.service'

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
    <div className="cms-card" style={{ marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--lito-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(17,17,17,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={15} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
              {title}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              {description}
            </p>
          </div>
        </div>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  )
}

function FormRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24,
      alignItems: 'flex-start', marginBottom: 18,
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
          {label}
        </div>
        {hint && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {hint}
          </div>
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
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 14px', borderRadius: 8,
        border: '1px dashed var(--lito-border)',
        background: 'var(--cms-surface-3)',
        fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)',
      }}>
        <Palette size={14} aria-hidden="true" />
        No themes available — add themes in the Themes module.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
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
            style={{
              display: 'flex', flexDirection: 'column', gap: 0,
              borderRadius: 8, overflow: 'hidden', textAlign: 'left',
              border: `2px solid ${isActive ? 'var(--lito-gold)' : 'var(--lito-border)'}`,
              background: 'var(--cms-surface-2)',
              cursor: isActive ? 'default' : applying ? 'wait' : 'pointer',
              transition: 'border-color 150ms',
              opacity: applying && !isActive ? 0.5 : 1,
              padding: 0,
            }}
          >
            {/* Preview image */}
            <div style={{
              height: 80, background: 'var(--cms-surface-3)',
              position: 'relative', overflow: 'hidden', flexShrink: 0,
            }}>
              {theme.preview_image ? (
                <img
                  src={theme.preview_image}
                  alt={theme.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
                }}>
                  <Palette size={20} style={{ color: 'var(--text-muted)', opacity: 0.3 }} aria-hidden="true" />
                </div>
              )}
              {isActive && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--lito-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={11} color="#fff" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: '8px 10px', flex: 1 }}>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                color: isActive ? 'var(--lito-gold-deep)' : 'var(--text-primary)',
                marginBottom: 2,
              }}>
                {theme.name}
              </div>
              {theme.description && (
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)',
                  lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {theme.description}
                </div>
              )}
              <div style={{ marginTop: 6 }}>
                {isActive ? (
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 500,
                    color: 'var(--lito-gold-deep)',
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <Check size={10} aria-hidden="true" /> Active
                  </span>
                ) : (
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 10,
                    color: 'var(--lito-teal)',
                  }}>
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
    // Preserve all existing site settings — only patch name/domain
    const existing = (activeSite?.settings ?? {}) as Record<string, unknown>
    onSaveSite({ name: v.name, domain: v.domain || undefined, settings: existing })
  }

  return (
    <div className="cms-page" style={{ padding: 32, overflowY: 'auto', height: '100%', maxWidth: 760 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text-primary)',
        }}>
          Settings
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
          Manage your workspace, website, and appearance preferences
        </p>
      </div>

      {/* Feedback banners */}
      {saveSuccess && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
          padding: '10px 14px', borderRadius: 6,
          background: 'var(--s-pub-bg)', border: '1px solid rgba(26,74,90,0.2)',
          fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--s-pub-fg)',
        }}>
          <Check size={14} aria-hidden="true" /> Changes saved successfully
        </div>
      )}
      {saveError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
          padding: '10px 14px', borderRadius: 6,
          background: 'var(--cms-danger-bg)', border: '1px solid rgba(163,48,40,0.2)',
          fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--cms-danger)',
        }}>
          <AlertCircle size={14} aria-hidden="true" /> {saveError}
        </div>
      )}

      {/* ── Organization ── */}
      <SectionCard
        icon={Building2}
        title="Organization"
        description="General information about your organization"
      >
        <form onSubmit={orgForm.handleSubmit(v => onSaveOrg({ name: v.name }))} noValidate>
          <FormRow label="Organization name" hint="The display name for your workspace">
            <div>
              <input
                {...orgForm.register('name')}
                type="text"
                className="cms-input"
                placeholder="e.g. Lito Studio"
                aria-invalid={!!orgForm.formState.errors.name}
                style={{ height: 34 }}
              />
              {orgForm.formState.errors.name && (
                <p role="alert" style={{ marginTop: 4, fontSize: 11, color: 'var(--s-danger)', fontFamily: 'var(--font-body)' }}>
                  {orgForm.formState.errors.name.message}
                </p>
              )}
            </div>
          </FormRow>
          <FormRow label="Plan" hint="Your current subscription tier">
            <span className="status-badge" style={{
              color: 'var(--lito-teal)', background: 'rgba(26,74,90,0.10)', textTransform: 'capitalize',
            }}>
              {org?.plan ?? 'Free'}
            </span>
          </FormRow>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
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
        <SectionCard
          icon={Globe}
          title="Website"
          description="Settings for the currently active website"
        >
          <form onSubmit={siteForm.handleSubmit(handleSaveSite)} noValidate>
            <FormRow label="Site name" hint="Internal display name for this website">
              <div>
                <input
                  {...siteForm.register('name')}
                  type="text"
                  className="cms-input"
                  placeholder="e.g. Lito Studio Photography"
                  aria-invalid={!!siteForm.formState.errors.name}
                  style={{ height: 34 }}
                />
                {siteForm.formState.errors.name && (
                  <p role="alert" style={{ marginTop: 4, fontSize: 11, color: 'var(--s-danger)', fontFamily: 'var(--font-body)' }}>
                    {siteForm.formState.errors.name.message}
                  </p>
                )}
              </div>
            </FormRow>

            <FormRow label="Domain" hint="The primary domain for this website">
              <input
                {...siteForm.register('domain')}
                type="text"
                className="cms-input"
                placeholder="e.g. litostudio.id"
                style={{ height: 34 }}
              />
            </FormRow>

            <FormRow label="Site ID" hint="Read-only unique identifier">
              <input
                type="text"
                className="cms-input"
                value={activeSite.id}
                readOnly
                style={{ height: 34, opacity: 0.6, cursor: 'default', fontFamily: 'monospace', fontSize: 11 }}
              />
            </FormRow>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
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
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Clicking a theme below activates it instantly — no save button needed.
              The block editor will use this template's defaults when opening empty pages.
              Manage full theme settings (colours, fonts, logo) in the{' '}
              <a href="/themes" style={{ color: 'var(--lito-teal)', textDecoration: 'underline' }}>
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
            <div style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 6,
              border: '1px solid rgba(26,74,90,0.2)',
              background: 'rgba(26,74,90,0.06)',
              fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Check size={11} style={{ color: 'var(--lito-teal)', flexShrink: 0 }} aria-hidden="true" />
              Active theme slug is used as the editor template for page defaults.
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Appearance ── */}
      <SectionCard
        icon={Moon}
        title="Appearance"
        description="Choose your preferred colour mode for the CMS"
      >
        <div style={{ display: 'flex', gap: 10 }}>
          {COLOR_MODE_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = colorMode === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onSetColorMode(value)}
                aria-pressed={active}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '14px 20px', borderRadius: 8,
                  border: `1.5px solid ${active ? 'var(--lito-ink)' : 'var(--lito-border)'}`,
                  background: active ? 'var(--lito-ink)' : 'transparent',
                  cursor: 'pointer', flex: 1, transition: 'all 180ms',
                }}
              >
                <Icon size={20} style={{ color: active ? 'var(--lito-cream)' : 'var(--text-muted)' }} aria-hidden="true" />
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
                  color: active ? 'var(--lito-cream)' : 'var(--text-muted)',
                }}>
                  {label}
                </span>
                {active && (
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'var(--lito-gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={9} color="#111" strokeWidth={3} aria-hidden="true" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </SectionCard>

      {/* ── Danger zone ── */}
      <div className="cms-card" style={{ border: '1px solid rgba(163,48,40,0.25)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(163,48,40,0.15)' }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--cms-danger)' }}>
            Danger zone
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            Irreversible actions — proceed with caution
          </p>
        </div>
        <div style={{
          padding: '16px 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              Delete this website
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
              Permanently removes the website and all its content
            </div>
          </div>
          <button
            type="button"
            disabled={!activeSite}
            style={{
              padding: '7px 16px', borderRadius: 999,
              background: 'var(--cms-danger-bg)', color: 'var(--cms-danger)',
              border: '1px solid rgba(163,48,40,0.25)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap', opacity: !activeSite ? 0.4 : 1,
            }}
          >
            Delete website
          </button>
        </div>
      </div>
    </div>
  )
}
