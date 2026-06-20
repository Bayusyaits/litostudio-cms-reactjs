/**
 * ThemesPageContainer
 *
 * BUG-006 fix: after applying a theme, also write theme.slug → site.settings.template_slug
 * via orgService.updateSite and call setActiveSite so the editor canvas picks up the
 * new template tokens immediately (without a page reload).
 *
 * NOTE: No TemplateSwitchModal here — the Themes page is a visual "browse & apply"
 * surface that always preserves existing content. For "apply defaults" (wipe blocks),
 * the user should use Settings → Template tab instead.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { themeService }   from '@/services/theme.service'
import { orgService }     from '@/services/org.service'
import { useWebsiteStore } from '@/stores/website.store'
import { getErrorMessage } from '@/lib/axios'
import { useState } from 'react'
import { ThemesPageView } from './ThemesPageView'

export default function ThemesPageContainer() {
  const { activeSite, setActiveSite } = useWebsiteStore()
  const qc = useQueryClient()
  const [applyError,   setApplyError]   = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState(false)

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
    mutationFn: async (themeId: string) => {
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
      }
    },
    onSuccess: () => {
      setApplyError(null)
      setApplySuccess(true)
      setTimeout(() => setApplySuccess(false), 3000)
      qc.invalidateQueries({ queryKey: ['site-theme', activeSite?.id] })
    },
    onError: (err) => setApplyError(getErrorMessage(err)),
  })

  return (
    <ThemesPageView
      themes={themesData?.data ?? []}
      activeThemeId={siteThemeData?.theme_id ?? null}
      isLoading={loadingThemes || loadingSiteTheme}
      onApplyTheme={(id) => applyMutation.mutate(id)}
      applying={applyMutation.isPending}
      applyError={applyError}
      applySuccess={applySuccess}
    />
  )
}
