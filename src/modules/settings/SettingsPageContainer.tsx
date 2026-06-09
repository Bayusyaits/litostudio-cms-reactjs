import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orgService } from '@/services/org.service'
import { useOrgStore } from '@/stores/org.store'
import { useWebsiteStore } from '@/stores/website.store'
import { useThemeStore } from '@/stores/theme.store'
import { SettingsPageView } from './SettingsPageView'
import { getErrorMessage } from '@/lib/axios'
import { useState } from 'react'

export default function SettingsPageContainer() {
  const qc = useQueryClient()
  const { org, setOrg } = useOrgStore()
  const { activeSite, setActiveSite } = useWebsiteStore()
  const { colorMode, setColorMode } = useThemeStore()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const updateOrgMutation = useMutation({
    mutationFn: (payload: { name?: string; settings?: Record<string, unknown> }) =>
      orgService.updateOrg(payload),
    onSuccess: (updated) => {
      setOrg(updated)
      setSaveError(null)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      qc.invalidateQueries({ queryKey: ['orgs'] })
    },
    onError: (err) => setSaveError(getErrorMessage(err)),
  })

  const updateSiteMutation = useMutation({
    mutationFn: (payload: { name?: string; domain?: string; settings?: Record<string, unknown> }) =>
      orgService.updateSite(activeSite!.id, payload),
    onSuccess: (updated) => {
      setActiveSite(updated)
      setSaveError(null)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err) => setSaveError(getErrorMessage(err)),
  })

  return (
    <SettingsPageView
      org={org}
      activeSite={activeSite}
      colorMode={colorMode}
      onSetColorMode={setColorMode}
      onSaveOrg={(payload) => updateOrgMutation.mutate(payload)}
      onSaveSite={(payload) => updateSiteMutation.mutate(payload)}
      saving={updateOrgMutation.isPending || updateSiteMutation.isPending}
      saveError={saveError}
      saveSuccess={saveSuccess}
    />
  )
}
