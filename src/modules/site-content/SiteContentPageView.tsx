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
    <div className="mb-5">
      <label className="block font-body text-xs font-semibold text-[var(--text-primary)] mb-1 tracking-[0.02em]">
        {label}
      </label>
      {hint && <p className="font-body text-[11px] text-[var(--text-muted)] mb-[6px]">{hint}</p>}
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
      className="w-full h-9 px-[10px] rounded-md box-border border border-[var(--color-border)] bg-[var(--cms-input-bg)] font-body text-[13px] text-[var(--text-primary)] outline-none"
    />
  )
}

function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || '#000000'}
        onChange={e => onChange(e.target.value)}
        className="w-9 h-9 p-0.5 border border-[var(--color-border)] rounded-md cursor-pointer bg-transparent"
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1 h-9 px-[10px] rounded-md box-border border border-[var(--color-border)] bg-[var(--cms-input-bg)] font-body text-[13px] text-[var(--text-primary)] outline-none"
      />
      <span className="font-body text-xs text-[var(--text-muted)] min-w-[90px]">{label}</span>
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
      className="w-full px-[10px] py-2 rounded-md box-border border border-[var(--color-border)] bg-[var(--cms-input-bg)] font-body text-[13px] text-[var(--text-primary)] resize-y outline-none leading-[1.6]"
    />
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-base font-normal text-[var(--text-primary)] mt-0 mb-4 pb-2 border-b border-[var(--color-border)]">
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
      <div className="grid grid-cols-2 gap-3">
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
      <p className="font-body text-xs text-[var(--text-muted)] mb-5 leading-[1.6]">
        Leave blank to use template defaults. Hex values only (e.g. #C4956A). These override the CSS tokens at runtime via <code className="font-mono text-[11px]">useThemeColors()</code>.
      </p>

      <div className="flex flex-col gap-3">
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
      <div className="p-10 font-body text-[13px] text-[var(--text-muted)]">
        Loading site content settings…
      </div>
    )
  }

  return (
    <div className="px-8 py-7 max-w-[760px] font-body">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-normal text-[var(--text-muted)] m-0">
          Site Content
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Edit CMS-driven content for About, Pricing, Footer, and color overrides. Changes are reflected on the public website immediately after save.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] mb-7">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-[18px] py-2 bg-transparent border-none border-b-2 -mb-px font-body text-[13px] cursor-pointer transition-colors duration-150 ${
              activeTab === t.id
                ? 'border-b-[var(--lito-gold,#D4A853)] font-semibold text-[var(--text-primary)]'
                : 'border-b-transparent font-normal text-[var(--text-muted)]'
            }`}
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
        <div className="mt-4 px-[14px] py-[10px] rounded-md bg-[var(--cms-danger-bg)] border border-[var(--cms-danger)] text-[13px] text-[var(--cms-danger)]">
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="mt-4 px-[14px] py-[10px] rounded-md bg-[rgba(26,74,90,0.08)] border border-[rgba(26,74,90,0.15)] text-[13px] text-[var(--text-primary)]">
          ✓ Site content saved successfully.
        </div>
      )}

      {/* Save button */}
      <div className="mt-6">
        <button
          onClick={() => onSave(draft)}
          disabled={saving}
          className="px-6 py-[9px] rounded-md border-none bg-[var(--lito-gold,#D4A853)] text-white font-body text-[13px] font-semibold cursor-pointer transition-opacity duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
