import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orgService } from '@/services/org.service'
import { themeService } from '@/services/theme.service'
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
  const [saveError, setSaveError]     = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [themeError, setThemeError]   = useState<string | null>(null)

  // ── Themes ────────────────────────────────────────────────────────────────

  const { data: themesData } = useQuery({
    queryKey: ['themes'],
    queryFn:  themeService.listThemes,
    staleTime: 5 * 60 * 1000,
  })

  const { data: siteTheme } = useQuery({
    queryKey: ['site-theme', activeSite?.id],
    queryFn:  () => themeService.getSiteTheme(activeSite!.id),
    enabled:  !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const applyThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      // 1. Set active theme in site_theme_settings
      await themeService.updateSiteTheme(activeSite!.id, { theme_id: themeId })

      // 2. Derive template_slug from the theme's slug, write to site.settings
      //    so BlockEditorPage can seed the correct page defaults
      const theme = (themesData?.data ?? []).find((t) => t.id === themeId)
      if (theme?.slug) {
        const existing = (activeSite?.settings ?? {}) as Record<string, unknown>
        const updated = await orgService.updateSite(activeSite!.id, {
          settings: { ...existing, template_slug: theme.slug },
        })
        setActiveSite(updated)
      }
    },
    onSuccess: () => {
      setThemeError(null)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      qc.invalidateQueries({ queryKey: ['site-theme', activeSite?.id] })
    },
    onError: (err) => setThemeError(getErrorMessage(err)),
  })

  // ── Org / Site ────────────────────────────────────────────────────────────

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
      saveError={saveError ?? themeError}
      saveSuccess={saveSuccess}
      // Theme props
      themes={themesData?.data ?? []}
      activeThemeId={siteTheme?.theme_id ?? null}
      onApplyTheme={(id) => applyThemeMutation.mutate(id)}
      applyingTheme={applyThemeMutation.isPending}
    />
  )
}
