// modules/site-content/SiteContentPageContainer.tsx
// CMS UI for editing extra_settings JSONB fields consumed by useSiteSettings()
// and useSiteFooter() on the website. No DB migration needed — JSONB is open.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { themeService } from '@litostudio/ui-cms'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { getErrorMessage } from '@litostudio/ui-cms'
import { useState } from 'react'
import { SiteContentPageView } from './SiteContentPageView'

export interface SiteExtraSettings {
  // About
  about_body?: string[]
  about_manifesto?: string[]
  // Stats
  stats?: {
    sessions?: string
    destinations?: string
    stories?: string
    founded?: string
    cities?: string
    [key: string]: string | undefined
  }
  // Pricing
  pricing_subtitle?: string
  pricing_footer_note?: string
  // Footer
  footer_tagline?: string
  footer_copyright?: string
  footer_contact?: {
    email?: string
    phone?: string
    address?: string
    [key: string]: string | undefined
  }
  social_links?: {
    instagram?: string
    facebook?: string
    twitter?: string
    tiktok?: string
    youtube?: string
    linkedin?: string
    [key: string]: string | undefined
  }
  // Theme color overrides
  theme_colors?: {
    accent?: string
    accent_hover?: string
    accent_text?: string
    bg?: string
    text?: string
    // 2026-07-08: dark-mode-specific overrides (audit finding #6). Optional —
    // when a field is omitted, the website falls back to the light-mode value
    // for that same field rather than the stock template color.
    dark?: {
      accent?: string
      accent_hover?: string
      accent_text?: string
      bg?: string
      text?: string
    }
  }
}

export default function SiteContentPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { data: siteTheme, isLoading } = useQuery({
    queryKey: ['site-theme', activeSite?.id],
    queryFn: () => themeService.getSiteTheme(activeSite!.id),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const mutation = useMutation({
    mutationFn: (extra: SiteExtraSettings) =>
      themeService.updateSiteTheme(activeSite!.id, { extra_settings: extra as Record<string, unknown> }),
    onSuccess: () => {
      setSaveError(null)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      qc.invalidateQueries({ queryKey: ['site-theme', activeSite?.id] })
    },
    onError: (err) => setSaveError(getErrorMessage(err)),
  })

  const currentExtra = (siteTheme?.extra_settings ?? {}) as SiteExtraSettings

  return (
    <SiteContentPageView
      extra={currentExtra}
      isLoading={isLoading}
      saving={mutation.isPending}
      saveError={saveError}
      saveSuccess={saveSuccess}
      onSave={(extra) => mutation.mutate(extra)}
    />
  )
}
