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

  const catalog: Addon[] = catalogQuery.data ?? []
  const orgAddons: OrgAddon[] = orgAddonsQuery.data ?? []

  // Build a merged view: catalog addon + installed state
  const mergedAddons = catalog.map((addon) => {
    const orgAddon = orgAddons.find((oa) => oa.addons?.slug === addon.slug) ?? null
    return { addon, orgAddon }
  })

  // Install
  const installMutation = useMutation({
    mutationFn: (slug: string) => addonService.install(orgId, { addon_slug: slug }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['addons:org', orgId] })
    },
    onError: (err) => setSettingsError(getErrorMessage(err)),
  })

  // Toggle enabled state
  const toggleMutation = useMutation({
    mutationFn: ({ orgAddonId, enabled }: { orgAddonId: string; enabled: boolean }) =>
      addonService.update(orgId, orgAddonId, { enabled }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['addons:org', orgId] })
    },
    onError: (err) => setSettingsError(getErrorMessage(err)),
  })

  // Save settings
  const settingsMutation = useMutation({
    mutationFn: ({ orgAddonId, settings }: { orgAddonId: string; settings: Record<string, unknown> }) =>
      addonService.update(orgId, orgAddonId, { settings }),
    onSuccess: () => {
      setSettingsError(null)
      setSettingsSuccess(true)
      setTimeout(() => setSettingsSuccess(false), 3000)
      void qc.invalidateQueries({ queryKey: ['addons:org', orgId] })
    },
    onError: (err) => setSettingsError(getErrorMessage(err)),
  })

  function handleInstall(slug: string) {
    setSettingsError(null)
    installMutation.mutate(slug)
  }

  function handleToggle(orgAddonId: string, enabled: boolean) {
    setSettingsError(null)
    toggleMutation.mutate({ orgAddonId, enabled })
  }

  function handleSaveSettings(orgAddonId: string, settings: Record<string, unknown>) {
    setSettingsError(null)
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
    />
  )
}
