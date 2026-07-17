import { Scale, FileText, Cookie, Settings as SettingsIcon, ExternalLink, Sparkles } from 'lucide-react'
import { Button, Badge, FormField, EnterpriseDataTable, Select } from '@litostudio/ui-cms'
import type { LegalTemplateSummary, LegalPageMeta, CookieCategory, EDTColumn } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'

export type LegalTab = 'pages' | 'generate' | 'settings' | 'cookies'

export interface GenerateForm {
  business_type: string
  legal_kind: string
  locale: string
  slug: string
  jurisdiction: string
  effective_date: string
}

const KIND_LABELS: Record<string, string> = {
  'privacy-policy': 'Privacy Policy',
  'terms': 'Terms & Conditions',
  'cookie-policy': 'Cookie Policy',
  'faq': 'FAQ',
  'disclaimer': 'Disclaimer',
  'refund-policy': 'Refund Policy',
  'return-policy': 'Return Policy',
  'shipping-policy': 'Shipping Policy',
  'accessibility-statement': 'Accessibility Statement',
  'security-policy': 'Security Policy',
  'ai-usage-policy': 'AI Usage Policy',
  'community-guidelines': 'Community Guidelines',
  'dpa': 'Data Processing Agreement',
}

const SETTINGS_FIELDS: Array<{ group: string; fields: Array<{ key: string; label: string; placeholder?: string; hint?: string }> }> = [
  {
    group: 'Business Identity',
    fields: [
      { key: 'legalName',           label: 'Legal business name',    placeholder: 'PT Lito Studio Kreatif' },
      { key: 'registrationNumber',  label: 'Business registration no.' },
      { key: 'taxNumber',           label: 'Tax ID (NPWP)' },
      { key: 'businessType',        label: 'Business type', placeholder: 'e.g. ecommerce, creative_services' },
      { key: 'industry',            label: 'Industry' },
    ],
  },
  {
    group: 'Contact',
    fields: [
      { key: 'supportEmail',    label: 'Support email',    placeholder: 'support@yoursite.com' },
      { key: 'supportPhone',    label: 'Support phone' },
      { key: 'supportWhatsapp', label: 'Support WhatsApp' },
      { key: 'supportAddress',  label: 'Address' },
      { key: 'supportCity',     label: 'City' },
      { key: 'supportCountry',  label: 'Country', placeholder: 'Indonesia' },
    ],
  },
  {
    group: 'Legal & Privacy',
    fields: [
      { key: 'jurisdiction',        label: 'Governing jurisdiction', placeholder: 'Indonesia' },
      { key: 'minimumAge',          label: 'Minimum age',            placeholder: '18' },
      { key: 'dataRetentionDays',   label: 'Data retention (days)',  placeholder: '365' },
      { key: 'cookieRetentionDays', label: 'Cookie retention (days)', placeholder: '30' },
      { key: 'privacyEmail',        label: 'Privacy contact email' },
      { key: 'dpoEmail',            label: 'Data Protection Officer email' },
    ],
  },
]

interface Props {
  tab: LegalTab
  setTab: (t: LegalTab) => void

  legalPages: LegalPageMeta[]
  pagesLoading: boolean
  onOpenPage: (pageId: string) => void

  templates: LegalTemplateSummary[]
  businessTypes: string[]
  legalKinds: string[]
  form: GenerateForm
  setForm: (f: Partial<GenerateForm>) => void
  onGenerate: () => void
  isGenerating: boolean
  generateError: string | null

  settingsForm: Record<string, string>
  settingsLoading: boolean
  setSettingsField: (key: string, value: string) => void
  onSaveSettings: () => void
  isSavingSettings: boolean
  settingsSaved: boolean

  cookieCategories: CookieCategory[]
  cookiesLoading: boolean
}

const TABS: Array<{ id: LegalTab; label: string; icon: typeof Scale }> = [
  { id: 'pages',    label: 'Legal Pages', icon: FileText },
  { id: 'generate', label: 'Generate',    icon: Sparkles },
  { id: 'settings', label: 'Settings',    icon: SettingsIcon },
  { id: 'cookies',  label: 'Cookie Categories', icon: Cookie },
]

export function LegalPageView({
  tab, setTab,
  legalPages, pagesLoading, onOpenPage,
  templates, businessTypes, legalKinds, form, setForm, onGenerate, isGenerating, generateError,
  settingsForm, settingsLoading, setSettingsField, onSaveSettings, isSavingSettings, settingsSaved,
  cookieCategories, cookiesLoading,
}: Props) {
  const availableLocales = Array.from(new Set(
    templates.filter((t) => t.business_type === form.business_type && t.legal_kind === form.legal_kind).map((t) => t.locale),
  ))

  const legalPageColumns: EDTColumn<LegalPageMeta>[] = [
    {
      key: 'title',
      label: 'Document',
      render: (lp) => lp.pages.page_translations?.[0]?.title ?? KIND_LABELS[lp.legal_kind] ?? lp.legal_kind,
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (lp) => <span className="font-mono text-xs text-[var(--text-muted)]">/{lp.pages.slug}</span>,
    },
    {
      key: 'business_type_source',
      label: 'Business type',
      render: (lp) => <Badge variant="default">{lp.business_type_source}</Badge>,
    },
    {
      key: 'jurisdiction',
      label: 'Jurisdiction',
      render: (lp) => lp.jurisdiction ?? '—',
    },
    {
      key: 'updated_at',
      label: 'Updated',
      sortable: true,
      render: (lp) => formatRelative(lp.updated_at),
    },
    {
      key: 'open',
      label: '',
      width: 40,
      render: () => <ExternalLink className="w-3.5 h-3.5 text-[var(--text-faint)]" aria-hidden />,
    },
  ]

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Scale className="w-5 h-5" aria-hidden />
          Legal Center
        </h1>
        <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
          Generate and manage legal pages, cookie/consent config, and business info used across your site's legal documents.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-[var(--lito-border)]">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                'flex items-center gap-1.5 px-3.5 py-2 font-body text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t.id
                  ? 'border-[var(--lito-teal)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'pages' && (
        legalPages.length === 0 && !pagesLoading ? (
          <div className="cms-card overflow-hidden p-8 text-center space-y-2">
            <FileText className="w-8 h-8 mx-auto text-[var(--text-faint)]" aria-hidden />
            <p className="font-body text-sm text-[var(--text-muted)]">No legal pages generated yet.</p>
            <Button skin="cms" size="sm" onClick={() => setTab('generate')}>Generate your first document</Button>
          </div>
        ) : (
          <EnterpriseDataTable<LegalPageMeta>
            skin="cms"
            columns={legalPageColumns}
            data={legalPages}
            loading={pagesLoading}
            onRowClick={(lp) => onOpenPage(lp.pages.id)}
            emptyTitle="No legal pages generated yet."
          />
        )
      )}

      {tab === 'generate' && (
        <div className="cms-card p-5 space-y-4 max-w-xl">
          <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Generate a legal document</h3>
          <p className="font-body text-xs text-[var(--text-muted)]">
            Choose a business type and document — content is created as a regular page you can further edit in the Pages block editor.
            {'{{variables}}'} inside it (contact email, jurisdiction, etc.) resolve automatically from your Settings below and stay live even after you edit the page.
          </p>

          <div className="space-y-1.5">
            <label className="cms-label">Business type</label>
            <Select
              className="w-full"
              value={form.business_type}
              onChange={(v) => setForm({ business_type: v })}
              options={businessTypes.map((bt) => ({ value: bt, label: bt.replace(/_/g, ' ') }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="cms-label">Document</label>
            <Select
              className="w-full"
              value={form.legal_kind}
              onChange={(v) => setForm({ legal_kind: v })}
              options={legalKinds.map((k) => ({ value: k, label: KIND_LABELS[k] ?? k }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="cms-label">Language</label>
            <Select
              className="w-full"
              value={form.locale}
              onChange={(v) => setForm({ locale: v })}
              options={(availableLocales.length > 0 ? availableLocales : ['id', 'en']).map((l) => ({
                value: l,
                label: l === 'id' ? 'Indonesian' : l === 'en' ? 'English' : l,
              }))}
            />
          </div>

          <FormField
            label="URL slug"
            value={form.slug}
            onChange={(e) => setForm({ slug: e.target.value })}
            placeholder={form.legal_kind}
            hint="Leave blank to use the document type as the slug (e.g. /privacy-policy)."
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Jurisdiction"
              value={form.jurisdiction}
              onChange={(e) => setForm({ jurisdiction: e.target.value })}
              placeholder="Indonesia"
            />
            <FormField
              label="Effective date"
              type="date"
              value={form.effective_date}
              onChange={(e) => setForm({ effective_date: e.target.value })}
            />
          </div>

          {generateError && (
            <div className="px-3 py-2 rounded-lg border border-[var(--cms-danger)] bg-[var(--cms-danger-bg)]">
              <p className="font-body text-xs text-[var(--cms-danger)]">{generateError}</p>
            </div>
          )}

          <Button skin="cms" onClick={onGenerate} loading={isGenerating} className="w-full justify-center">
            Generate document
          </Button>
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-4 max-w-2xl">
          <p className="font-body text-xs text-[var(--text-muted)]">
            These values fill in the {'{{variables}}'} used across your legal pages and FAQ answers for this site. Leaving a field blank falls back to your organization's default (Organization Settings), then to an empty value.
          </p>
          {settingsLoading ? (
            <div className="cms-card p-6 text-center font-body text-sm text-[var(--text-muted)]">Loading…</div>
          ) : (
            <>
              {SETTINGS_FIELDS.map((group) => (
                <div key={group.group} className="cms-card p-4 space-y-3">
                  <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">{group.group}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {group.fields.map((f) => (
                      <FormField
                        key={f.key}
                        label={f.label}
                        value={settingsForm[f.key] ?? ''}
                        onChange={(e) => setSettingsField(f.key, e.target.value)}
                        placeholder={f.placeholder}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <Button skin="cms" onClick={onSaveSettings} loading={isSavingSettings}>
                  Save settings
                </Button>
                {settingsSaved && (
                  <span className="font-body text-xs text-[var(--s-success,#1a7f37)]">Saved</span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'cookies' && (
        <div className="space-y-3 max-w-2xl">
          <p className="font-body text-xs text-[var(--text-muted)]">
            Detected automatically from your site's active add-ons and analytics integrations — nothing here is hardcoded. Used to build the cookie consent banner and Cookie Policy page.
          </p>
          {cookiesLoading ? (
            <div className="cms-card p-6 text-center font-body text-sm text-[var(--text-muted)]">Loading…</div>
          ) : (
            cookieCategories.map((cat) => (
              <div key={cat.slug} className="cms-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">{cat.name}</h3>
                  {cat.required && <Badge variant="default">Always on</Badge>}
                </div>
                {cat.items.length === 0 ? (
                  <p className="font-body text-xs text-[var(--text-faint)]">No integrations detected in this category.</p>
                ) : (
                  <ul className="space-y-1">
                    {cat.items.map((item) => (
                      <li key={item.key} className="font-body text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[var(--text-faint)]" />
                        {item.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
