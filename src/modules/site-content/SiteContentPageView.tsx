// modules/site-content/SiteContentPageView.tsx
// Form UI for managing extra_settings JSONB that useSiteSettings() reads.
// Tabs: About | Pricing | Footer | Theme Colors

import { useState, useEffect } from 'react'
import type { SiteExtraSettings } from './SiteContentPageContainer'

type Tab = 'about' | 'pricing' | 'footer' | 'colors'

interface Props {
  extra: SiteExtraSettings
  isLoading: boolean
  saving: boolean
  saveError: string | null
  saveSuccess: boolean
  onSave: (extra: SiteExtraSettings) => void
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '0.02em' }}>
        {label}
      </label>
      {hint && <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{hint}</p>}
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', height: 36, padding: '0 10px', borderRadius: 6, boxSizing: 'border-box',
        border: '1px solid var(--color-border)', background: 'var(--cms-input-bg)',
        fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)',
        outline: 'none',
      }}
    />
  )
}

function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="color"
        value={value || '#000000'}
        onChange={e => onChange(e.target.value)}
        style={{ width: 36, height: 36, padding: 2, border: '1px solid var(--color-border)', borderRadius: 6, cursor: 'pointer', background: 'none' }}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="#000000"
        style={{
          flex: 1, height: 36, padding: '0 10px', borderRadius: 6, boxSizing: 'border-box',
          border: '1px solid var(--color-border)', background: 'var(--cms-input-bg)',
          fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', outline: 'none',
        }}
      />
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', minWidth: 90 }}>{label}</span>
    </div>
  )
}

function ArrayTextarea({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const text = value.join('\n')
  return (
    <textarea
      value={text}
      onChange={e => onChange(e.target.value.split('\n'))}
      placeholder={placeholder ?? 'One item per line'}
      rows={4}
      style={{
        width: '100%', padding: '8px 10px', borderRadius: 6, boxSizing: 'border-box',
        border: '1px solid var(--color-border)', background: 'var(--cms-input-bg)',
        fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)',
        resize: 'vertical', outline: 'none', lineHeight: 1.6,
      }}
    />
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 400, color: 'var(--text-primary)', margin: '0 0 16px', paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
      {children}
    </h3>
  )
}

// ── Tab panels ─────────────────────────────────────────────────────────────────

function AboutTab({ draft, set }: { draft: SiteExtraSettings; set: (k: keyof SiteExtraSettings, v: unknown) => void }) {
  const stats = draft.stats ?? {}
  const setStats = (k: string, v: string) => set('stats', { ...stats, [k]: v })

  return (
    <div>
      <SectionTitle>About Section Content</SectionTitle>

      <Field label="About body paragraphs" hint="Each line becomes a separate paragraph displayed on the About page.">
        <ArrayTextarea value={draft.about_body ?? []} onChange={v => set('about_body', v)} placeholder="We started in 2015 with a simple idea..." />
      </Field>

      <Field label="Manifesto / values" hint="Short values or mission statements. One per line.">
        <ArrayTextarea value={draft.about_manifesto ?? []} onChange={v => set('about_manifesto', v)} placeholder="Authenticity over perfection." />
      </Field>

      <SectionTitle>Statistics</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {([
          ['sessions',    'Sessions / Projects'],
          ['destinations','Destinations'],
          ['stories',     'Stories published'],
          ['founded',     'Year founded'],
          ['cities',      'Cities covered'],
        ] as [string, string][]).map(([key, label]) => (
          <Field key={key} label={label}>
            <TextInput value={stats[key] ?? ''} onChange={v => setStats(key, v)} placeholder={key === 'founded' ? '2015' : '250+'} />
          </Field>
        ))}
      </div>
    </div>
  )
}

function PricingTab({ draft, set }: { draft: SiteExtraSettings; set: (k: keyof SiteExtraSettings, v: unknown) => void }) {
  return (
    <div>
      <SectionTitle>Pricing Page Content</SectionTitle>

      <Field label="Pricing subtitle" hint="Shown below the pricing section headline.">
        <TextInput value={draft.pricing_subtitle ?? ''} onChange={v => set('pricing_subtitle', v)} placeholder="Simple, transparent pricing for every journey." />
      </Field>

      <Field label="Pricing footer note" hint="Small disclaimer text shown at the bottom of the pricing section.">
        <TextInput value={draft.pricing_footer_note ?? ''} onChange={v => set('pricing_footer_note', v)} placeholder="All prices include tax. Packages are per trip." />
      </Field>
    </div>
  )
}

function FooterTab({ draft, set }: { draft: SiteExtraSettings; set: (k: keyof SiteExtraSettings, v: unknown) => void }) {
  const contact = draft.footer_contact ?? {}
  const social  = draft.social_links ?? {}
  const setContact = (k: string, v: string) => set('footer_contact', { ...contact, [k]: v })
  const setSocial  = (k: string, v: string) => set('social_links',   { ...social, [k]: v })

  return (
    <div>
      <SectionTitle>Footer Branding</SectionTitle>

      <Field label="Tagline" hint="Short tagline shown below the logo in the footer.">
        <TextInput value={draft.footer_tagline ?? ''} onChange={v => set('footer_tagline', v)} placeholder="Capturing life's most meaningful moments." />
      </Field>

      <Field label="Copyright line" hint="E.g. © 2025 Lito Studio. All rights reserved.">
        <TextInput value={draft.footer_copyright ?? ''} onChange={v => set('footer_copyright', v)} placeholder={`© ${new Date().getFullYear()} Your Brand. All rights reserved.`} />
      </Field>

      <SectionTitle>Contact Details</SectionTitle>

      {([
        ['email',   'Email',   'hello@yourbrand.com'],
        ['phone',   'Phone',   '+62 812 3456 7890'],
        ['address', 'Address', 'Jakarta, Indonesia'],
      ] as [string, string, string][]).map(([k, lbl, ph]) => (
        <Field key={k} label={lbl}>
          <TextInput value={contact[k] ?? ''} onChange={v => setContact(k, v)} placeholder={ph} />
        </Field>
      ))}

      <SectionTitle>Social Links</SectionTitle>

      {([
        ['instagram', 'Instagram', 'https://instagram.com/yourbrand'],
        ['facebook',  'Facebook',  'https://facebook.com/yourbrand'],
        ['twitter',   'X / Twitter','https://x.com/yourbrand'],
        ['tiktok',    'TikTok',    'https://tiktok.com/@yourbrand'],
        ['youtube',   'YouTube',   'https://youtube.com/@yourbrand'],
        ['linkedin',  'LinkedIn',  'https://linkedin.com/company/yourbrand'],
      ] as [string, string, string][]).map(([k, lbl, ph]) => (
        <Field key={k} label={lbl}>
          <TextInput value={social[k] ?? ''} onChange={v => setSocial(k, v)} placeholder={ph} />
        </Field>
      ))}
    </div>
  )
}

function ColorsTab({ draft, set }: { draft: SiteExtraSettings; set: (k: keyof SiteExtraSettings, v: unknown) => void }) {
  const colors = draft.theme_colors ?? {}
  const setColor = (k: string, v: string) => set('theme_colors', { ...colors, [k]: v })

  return (
    <div>
      <SectionTitle>CMS Color Overrides</SectionTitle>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
        Leave blank to use template defaults. Hex values only (e.g. #C4956A). These override the CSS tokens at runtime via <code style={{ fontFamily: 'monospace', fontSize: 11 }}>useThemeColors()</code>.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {([
          ['accent',       'Accent (primary CTA, links, highlights)'],
          ['accent_hover', 'Accent hover state'],
          ['accent_text',  'Accent text on light backgrounds'],
          ['bg',           'Page background'],
          ['text',         'Primary text color'],
        ] as [string, string][]).map(([k, lbl]) => (
          <ColorInput key={k} value={colors[k as keyof typeof colors] ?? ''} onChange={v => setColor(k, v)} label={lbl} />
        ))}
      </div>
    </div>
  )
}

// ── Main view ──────────────────────────────────────────────────────────────────

export function SiteContentPageView({ extra, isLoading, saving, saveError, saveSuccess, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('about')
  const [draft, setDraft] = useState<SiteExtraSettings>(extra)

  // Sync when remote data loads
  useEffect(() => { setDraft(extra) }, [extra])

  function set(k: keyof SiteExtraSettings, v: unknown) {
    setDraft(prev => ({ ...prev, [k]: v }))
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'about',   label: 'About & Stats' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'footer',  label: 'Footer' },
    { id: 'colors',  label: 'Theme Colors' },
  ]

  if (isLoading) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
        Loading site content settings…
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 760, fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text-primary)', margin: 0 }}>
          Site Content
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          Edit CMS-driven content for About, Pricing, Footer, and color overrides. Changes are reflected on the public website immediately after save.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)', marginBottom: 28 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--lito-gold, #D4A853)' : '2px solid transparent',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: activeTab === t.id ? 600 : 400,
              color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'color 150ms',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active tab */}
      {activeTab === 'about'   && <AboutTab   draft={draft} set={set} />}
      {activeTab === 'pricing' && <PricingTab  draft={draft} set={set} />}
      {activeTab === 'footer'  && <FooterTab   draft={draft} set={set} />}
      {activeTab === 'colors'  && <ColorsTab   draft={draft} set={set} />}

      {/* Feedback */}
      {saveError && (
        <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 6, background: 'var(--cms-danger-bg)', border: '1px solid var(--cms-danger)', fontSize: 13, color: 'var(--cms-danger)' }}>
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 6, background: 'rgba(26,74,90,0.08)', border: '1px solid rgba(26,74,90,0.15)', fontSize: 13, color: 'var(--text-primary)' }}>
          ✓ Site content saved successfully.
        </div>
      )}

      {/* Save button */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => onSave(draft)}
          disabled={saving}
          style={{
            padding: '9px 24px',
            borderRadius: 6,
            border: 'none',
            background: 'var(--lito-gold, #D4A853)',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'opacity 150ms',
          }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
