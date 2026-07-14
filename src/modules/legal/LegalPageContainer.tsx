/**
 * LegalPageContainer — Legal Center dashboard: generated legal pages,
 * generate-from-template, effective legal settings, and detected cookie
 * categories. Site-scoped like every other content module (useWebsiteStore).
 *
 * Editing an already-generated page's content/sections is NOT done here —
 * it reuses the existing Pages block editor (navigate to
 * /pages/:id/edit), per the architecture decision to build Legal Center on
 * top of the regular pages/page_sections system rather than a parallel one.
 */
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { legalService, useWebsiteStore } from '@litostudio/ui-cms'
import { LegalPageView, type LegalTab, type GenerateForm } from './LegalPageView'

const DEFAULT_GENERATE_FORM: GenerateForm = {
  business_type: 'general',
  legal_kind: 'privacy-policy',
  locale: 'id',
  slug: '',
  jurisdiction: '',
  effective_date: '',
}

export default function LegalPageContainer() {
  const navigate = useNavigate()
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const [tab, setTab] = useState<LegalTab>('pages')
  const [generateForm, setGenerateForm] = useState<GenerateForm>(DEFAULT_GENERATE_FORM)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Site-level overrides only — organization-level defaults are edited from
  // the Organization Settings page (settings.legal is the same namespace,
  // just a different scope). Keeping this page focused on per-site config.
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({})
  const [settingsDirty, setSettingsDirty] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const { data: templates } = useQuery({
    queryKey: ['legal-templates'],
    queryFn: () => legalService.listTemplates(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: legalPages, isLoading: pagesLoading } = useQuery({
    queryKey: ['legal-pages', activeSite?.id],
    queryFn: () => legalService.listLegalPages(activeSite!.id),
    enabled: !!activeSite,
    staleTime: 60 * 1000,
  })

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['legal-settings', activeSite?.id],
    queryFn: () => legalService.getSettings(activeSite!.id),
    enabled: !!activeSite,
    staleTime: 60 * 1000,
  })

  // React Query v5 dropped useQuery's onSuccess callback — seed the local
  // form from server data via an effect instead. Only seeds once per fetch
  // when the form hasn't been touched yet, so a background refetch after
  // save never clobbers in-progress edits.
  useEffect(() => {
    if (!settings || settingsDirty) return
    setSettingsForm(Object.fromEntries(
      Object.entries(settings.site ?? {}).map(([k, v]) => [k, String(v ?? '')]),
    ))
  }, [settings, settingsDirty])

  const { data: cookieCategories, isLoading: cookiesLoading } = useQuery({
    queryKey: ['legal-cookie-categories', activeSite?.id],
    queryFn: () => legalService.getCookieCategories(activeSite!.id),
    enabled: !!activeSite && tab === 'cookies',
    staleTime: 60 * 1000,
  })

  const businessTypes = useMemo(
    () => Array.from(new Set((templates ?? []).map((t) => t.business_type))).sort(),
    [templates],
  )
  const legalKinds = useMemo(
    () => Array.from(new Set((templates ?? []).map((t) => t.legal_kind))).sort(),
    [templates],
  )

  const generateMutation = useMutation({
    mutationFn: () => legalService.generate({
      site_id: activeSite!.id,
      business_type: generateForm.business_type,
      legal_kind: generateForm.legal_kind,
      locale: generateForm.locale,
      slug: generateForm.slug || undefined,
      jurisdiction: generateForm.jurisdiction || undefined,
      effective_date: generateForm.effective_date || undefined,
    }),
    onSuccess: (result) => {
      setGenerateError(null)
      qc.invalidateQueries({ queryKey: ['legal-pages', activeSite?.id] })
      navigate(`/pages/${result.page.id}/edit`)
    },
    onError: (err: unknown) => {
      setGenerateError(err instanceof Error ? err.message : 'Could not generate this document. It may already exist for this slug.')
    },
  })

  const settingsMutation = useMutation({
    mutationFn: () => legalService.updateSettings({
      site_id: activeSite!.id,
      legal: settingsForm,
    }),
    onSuccess: () => {
      setSettingsDirty(false)
      setSettingsSaved(true)
      qc.invalidateQueries({ queryKey: ['legal-settings', activeSite?.id] })
      setTimeout(() => setSettingsSaved(false), 3000)
    },
  })

  const setSettingsField = useCallback((key: string, value: string) => {
    setSettingsDirty(true)
    setSettingsSaved(false)
    setSettingsForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  if (!activeSite) {
    return (
      <div className="p-8 text-center font-body text-sm text-[var(--text-muted)]">
        Select a website to manage its Legal Center.
      </div>
    )
  }

  return (
    <LegalPageView
      tab={tab}
      setTab={setTab}
      legalPages={legalPages ?? []}
      pagesLoading={pagesLoading}
      onOpenPage={(pageId) => navigate(`/pages/${pageId}/edit`)}
      templates={templates ?? []}
      businessTypes={businessTypes}
      legalKinds={legalKinds}
      form={generateForm}
      setForm={(f) => setGenerateForm((prev) => ({ ...prev, ...f }))}
      onGenerate={() => generateMutation.mutate()}
      isGenerating={generateMutation.isPending}
      generateError={generateError}
      settingsForm={settingsForm}
      settingsLoading={settingsLoading}
      setSettingsField={setSettingsField}
      onSaveSettings={() => settingsMutation.mutate()}
      isSavingSettings={settingsMutation.isPending}
      settingsSaved={settingsSaved}
      cookieCategories={cookieCategories ?? []}
      cookiesLoading={cookiesLoading}
    />
  )
}
