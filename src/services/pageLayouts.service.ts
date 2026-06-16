/**
 * pageLayouts.service.ts
 *
 * CMS client for the page_layouts table via the backend API.
 * Provides per-organisation Block[] overrides for (template, page) pairs.
 *
 * Priority chain in BlockEditorPage:
 *   1. Existing page_translations.body (saved editor state)
 *   2. page_layouts row for this org (DB override of static defaults)
 *   3. PAGE_DEFAULTS_REGISTRY (static in-package defaults)
 *   4. Empty canvas
 *
 * Backend routes (NestJS):
 *   GET    /api/v1/cms/templates/:templateSlug/layouts/:pageSlug?orgId=...
 *   PUT    /api/v1/cms/templates/:templateSlug/layouts/:pageSlug
 *   DELETE /api/v1/cms/templates/:templateSlug/layouts/:pageSlug?orgId=...
 */

import { http } from '@/lib/http'
import type { PageDefaultBlock } from '@litostudio/templates'

const BASE = '/api/v1/cms/templates'

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Fetch the layout override for a (org, template, page) tuple.
 * Returns null when no override exists — caller falls back to static defaults.
 */
export async function getPageLayout(
  organizationId: string,
  templateSlug:   string,
  pageSlug:       string,
): Promise<PageDefaultBlock[] | null> {
  try {
    const data = await http.get<{ blocks: PageDefaultBlock[] }>(
      `${BASE}/${templateSlug}/layouts/${pageSlug}`,
      { params: { orgId: organizationId } },
    )
    return data?.blocks ?? null
  } catch {
    // 404 = no override, any other error = treat as no override
    return null
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Upsert a layout override.
 */
export async function upsertPageLayout(
  organizationId: string,
  templateSlug:   string,
  pageSlug:       string,
  blocks:         PageDefaultBlock[],
): Promise<void> {
  await http.put(
    `${BASE}/${templateSlug}/layouts/${pageSlug}`,
    { organization_id: organizationId, blocks },
  )
}

/**
 * Delete a layout override, restoring static defaults for that page.
 */
export async function deletePageLayout(
  organizationId: string,
  templateSlug:   string,
  pageSlug:       string,
): Promise<void> {
  await http.delete(
    `${BASE}/${templateSlug}/layouts/${pageSlug}`,
    { params: { orgId: organizationId } },
  )
}
