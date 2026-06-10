import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { themeService } from '@/services/theme.service'
import { useWebsiteStore } from '@/stores/website.store'
import { getErrorMessage } from '@/lib/axios'
import { useState } from 'react'
import { ThemesPageView } from './ThemesPageView'

export default function ThemesPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState(false)

  const { data: themesData, isLoading: loadingThemes } = useQuery({
    queryKey: ['themes'],
    queryFn: themeService.listThemes,
    staleTime: 5 * 60 * 1000,
  })

  const { data: siteThemeData, isLoading: loadingSiteTheme } = useQuery({
    queryKey: ['site-theme', activeSite?.id],
    queryFn: () => themeService.getSiteTheme(activeSite!.id),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const applyMutation = useMutation({
    mutationFn: (themeId: string) => themeService.updateSiteTheme(activeSite!.id, { theme_id: themeId }),
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
