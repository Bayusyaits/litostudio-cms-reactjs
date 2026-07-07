import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orgService } from '@/services/org.service'
import { themeService } from '@litostudio/ui-cms'
import { useOrgStore } from '@litostudio/ui-cms'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { useThemeStore } from '@/stores/theme.store'
import { SettingsPageView } from './SettingsPageView'
import { getErrorMessage } from '@litostudio/ui-cms'
import { useState, useCallback } from 'react'
import { TemplateSwitchModal } from '@litostudio/ui-cms'
import type { TemplateSwitchResult } from '@litostudio/ui-cms'
import { useEditorStore } from '@litostudio/ui-cms'
import { draftMediaStore } from '@litostudio/ui-cms'

export default function SettingsPageContainer() {
  const qc = useQueryClient()
  const { org, setOrg } = useOrgStore()
  const { activeSite, setActiveSite } = useWebsiteStore()
  const { colorMode, setColorMode } = useThemeStore()
  const resetEditor = useEditorStore((s) => s.reset)
  const [saveError, setSaveError]     = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [themeError, setThemeError]   = useState<string | null>(null)

  // ── Template switch modal ─────────────────────────────────────────────────

  const [pendingTheme, setPendingTheme] = useState<{ id: string; name: string } | null>(null)

  const resolveTemplateSwitchModal = useCallback((result: TemplateSwitchResult) => {
    if (!pendingTheme || result.action === 'cancel') {
      setPendingTheme(null)
      return
    }
    const { id, keepContent } = { id: pendingTheme.id, keepContent: result.action === 'keep' }
    setPendingTheme(null)
    applyThemeMutation.mutate({ themeId: id, keepContent })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTheme])

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
    mutationFn: async ({ themeId, keepContent }: { themeId: string; keepContent: boolean }) => {
      // 1. Set active theme in site_theme_settings
      await themeService.updateSiteTheme(activeSite!.id, { theme_id: themeId })

      // 2. Derive template_slug from the theme slug, write to site.settings
      //    so BlockEditorPage can seed the correct page defaults
      const theme = (themesData?.data ?? []).find((t) => t.id === themeId)
      // BUG-CMS-02 fix: use theme.template_slug ('beauty'/'fashion'/'lito'),
      // NOT theme.slug ('lito-beauty'/'lito-fashion') — they are different fields.
      const tplSlug = theme?.template_slug ?? theme?.slug
      if (tplSlug) {
        const existing = (activeSite?.settings ?? {}) as Record<string, unknown>
        const updated = await orgService.updateSite(activeSite!.id, {
          // Sync both the direct DB column and the settings JSON key.
          template_slug: tplSlug,
          settings: { ...existing, template_slug: tplSlug },
        })
        setActiveSite(updated)
      }

      // 3. BUG-007 fix: if user chose "apply defaults", wipe the editor blockDoc
      //    AND invalidate the page-editor query cache so BlockEditorPage's
      //    useEffect re-runs and re-seeds blocks from the new template's defaults.
      //    Without the invalidation, the editor's useEffect only re-runs on
      //    pageId change — resetEditor() alone is not enough.
      if (!keepContent) {
        resetEditor()
        // Invalidate all open page-editor queries so the init effect re-seeds
        qc.invalidateQueries({ queryKey: ['page-editor'] })
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

  // ── Branding (logo_url + dark_logo_url) ──────────────────────────────────

  const updateBrandingMutation = useMutation({
    mutationFn: (payload: { logo_url: string | null; dark_logo_url: string | null }) =>
      themeService.updateSiteTheme(activeSite!.id, {
        logo_url:      payload.logo_url      ?? undefined,
        dark_logo_url: payload.dark_logo_url ?? undefined,
      }),
    onSuccess: () => {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      qc.invalidateQueries({ queryKey: ['site-theme', activeSite?.id] })
    },
    onError: (err) => setSaveError(getErrorMessage(err)),
  })

  async function handleSaveBranding(payload: { logo_url: string | null; dark_logo_url: string | null }) {
    // Resolve any blob: URLs (deferred R2 uploads) before persisting
    const logoResolved     = payload.logo_url      ? await draftMediaStore.resolveUrl(payload.logo_url).catch(() => payload.logo_url)      : null
    const darkLogoResolved = payload.dark_logo_url ? await draftMediaStore.resolveUrl(payload.dark_logo_url).catch(() => payload.dark_logo_url) : null
    updateBrandingMutation.mutate({ logo_url: logoResolved, dark_logo_url: darkLogoResolved })
  }

  // Gate theme changes through the modal —
  // find the theme name so the modal copy is specific.
  const handleApplyTheme = useCallback((id: string) => {
    const theme = (themesData?.data ?? []).find((t) => t.id === id)
    const name  = theme?.name ?? 'this template'
    setPendingTheme({ id, name })
  }, [themesData])

  return (
    <>
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
        onApplyTheme={handleApplyTheme}
        applyingTheme={applyThemeMutation.isPending}
        // Branding props
        logoUrl={siteTheme?.logo_url ?? null}
        darkLogoUrl={siteTheme?.dark_logo_url ?? null}
        onSaveBranding={handleSaveBranding}
        savingBranding={updateBrandingMutation.isPending}
      />

      {pendingTheme && (
        <TemplateSwitchModal
          newTemplateName={pendingTheme.name}
          onResolve={resolveTemplateSwitchModal}
        />
      )}
    </>
  )
}
