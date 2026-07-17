import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { addonService, type OrgAddon, type Addon } from '@/services/addon.service'
import { getErrorMessage } from '@litostudio/ui-cms'
import { AddonsPageView } from './AddonsPageView'

export default function AddonsPageContainer() {
  const { user } = useAuthStore()
  const orgId = user?.org_id ?? ''
  const qc = useQueryClient()

  const [selectedOrgAddon, setSelectedOrgAddon] = useState<OrgAddon | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsSuccess, setSettingsSuccess] = useState(false)
  // Addon compatibility (2026-07-15, addon-settings-compatibility-plan):
  // non-blocking heads-up returned alongside a successful install/toggle/
  // settings-save — e.g. two enabled add-ons both defaulting `position` to
  // the same value. Distinct from settingsError, which is a hard rejection
  // (409, conflicts/requires) that already prevented the save.
  const [settingsWarnings, setSettingsWarnings] = useState<string[]>([])

  // Platform catalog
  const catalogQuery = useQuery({
    queryKey: ['addons:catalog'],
    queryFn: addonService.listCatalog,
    staleTime: 10 * 60 * 1000,
  })

  // Org-specific addon states
  const orgAddonsQuery = useQuery({
    queryKey: ['addons:org', orgId],
    queryFn: () => addonService.listOrgAddons(orgId),
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  })

  // Compatibility rules (2026-07-15, addon-settings-compatibility-plan) —
  // platform-wide, not org-scoped, so a long staleTime is fine (same as the
  // catalog query above).
  const compatibilityQuery = useQuery({
    queryKey: ['addons:compatibility'],
    queryFn: addonService.listCompatibility,
    staleTime: 10 * 60 * 1000,
  })

  const catalog: Addon[] = catalogQuery.data ?? []
  const orgAddons: OrgAddon[] = orgAddonsQuery.data ?? []
  const compatibilityRules = compatibilityQuery.data ?? []

  // Build a merged view: catalog addon + installed state
  const mergedAddons = catalog.map((addon) => {
    const orgAddon = orgAddons.find((oa) => oa.addons?.slug === addon.slug) ?? null
    return { addon, orgAddon }
  })

  // Proactive conflict badge (Decisions log: "a proactive badge lets an
  // admin see a conflict before attempting to enable, not just after being
  // blocked") — for each catalog addon, does any 'conflicts' rule involving
  // it point to an addon that's already enabled for this org? Deliberately
  // not gated on condition_key/condition_value here: the badge is an
  // informational heads-up, the backend's 409 on actual save is what
  // precisely enforces the condition.
  const enabledSlugs = new Set(orgAddons.filter((oa) => oa.enabled).map((oa) => oa.addons?.slug).filter(Boolean))
  const conflictBadgeBySlug = new Map<string, string>()
  for (const rule of compatibilityRules) {
    if (rule.relation_type !== 'conflicts' || !rule.addon_slug || !rule.related_addon_slug) continue
    if (enabledSlugs.has(rule.related_addon_slug) && !conflictBadgeBySlug.has(rule.addon_slug)) {
      conflictBadgeBySlug.set(rule.addon_slug, `Conflicts with ${rule.related_addon_slug}`)
    }
    if (enabledSlugs.has(rule.addon_slug) && !conflictBadgeBySlug.has(rule.related_addon_slug)) {
      conflictBadgeBySlug.set(rule.related_addon_slug, `Conflicts with ${rule.addon_slug}`)
    }
  }

  // Install
  const installMutation = useMutation({
    mutationFn: (slug: string) => addonService.install(orgId, { addon_slug: slug }),
    onSuccess: (result) => {
      setSettingsError(null)
      setSettingsWarnings(result.warnings)
      void qc.invalidateQueries({ queryKey: ['addons:org', orgId] })
    },
    onError: (err) => { setSettingsError(getErrorMessage(err)); setSettingsWarnings([]) },
  })

  // Toggle enabled state
  const toggleMutation = useMutation({
    mutationFn: ({ orgAddonId, enabled }: { orgAddonId: string; enabled: boolean }) =>
      addonService.update(orgId, orgAddonId, { enabled }),
    onSuccess: (result) => {
      setSettingsError(null)
      setSettingsWarnings(result.warnings)
      void qc.invalidateQueries({ queryKey: ['addons:org', orgId] })
    },
    onError: (err) => { setSettingsError(getErrorMessage(err)); setSettingsWarnings([]) },
  })

  // Save settings
  const settingsMutation = useMutation({
    mutationFn: ({ orgAddonId, settings }: { orgAddonId: string; settings: Record<string, unknown> }) =>
      addonService.update(orgId, orgAddonId, { settings }),
    onSuccess: (result) => {
      setSettingsError(null)
      setSettingsSuccess(true)
      setSettingsWarnings(result.warnings)
      setTimeout(() => setSettingsSuccess(false), 3000)
      void qc.invalidateQueries({ queryKey: ['addons:org', orgId] })
    },
    onError: (err) => { setSettingsError(getErrorMessage(err)); setSettingsWarnings([]) },
  })

  function handleInstall(slug: string) {
    setSettingsError(null); setSettingsWarnings([])
    installMutation.mutate(slug)
  }

  function handleToggle(orgAddonId: string, enabled: boolean) {
    setSettingsError(null); setSettingsWarnings([])
    toggleMutation.mutate({ orgAddonId, enabled })
  }

  function handleSaveSettings(orgAddonId: string, settings: Record<string, unknown>) {
    setSettingsError(null); setSettingsWarnings([])
    settingsMutation.mutate({ orgAddonId, settings })
  }

  return (
    <AddonsPageView
      mergedAddons={mergedAddons}
      isLoading={catalogQuery.isLoading || orgAddonsQuery.isLoading}
      selectedOrgAddon={selectedOrgAddon}
      onSelectAddon={setSelectedOrgAddon}
      onInstall={handleInstall}
      onToggle={handleToggle}
      onSaveSettings={handleSaveSettings}
      isInstalling={installMutation.isPending}
      isToggling={toggleMutation.isPending}
      isSavingSettings={settingsMutation.isPending}
      settingsError={settingsError}
      settingsSuccess={settingsSuccess}
      settingsWarnings={settingsWarnings}
      conflictBadgeBySlug={conflictBadgeBySlug}
    />
  )
}
