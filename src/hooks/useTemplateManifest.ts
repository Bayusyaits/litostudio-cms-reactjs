/**
 * useTemplateManifest — returns the TemplateManifest for the active site's template.
 *
 * Template slug is stored in `site.settings.template_slug` (Record<string,unknown>).
 * Falls back to null if no site is active or no matching manifest is registered.
 */

import { useMemo } from 'react'
import { useWebsiteStore } from '@/stores/website.store'
import { getTemplateManifest } from '@litostudio/templates'
import type { TemplateManifest } from '@litostudio/templates'

export interface UseTemplateManifestResult {
  manifest:     TemplateManifest | null
  templateSlug: string | null
}

export function useTemplateManifest(): UseTemplateManifestResult {
  const activeSite = useWebsiteStore((s) => s.activeSite)

  return useMemo(() => {
    const slug = (activeSite?.settings as Record<string, unknown> | undefined)?.template_slug
    if (!slug || typeof slug !== 'string') return { manifest: null, templateSlug: null }
    return { manifest: getTemplateManifest(slug), templateSlug: slug }
  }, [activeSite])
}
