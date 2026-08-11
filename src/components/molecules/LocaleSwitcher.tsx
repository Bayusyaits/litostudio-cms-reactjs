// components/molecules/LocaleSwitcher.tsx
//
// 2026-08-11 (MULTIPLE-LANGUAGE-PLAN.md Phase 6): compact locale toggle for
// content editors (SimpleContentEditorPage, ProductWizardPage, FaqEditorPage,
// SeoPageContainer). Mirrors the EN/ID toggle already built into the Pages
// block editor's toolbar (packages/ui-cms/src/editor/EditorToolbar.tsx,
// SUPPORTED_LOCALES) but reads the org's REAL active locale list instead of
// a hardcoded ['id','en'] pair — every other module never had a toggle at
// all before this (confirmed via direct read: SimpleContentEditorPage.tsx,
// ProductWizardPage.tsx and FaqEditorPage.tsx all hardcoded `LOCALE = 'id'`
// with no switcher UI, see task #84 audit).
//
// Design choice: when the org has only 1 active locale (either because it
// never activated a 2nd one, or because it doesn't have the multi_language
// add-on — organization.routes.ts's POST/PATCH /locales paywall guarantees
// an addon-inactive org can never have more than 1 active row), there is
// nothing to switch between. Rather than hide the control entirely (which
// would make the add-on invisible from inside every editor, the same
// "discoverability" gap flagged in Phase 5's SEO review), it renders a
// small locked hint linking to /addons — the exact same "stay visible,
// dimmed, with a lock icon + link to /addons" convention already used by
// the sidebar's addon-gated nav items (AppSidebar.tsx, task #73).
import { Globe, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useOrgLocales } from '@/hooks/useOrgLocales'

interface LocaleSwitcherProps {
  value: string
  onChange: (locale: string) => void
}

export function LocaleSwitcher({ value, onChange }: LocaleSwitcherProps) {
  const { activeLocales, multiLanguageAddonActive, isLoading } = useOrgLocales()

  if (isLoading) return null

  if (activeLocales.length <= 1) {
    if (multiLanguageAddonActive) return null // 1 locale by choice, nothing to upsell
    return (
      <Link
        to="/addons"
        title="Add more languages — requires the Multi Language add-on ($10/month)"
        className="flex items-center gap-1 px-2 py-1 rounded-md font-body text-[11px] font-medium text-[var(--text-muted)] border border-[var(--lito-border)] hover:text-[var(--text-primary)] hover:border-[var(--lito-teal)] transition-colors"
      >
        <Lock size={11} className="shrink-0 opacity-70" aria-hidden="true" />
        Add language
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-[var(--lito-border)] bg-[var(--cms-surface-2)]">
      <Globe size={11} className="text-[var(--text-muted)] mx-1" aria-hidden="true" />
      {activeLocales.map((l) => (
        <button
          key={l.locale}
          type="button"
          title={`Edit ${l.name} content`}
          onClick={() => onChange(l.locale)}
          aria-pressed={value === l.locale}
          className={`min-w-7 px-1.5 py-1 rounded font-body text-[11px] font-semibold uppercase transition-colors ${
            value === l.locale
              ? 'bg-[var(--lito-teal)] text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {l.locale}
        </button>
      ))}
    </div>
  )
}
