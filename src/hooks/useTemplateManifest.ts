/**
 * useTemplateManifest — returns the TemplateManifest for the active site's template.
 *
 * Template slug is stored in `site.settings.template_slug` (Record<string,unknown>).
 * Falls back to null if no site is active or no matching manifest is registered.
 */

import { useMemo } from 'react'
import { useWebsiteStore } from '@/stores/website.store'
import { getTemplateManifest, ALLOWED_TEMPLATES } from '@litostudio/templates'
import type { TemplateManifest } from '@litostudio/templates'

export interface UseTemplateManifestResult {
  manifest:     TemplateManifest | null
  templateSlug: string | null
}

/**
 * Normalise any stored slug to a valid template slug.
 * Exported for reuse outside this hook (e.g. BlockEditorPage).
 *
 * Legacy data stored the *theme* slug (e.g. 'lito-beauty') rather than the
 * *template* slug ('beauty'). We detect these by checking whether the raw value
 * is already a known template, then progressively strip leading segments until
 * we find a match (or return the raw value so the caller can decide the fallback).
 *
 * Examples:
 *   'beauty'       → 'beauty'   (already valid)
 *   'lito-beauty'  → 'beauty'   (legacy theme slug)
 *   'lito-fashion' → 'fashion'  (legacy theme slug)
 *   'lito'         → 'lito'     (valid)
 */
export function normalizeTemplateSlug(raw: string): string {
  const known = new Set<string>(ALLOWED_TEMPLATES)
  if (known.has(raw)) return raw
  // Strip leading 'lito-' prefix: 'lito-beauty' → 'beauty'
  const withoutPrefix = raw.replace(/^lito-?/, '')
  if (withoutPrefix && known.has(withoutPrefix)) return withoutPrefix
  // Last-segment heuristic: 'x-y-beauty' → 'beauty'
  const lastSeg = raw.split('-').pop() ?? raw
  if (lastSeg && known.has(lastSeg)) return lastSeg
  return raw // unknown — return as-is
}

export function useTemplateManifest(): UseTemplateManifestResult {
  const activeSite = useWebsiteStore((s) => s.activeSite)

  return useMemo(() => {
    // Priority:
    //   1. settings.template_slug — written by theme-switch mutations (may be stale on cold load)
    //   2. activeSite.template_slug — direct DB column, always populated at site creation
    // Both are kept in sync by the PATCH /sites/:siteId mutation going forward.
    const settingsSlug = (activeSite?.settings as Record<string, unknown> | undefined)?.template_slug
    const columnSlug   = activeSite?.template_slug
    const rawSlug = (typeof settingsSlug === 'string' && settingsSlug) ? settingsSlug : columnSlug
    if (!rawSlug || typeof rawSlug !== 'string') return { manifest: null, templateSlug: null }

    // Normalise legacy theme slugs (e.g. 'lito-beauty' → 'beauty')
    const slug = normalizeTemplateSlug(rawSlug)
    return { manifest: getTemplateManifest(slug), templateSlug: slug }
  }, [activeSite])
}
