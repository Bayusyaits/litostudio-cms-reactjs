/**
 * BlockEditorPage — route component for /pages/:pageId/edit and /pages/new.
 *
 * Loads the page (+ its translations) from the backend, parses the
 * existing BlockDocument from `page_translations[n].body`, initialises
 * the editor store, then renders EditorShell.
 */

import { useEffect, useCallback, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { pagesService }            from '@/services/pages.service'
import { pageSectionsService }     from '@/services/pageSectionsService'
import type { PageSection }        from '@/services/pageSectionsService'
import { useEditorStore }          from '@/stores/editor.store'
import { useWebsiteStore }         from '@/stores/website.store'
import { draftMediaStore }         from '@/stores/draftMedia.store'
import { getPageDefaults }         from '@litostudio/templates'
import { getCanvasTokens }         from './templateCanvasTokens'
import { getPageLayout }           from '@/services/pageLayouts.service'
import { EditorShell }             from './EditorShell'
import type { SupportedLocale }    from './EditorToolbar'
import { DashboardSkeleton }       from '@/components/atoms/Skeleton'
import type { BlockDocument, Block, ImageBlockData, GalleryBlockData, HeroBlockData } from '@/types/editor.types'

/** Generate a short random ID — same as patternLibrary uid() */
function uid() { return Math.random().toString(36).slice(2, 10) }

/** Initial locale from URL param, falls back to 'id' */
function getInitialLocale(): SupportedLocale {
  const param = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('locale')
    : null
  return (param === 'en' || param === 'id') ? param : 'id'
}

/** Walk the BlockDocument and resolve any blob: URLs to CDN URLs before save. */
async function resolveBlockDocMedia(doc: BlockDocument): Promise<BlockDocument> {
  const resolved = await Promise.all(
    doc.blocks.map(async (block: Block): Promise<Block> => {
      switch (block.type) {
        case 'image': {
          const d = block.data as ImageBlockData
          if (d.src?.startsWith('blob:')) {
            return { ...block, data: { ...d, src: await draftMediaStore.resolveUrl(d.src) } }
          }
          return block
        }
        case 'gallery': {
          const d = block.data as GalleryBlockData
          const images = await Promise.all(
            d.images.map(async (img) =>
              img.src?.startsWith('blob:')
                ? { ...img, src: await draftMediaStore.resolveUrl(img.src) }
                : img,
            ),
          )
          return { ...block, data: { ...d, images } }
        }
        case 'hero': {
          const d = block.data as HeroBlockData
          if (d.backgroundImage?.startsWith('blob:')) {
            return { ...block, data: { ...d, backgroundImage: await draftMediaStore.resolveUrl(d.backgroundImage) } }
          }
          return block
        }
        default:
          return block
      }
    }),
  )
  return { ...doc, blocks: resolved }
}

// ── Section → Block migration ─────────────────────────────────────────────────

/**
 * Convert a legacy PageSection to a Block for the Block Editor.
 * Used as a one-time migration when a page has no BlockDocument body yet.
 */
function sectionToBlock(s: PageSection): Block {
  const vis = { desktop: s.is_visible, tablet: s.is_visible, mobile: s.is_visible }
  const p = s.props ?? {}

  // Helper: cast legacy props to a typed Block — legacy data may be partial/mismatched,
  // each block renderer is already defensive about missing fields.
  function make<T extends Block['type']>(type: T, data: Record<string, unknown>): Block {
    return { id: s.id, type, data: data as Block['data'], visibility: vis, styles: {} }
  }

  switch (s.section_type) {
    case 'hero':
      return make('hero', { title: (p.title as string) ?? 'Hero', subtitle: (p.subtitle as string) ?? '', ctaText: (p.ctaText as string) ?? '', ctaUrl: (p.ctaUrl as string) ?? '', align: 'center', backgroundOverlay: 40, ...p })

    case 'services':
    case 'offerings':
      return make('services', { items: (p.items as unknown[]) ?? [], columns: 3, ...p })

    case 'gallery':
    case 'selected_works':
      return make('gallery', { images: (p.images as unknown[]) ?? [], columns: 3, ...p })

    case 'testimonials':
    case 'client_reviews':
      return make('testimonials', { heading: (p.heading as string) ?? 'Testimonials', layout: 'grid', items: (p.items as unknown[]) ?? [], ...p })

    case 'contact':
      return make('contact_form', { heading: (p.heading as string) ?? 'Get In Touch', submitText: 'Send Message', fields: (p.fields as unknown[]) ?? [], ...p })

    case 'journal':
    case 'latest_journal':
      return make('journal', { heading: (p.heading as string) ?? 'Latest Stories', count: (p.count as number) ?? 3, ...p })

    case 'faq':
      return make('faq', { heading: (p.heading as string) ?? 'FAQ', items: (p.items as unknown[]) ?? [], ...p })

    case 'team':
      return make('team', { heading: (p.heading as string) ?? 'Our Team', members: (p.members as unknown[]) ?? [], ...p })

    case 'map':
      return make('map', { lat: (p.lat as number) ?? 0, lng: (p.lng as number) ?? 0, zoom: 14, ...p })

    case 'custom_html':
      return make('html', { html: (p.html as string) ?? '' })

    case 'newsletter':
      return make('newsletter', { heading: (p.heading as string) ?? 'Stay in Touch', placeholder: 'Your email address', buttonText: 'Subscribe', ...p })

    case 'pricing':
      return make('pricing', { heading: (p.heading as string) ?? 'Pricing', plans: (p.plans as unknown[]) ?? [], ...p })

    case 'about':
    case 'about_cta':
    case 'brand_story':
      return make('text', { html: `<h2>${(p.title as string) ?? s.section_type}</h2><p>${(p.description as string) ?? ''}</p>` })

    default:
      return make('heading', { level: 2, text: (s.name ?? s.section_type).replace(/_/g, ' ') })
  }
}

function isBlockDocument(v: unknown): v is BlockDocument {
  // Accept any object with a `blocks` array — version field is optional
  // (older saves may not have version: '1.0' but are still valid)
  return (
    typeof v === 'object' &&
    v !== null &&
    Array.isArray((v as BlockDocument).blocks)
  )
}

export default function BlockEditorPage() {
  const { pageId } = useParams<{ pageId: string }>()
  const { activeSite } = useWebsiteStore()
  const { init, reset, setPageSeo, blockDoc, pageSeo } = useEditorStore()
  const qc = useQueryClient()
  const [locale, setLocale] = useState<SupportedLocale>(getInitialLocale)

  const { data: page, isLoading, error } = useQuery({
    queryKey:  ['page-editor', pageId],
    queryFn:   () => pagesService.getOne(pageId!),
    enabled:   !!pageId,
    staleTime: 0,
  })

  // Initialise editor store when page loads
  useEffect(() => {
    if (!page || !pageId) return

    // Guard against stale async callbacks after unmount / page change
    let mounted = true

    const translation = (page.page_translations ?? []).find((t) => t.locale === locale)
    const rawBody     = translation?.body

    const doc: BlockDocument = isBlockDocument(rawBody)
      ? { ...(rawBody as BlockDocument), version: '1.0', locale: locale }   // normalise: ensure version field
      : { version: '1.0', locale: locale, blocks: [] }

    init(doc, pageId, locale)
    setPageSeo({
      metaTitle:       translation?.meta_title ?? '',
      metaDescription: translation?.meta_description ?? '',
    })

    // Seeding priority (only when canvas is empty — no existing saved blocks):
    //   1. Legacy page_sections migration
    //   2. page_layouts DB override (per-org customised defaults)
    //   3. PAGE_DEFAULTS_REGISTRY (static in-package defaults keyed by template + pageSlug)
    if (doc.blocks.length === 0) {
      // Read template_slug safely — settings is Record<string,unknown>
      const settings     = activeSite?.settings as Record<string, unknown> | null | undefined
      const templateSlug = (settings?.template_slug as string | undefined) ?? ''
      const orgId        = activeSite?.organization_id ?? ''
      const pageSlug     = page.slug ?? ''

      /** Convert slug variants: 'home-page' → 'home', 'about-us' → 'about' */
      function normaliseSlug(s: string): string {
        return s.split('-')[0] ?? s
      }

      /** Seed blocks from a PageDefaultBlock[] array — fresh IDs each time */
      const seedFromDefaults = (defaults: Array<{ id: string; type: string; data: Record<string, unknown>; styles?: Record<string, unknown>; locked?: boolean; name?: string; visibility?: { desktop?: boolean; tablet?: boolean; mobile?: boolean } }>) => {
        if (!mounted) return
        const seededBlocks: Block[] = defaults.map((d) => ({
          ...d,
          id:   uid(),
          type: d.type as Block['type'],
          data: d.data  as Block['data'],
        }))
        if (seededBlocks.length > 0) {
          init({ version: '1.0', locale: locale, blocks: seededBlocks }, pageId, locale)
        }
      }

      /** Try static package defaults — also tries normalised slug as fallback */
      const tryStaticDefaults = (tplSlug: string, pgSlug: string): boolean => {
        const d = getPageDefaults(tplSlug, pgSlug, locale) ?? getPageDefaults(tplSlug, normaliseSlug(pgSlug), locale)
        if (d && d.length > 0) { seedFromDefaults(d); return true }
        return false
      }

      const doSeed = async () => {
        // 1. Legacy sections
        let sections: Awaited<ReturnType<typeof pageSectionsService.list>> = []
        try { sections = await pageSectionsService.list(pageId) } catch { /* ignore */ }

        if (!mounted) return

        if (sections.length > 0) {
          const migratedBlocks = sections
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(sectionToBlock)
          init({ version: '1.0', locale: locale, blocks: migratedBlocks }, pageId, locale)
          return
        }

        // Without a template slug we can still try by falling through to static defaults
        // using the page slug alone (each template shares common page slugs like 'home').
        const effectiveSlug = templateSlug || 'lito'   // default to lito if not set

        if (!pageSlug) return

        // 2. DB override (page_layouts)
        if (orgId && templateSlug) {
          try {
            const dbLayout = await getPageLayout(orgId, effectiveSlug, pageSlug)
            if (!mounted) return
            if (dbLayout && dbLayout.length > 0) { seedFromDefaults(dbLayout); return }
          } catch { /* ignore */ }
        }

        // 3. Static package defaults (try exact slug, then normalised slug)
        tryStaticDefaults(effectiveSlug, pageSlug)
      }

      doSeed()
    }

    return () => {
      mounted = false
      reset()
    }
  }, [page, pageId, init, reset, setPageSeo, activeSite, locale])

  // ── Google Fonts injection — keeps canvas fonts in sync with active template ─

  useEffect(() => {
    const settings    = activeSite?.settings as Record<string, unknown> | null | undefined
    const templateSlug = (settings?.template_slug as string | undefined) ?? 'lito'
    const tokens      = getCanvasTokens(templateSlug)
    if (!tokens.fontUrl) return

    const LINK_ID = 'cms-editor-font-link'
    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null

    if (!link) {
      link = document.createElement('link')
      link.id   = LINK_ID
      link.rel  = 'stylesheet'
      document.head.appendChild(link)
    }

    // Only update href when URL changes (avoids flicker on re-render)
    if (link.href !== tokens.fontUrl) {
      link.href = tokens.fontUrl
    }

    return () => {
      // Clean up on unmount so fonts don't leak into other CMS pages
      document.getElementById(LINK_ID)?.remove()
    }
  }, [activeSite])

  // ── Save function ─────────────────────────────────────────────────────────

  const saveFn = useCallback(async () => {
    if (!pageId) return
    const translation = (page?.page_translations ?? []).find((t) => t.locale === locale)
    const title = translation?.title ?? page?.slug ?? ''
    // Resolve any blob: URLs (deferred ImageUploader uploads) before persisting
    const resolvedDoc = await resolveBlockDocMedia(blockDoc)
    await pagesService.update(pageId, {
      translations: [{
        locale: locale,
        title,
        body:             resolvedDoc as unknown as Record<string, unknown>,
        meta_title:       pageSeo.metaTitle || undefined,
        meta_description: pageSeo.metaDescription || undefined,
      }],
    })
    // Invalidate cache so re-opening the editor fetches fresh content from DB
    qc.invalidateQueries({ queryKey: ['page-editor', pageId] })
  }, [pageId, page, blockDoc, pageSeo, qc])

  // ── Publish function ──────────────────────────────────────────────────────

  const publishFn = useCallback(async () => {
    await saveFn()
    if (pageId) await pagesService.update(pageId, { status: 'active' })
  }, [pageId, saveFn])

  // ── Guards ────────────────────────────────────────────────────────────────

  if (!pageId)     return <Navigate to="/pages" replace />
  if (!activeSite) return <Navigate to="/organizations" replace />

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--cms-main-bg)]">
        <div className="w-full max-w-xl p-6"><DashboardSkeleton /></div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--cms-main-bg)]">
        <div className="text-center space-y-2">
          <p className="font-display text-lg font-semibold text-[var(--text-primary)]">Page not found</p>
          <p className="font-body text-sm text-[var(--text-muted)]">
            The page "{pageId}" could not be loaded.
          </p>
          <a href="/pages" className="font-body text-sm text-[var(--lito-teal)] underline">
            ← Back to pages
          </a>
        </div>
      </div>
    )
  }

  const translation = (page.page_translations ?? []).find((t) => t.locale === locale)
  const pageTitle   = translation?.title ?? page.slug

  return (
    <EditorShell
      pageTitle={pageTitle}
      pageId={pageId}
      pageSlug={page.slug}
      saveFn={saveFn}
      publishFn={publishFn}
      activeLocale={locale}
      onLocaleChange={setLocale}
    />
  )
}
