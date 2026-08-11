// hooks/useOrgLocales.ts
//
// 2026-08-11 (MULTIPLE-LANGUAGE-PLAN.md Phase 6 — CMS editor/form gap
// audit): every content editor in the CMS (SimpleContentEditorPage,
// ProductWizardPage, FaqEditorPage, PagesNewPageContainer, SeoPageContainer)
// was found hardcoding `const LOCALE = 'id'` or an inline `locale: 'id'`
// literal — confirmed via direct read of each file, not assumed. Only
// LabelsPageContainer.tsx (fixed in the earlier Phase 2/3 pass) and
// HeroFormModal.tsx / LegalPageContainer.tsx already read the org's real
// locale list. This hook is the single shared source of truth every editor
// should use from here on, wrapping the same `languagesService.list(true)`
// call LabelsPageContainer already uses (GET /cms/organizations/locales,
// organization.routes.ts — built Phase 2 this session).
//
// `all=true` is passed deliberately — editors need to know about a locale
// that exists but is currently inactive (is_active:false) is NOT the same
// question as "which locales can I switch to right now" (activeLocales
// below already filters that out). Keeping the full list available lets a
// caller distinguish "org has no multi_language add-on" from "org has the
// add-on but hasn't activated a 2nd locale yet" if it ever needs to.
import { useQuery } from '@tanstack/react-query'
import { useOrgStore } from '@litostudio/ui-cms'
import { languagesService, type OrgLanguage } from '@/services/languages.service'

export interface UseOrgLocalesResult {
  /** Every locale row for the org (active + inactive). */
  locales: OrgLanguage[]
  /** Locales the org can currently edit content in — is_active:true only.
   * For an org without the multi_language add-on this is always exactly the
   * 1 primary locale (enforced server-side by organization.routes.ts's
   * POST/PATCH /locales paywall gate — never trust a longer list here). */
  activeLocales: OrgLanguage[]
  /** The org's current primary locale code. Falls back to 'id' only when
   * the org has no organization_locales row at all (defensive — every org
   * should have one after the Phase 1 org-creation seed fix, but existing
   * orgs pre-dating that fix might not if migration 001's one-time backfill
   * ever missed one). */
  primaryLocale: string
  /** Whether the org currently has the 'multi_language' add-on enabled
   * (org-wide grant, from organization.routes.ts's isAddonEnabledForOrg). */
  multiLanguageAddonActive: boolean
  isLoading: boolean
}

export function useOrgLocales(): UseOrgLocalesResult {
  const { org } = useOrgStore()

  const { data, isLoading } = useQuery({
    queryKey: ['org-languages-all', org?.id],
    queryFn: () => languagesService.list(true),
    enabled: !!org,
    staleTime: 60_000,
  })

  const locales = data?.data.languages ?? []
  const activeLocales = locales.filter((l) => l.is_active)
  const primaryLocale = locales.find((l) => l.is_default)?.locale ?? 'id'
  const multiLanguageAddonActive = data?.data.multi_language_addon_active ?? false

  return { locales, activeLocales, primaryLocale, multiLanguageAddonActive, isLoading }
}
