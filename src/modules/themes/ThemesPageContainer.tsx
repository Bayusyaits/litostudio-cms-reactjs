/**
 * ThemesPageContainer
 *
 * BUG-006 fix: after applying a theme, also write theme.slug → site.settings.template_slug
 * via orgService.updateSite and call setActiveSite so the editor canvas picks up the
 * new template tokens immediately (without a page reload).
 *
 * Template-switch confirmation: before applying any theme, TemplateSwitchModal is shown
 * so the user can choose to keep existing content or reset to template defaults.
 *
 * Republish: after a successful template apply, RepublishPagesModal is offered so the
 * user can re-seed all page_sections with the new template's defaults (staging deployment).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { themeService }   from '@litostudio/ui-cms'
import { orgService }     from '@/services/org.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { getErrorMessage } from '@litostudio/ui-cms'
import { useState, useCallback } from 'react'
import { ThemesPageView } from './ThemesPageView'
import { TemplateSwitchModal } from '@litostudio/ui-cms'
import type { TemplateSwitchResult } from '@litostudio/ui-cms'
import { RepublishPagesModal } from './RepublishPagesModal'
import { useTracking } from '@/tracking'
import type { TemplateName } from '@/tracking/types'

export default function ThemesPageContainer() {
  const { activeSite, setActiveSite } = useWebsiteStore()
  const qc = useQueryClient()
  const [applyError,   setApplyError]   = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState(false)
  /** themeId pending confirmation in TemplateSwitchModal; null = closed */
  const [pendingThemeId, setPendingThemeId] = useState<string | null>(null)
  /** when set, show RepublishPagesModal for this template name */
  const [republishTemplateName, setRepublishTemplateName] = useState<string | null>(null)
  const { trackTemplateSelected } = useTracking()

  const { data: themesData, isLoading: loadingThemes } = useQuery({
    queryKey: ['themes'],
    queryFn:  themeService.listThemes,
    staleTime: 5 * 60 * 1000,
  })

  const { data: siteThemeData, isLoading: loadingSiteTheme } = useQuery({
    queryKey: ['site-theme', activeSite?.id],
    queryFn:  () => themeService.getSiteTheme(activeSite!.id),
    enabled:  !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const applyMutation = useMutation({
    mutationFn: async ({ themeId, overwrite }: { themeId: string; overwrite: boolean }) => {
      // 1. Set active theme in site_theme_settings
      await themeService.updateSiteTheme(activeSite!.id, { theme_id: themeId })

      // 2. BUG-006 fix: derive template_slug from the theme slug and write it to
      //    site.settings so BlockEditorPage / EditorCanvas pick up the correct
      //    template tokens and page defaults without a full page reload.
      const theme = (themesData?.data ?? []).find((t) => t.id === themeId)
      // BUG-CMS-02 fix: use theme.template_slug ('beauty'/'fashion'/'lito'),
      // NOT theme.slug ('lito-beauty'/'lito-fashion') — they are different fields.
      // getCanvasTokens() keys on template_slug; using theme.slug causes a miss → lito fallback.
      const tplSlug = theme?.template_slug ?? theme?.slug
      if (tplSlug && activeSite) {
        const existing = (activeSite.settings ?? {}) as Record<string, unknown>
        const updated = await orgService.updateSite(activeSite.id, {
          // Write to both: settings.template_slug (runtime override) AND
          // top-level template_slug column (persists across cold loads).
          template_slug: tplSlug,
          settings: { ...existing, template_slug: tplSlug },
        })
        // Propagate updated site (with new template_slug) into the Zustand store
        // so all consumers (useTemplateManifest, TemplateSystemProvider, EditorCanvas)
        // re-derive their template context reactively.
        setActiveSite(updated)

        // 3. Seed extra_settings with template default content.
        //    overwrite=false → only fill missing keys (keep existing customisations).
        //    overwrite=true  → full reset to template defaults (user picked "apply defaults").
        const validSlug = ['fashion', 'beauty', 'lito'].includes(tplSlug)
          ? tplSlug as 'fashion' | 'beauty' | 'lito'
          : null
        if (validSlug) {
          // Fire-and-forget — seed failure is non-critical; user can still customise manually
          themeService.seedTemplateDefaults(activeSite.id, validSlug, 'en', overwrite).catch(() => { /* silent */ })
        }
      }
    },
    onSuccess: (_, { themeId }) => {
      setApplyError(null)
      setApplySuccess(true)
      setTimeout(() => setApplySuccess(false), 3000)
      qc.invalidateQueries({ queryKey: ['site-theme', activeSite?.id] })
      const theme = (themesData?.data ?? []).find((t) => t.id === themeId)
      const tplSlug = theme?.template_slug ?? theme?.slug
      if (activeSite && tplSlug) {
        trackTemplateSelected({
          site_id:                 activeSite.id,
          org_id:                  activeSite.organization_id,
          template_slug:           tplSlug! as TemplateName,
          is_initial_selection:    !activeSite.template_slug,
          previous_template_slug:  (activeSite.template_slug ?? undefined) as TemplateName | undefined,
        })
      }
      // Offer to republish pages so section types match the new template
      const displayName = theme?.name ?? tplSlug ?? 'New Template'
      setRepublishTemplateName(displayName)
    },
    onError: (err) => setApplyError(getErrorMessage(err)),
  })

  /** Open modal instead of applying immediately */
  const handleApplyTheme = useCallback((id: string) => {
    setPendingThemeId(id)
  }, [])

  /** Resolve modal — keep or apply-defaults or cancel */
  const handleModalResolve = useCallback((result: TemplateSwitchResult) => {
    setPendingThemeId(null)
    if (result.action === 'cancel' || !pendingThemeId) return
    applyMutation.mutate({
      themeId:   pendingThemeId,
      overwrite: result.action === 'apply-defaults',
    })
  }, [pendingThemeId, applyMutation])

  const pendingTheme = pendingThemeId
    ? (themesData?.data ?? []).find((t) => t.id === pendingThemeId)
    : null

  return (
    <>
      <ThemesPageView
        themes={themesData?.data ?? []}
        activeThemeId={siteThemeData?.theme_id ?? null}
        isLoading={loadingThemes || loadingSiteTheme}
        onApplyTheme={handleApplyTheme}
        applying={applyMutation.isPending}
        applyError={applyError}
        applySuccess={applySuccess}
        onRepublishPages={activeSite ? () => {
          const activeTheme = (themesData?.data ?? []).find((t) => t.id === siteThemeData?.theme_id)
          setRepublishTemplateName(activeTheme?.name ?? activeTheme?.template_slug ?? 'Current Template')
        } : undefined}
      />

      {pendingTheme && (
        <TemplateSwitchModal
          newTemplateName={pendingTheme.name ?? pendingTheme.template_slug ?? 'this template'}
          onResolve={handleModalResolve}
        />
      )}

      {republishTemplateName && activeSite && (
        <RepublishPagesModal
          siteId={activeSite.id}
          templateName={republishTemplateName}
          onClose={() => setRepublishTemplateName(null)}
        />
      )}
    </>
  )
}
