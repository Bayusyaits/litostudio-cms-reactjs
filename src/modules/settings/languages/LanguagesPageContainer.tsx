// modules/settings/languages/LanguagesPageContainer.tsx
// 2026-08-10 (MULTIPLE-LANGUAGE-PLAN.md, Phase 3 — CMS org language
// management + add-on activation flow). Org self-service language
// management: enable/disable, set primary, per-language currency override.
// Locked state (no 'multi_language' add-on): the org can still see/manage
// its ONE existing active language for free, but adding a second requires
// the add-on — see apps/backend/src/modules/organization/interface/
// organization.routes.ts's POST/PATCH /locales for the actual enforcement;
// this UI mirrors that rule so the upsell shows before a doomed request
// round-trips, not instead of the backend check.
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { languagesService } from '@/services/languages.service'
import { useOrgStore, getErrorMessage } from '@litostudio/ui-cms'
import { LanguagesPageView } from './LanguagesPageView'

export default function LanguagesPageContainer() {
  const { org } = useOrgStore()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [actionError, setActionError] = useState<string | null>(null)

  const qKey = ['org-languages-all', org?.id]

  const { data, isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () => languagesService.list(true),
    enabled: !!org,
    staleTime: 60_000,
  })

  const { data: catalogData } = useQuery({
    queryKey: ['locale-catalog'],
    queryFn: () => languagesService.catalog(),
    enabled: !!org,
    staleTime: 10 * 60_000,
  })

  function invalidate() {
    void qc.invalidateQueries({ queryKey: qKey })
    // The read-only LabelsPage locale filter and the public/localization
    // consumers all key off the same underlying data — safe, cheap to widen.
    void qc.invalidateQueries({ queryKey: ['org-languages', org?.id] })
  }

  const enableMutation = useMutation({
    mutationFn: (locale: string) => languagesService.enable(locale),
    onSuccess: () => { setActionError(null); invalidate() },
    onError: (e: unknown) => setActionError(getErrorMessage(e)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ locale, payload }: { locale: string; payload: Parameters<typeof languagesService.update>[1] }) =>
      languagesService.update(locale, payload),
    onSuccess: () => { setActionError(null); invalidate() },
    onError: (e: unknown) => setActionError(getErrorMessage(e)),
  })

  return (
    <LanguagesPageView
      languages={data?.data.languages ?? []}
      multiLanguageAddonActive={data?.data.multi_language_addon_active ?? false}
      catalog={catalogData?.data ?? []}
      isLoading={isLoading}
      actionError={actionError}
      onDismissError={() => setActionError(null)}
      onEnable={(locale) => enableMutation.mutate(locale)}
      onSetActive={(locale, isActive) => updateMutation.mutate({ locale, payload: { is_active: isActive } })}
      onSetPrimary={(locale) => updateMutation.mutate({ locale, payload: { is_default: true } })}
      onSaveCurrency={(locale, currencyCode, currencySymbol) =>
        updateMutation.mutate({ locale, payload: { currency_code: currencyCode || null, currency_symbol: currencySymbol || null } })}
      saving={enableMutation.isPending || updateMutation.isPending}
      onGoToAddons={() => navigate('/addons')}
    />
  )
}
