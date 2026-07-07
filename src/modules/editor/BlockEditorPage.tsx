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
import { normalizeTemplateSlug }   from '@/hooks/useTemplateManifest'
import { getPageLayout }           from '@/services/pageLayouts.service'
import { getBlockDef, BLOCKS_NOT_PUBLISHED_AS_SECTIONS } from './blocks/blockLibrary'
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
  // Restores styles from s.settings so previously saved padding/color/etc. are preserved.
  const STYLE_KEYS = new Set([
    'backgroundColor', 'textColor', 'textAlign',
    'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
    'marginTop', 'marginBottom',
    'borderRadius', 'borderWidth', 'borderColor',
    'maxWidth', 'minHeight',
  ])
  const restoredStyles: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(s.settings ?? {})) {
    if (STYLE_KEYS.has(k)) restoredStyles[k] = v
  }
  function make<T extends Block['type']>(type: T, data: Record<string, unknown>): Block {
    return { id: s.id, type, data: data as Block['data'], visibility: vis, styles: restoredStyles }
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
      return make('contact', { heading: (p.heading as string) ?? 'Get In Touch', submitText: 'Send Message', fields: (p.fields as unknown[]) ?? [], ...p })

    case 'contact_form':
      return make('contact_form', {
        heading:       (p.heading       as string) ?? 'Get In Touch',
        description:   (p.description   as string) ?? '',
        submitText:    (p.submitText     as string) ?? 'Send Message',
        email:         (p.email         as string) ?? '',
        phone:         (p.phone         as string) ?? '',
        address:       (p.address       as string) ?? '',
        businessHours: (p.businessHours as string) ?? '',
        mapImage:      (p.mapImage      as string) ?? '',
        ...p,
      })

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
      // Use the dedicated 'about' BlockType so the round-trip section_type is preserved.
      // Previously mapped to 'text' which fails the page_sections CHECK constraint on publish.
      return make('about', {
        heading:     (p.heading     as string) ?? (p.title as string) ?? 'About',
        description: (p.description as string) ?? '',
        image:       (p.image       as string) ?? '',
        ctaText:     (p.ctaText     as string) ?? '',
        ctaUrl:      (p.ctaUrl      as string) ?? '',
        since:       (p.since       as string) ?? '',
        cities:      (p.cities      as string) ?? '',
        ...p,
      })

    case 'about_cta':
      return make('about_cta', {
        eyebrow:  (p.eyebrow  as string) ?? '',
        title:    (p.title    as string) ?? (p.heading as string) ?? '',
        desc:     (p.desc     as string) ?? (p.description as string) ?? '',
        ctaText:  (p.ctaText  as string) ?? '',
        ctaLink:  (p.ctaLink  as string) ?? (p.ctaUrl as string) ?? '',
        ...p,
      })

    case 'brand_story':
      return make('brand_story', {
        eyebrow:          (p.eyebrow          as string)   ?? '',
        heading:          (p.heading          as string)   ?? (p.title as string) ?? '',
        title:            (p.title            as string)   ?? (p.heading as string) ?? '',
        description:      (p.description      as string)   ?? '',
        image:            (p.image            as string)   ?? '',
        ctaText:          (p.ctaText          as string)   ?? '',
        ctaUrl:           (p.ctaUrl           as string)   ?? '',
        ctaVariant:       (p.ctaVariant       as string)   ?? '',
        since:            (p.since            as string)   ?? '',
        yearsStrongLabel: (p.yearsStrongLabel as string)   ?? '',
        missionLabel:     (p.missionLabel     as string)   ?? '',
        values:           (p.values           as string[]) ?? [],
        ...p,
      })

    case 'destinations':
    case 'story_map':
      return make('destinations_grid', {
        heading: (p.heading as string) ?? '',
        items:   (p.items   as unknown[]) ?? [],
        columns: 3,
        ...p,
      })

    case 'portfolio':
      return make('portfolio', {
        heading: (p.heading as string) ?? '',
        items:   (p.items   as unknown[]) ?? [],
        columns: 3,
        ...p,
      })

    case 'stories':
    case 'featured_stories':
    case 'featured_content':
      return make('story', {
        heading: (p.heading as string) ?? '',
        limit:   (p.limit   as number) ?? 6,
        layout:  'grid',
        ...p,
      })

    case 'campaign':
    case 'campaign_banner':
      return make('campaign_banner', {
        heading:         (p.heading         as string) ?? '',
        description:     (p.description     as string) ?? '',
        backgroundImage: (p.backgroundImage as string) ?? (p.image as string) ?? '',
        buttonText:      (p.ctaText         as string) ?? '',
        primaryLink:     (p.ctaUrl          as string) ?? '',
        ...p,
      })

    case 'story_categories':
      return make('story_categories', {
        heading:       (p.heading       as string) ?? '',
        sectionLabel:  (p.sectionLabel  as string) ?? '',
        sectionNumber: (p.sectionNumber as string) ?? '',
        limit:         (p.limit         as number) ?? 6,
        ...p,
      })

    case 'page_hero':
      return make('page_hero', {
        eyebrow:  (p.eyebrow  as string) ?? '',
        title:    (p.title    as string) ?? '',
        desc:     (p.desc     as string) ?? (p.description as string) ?? '',
        imgSrc:   (p.imgSrc   as string) ?? (p.image as string) ?? '',
        imgAlt:   (p.imgAlt   as string) ?? '',
        ctaLabel: (p.ctaLabel as string) ?? (p.ctaText as string) ?? '',
        ctaHref:  (p.ctaHref  as string) ?? (p.ctaUrl  as string) ?? '',
        ...p,
      })

    case 'contact_cta':
      return make('contact_cta', {
        eyebrow:  (p.eyebrow  as string) ?? '',
        title:    (p.title    as string) ?? '',
        desc:     (p.desc     as string) ?? (p.description as string) ?? '',
        email:    (p.email    as string) ?? '',
        ctaText:  (p.ctaText  as string) ?? '',
        ctaLink:  (p.ctaLink  as string) ?? (p.ctaUrl as string) ?? '',
        homeText: (p.homeText as string) ?? '',
        homeLink: (p.homeLink as string) ?? '/',
        ...p,
      })

    case 'contact_cards':
      return make('contact_cards', {
        heading: (p.heading as string) ?? '',
        items:   (p.items   as unknown[]) ?? [],
        ...p,
      })

    // ── Fashion-specific sections ─────────────────────────────────────────
    case 'timeline':
      return make('timeline', { heading: (p.heading as string) ?? '', items: (p.items as unknown[]) ?? [], ...p })

    case 'new_arrival':
      return make('new_arrival', {
        title:         (p.title         as string) ?? (p.heading as string) ?? '',
        catalogueText: (p.catalogueText as string) ?? (p.catalogueLabel as string) ?? '',
        catalogueLink: (p.catalogueLink as string) ?? '',
        items:         (p.items         as unknown[]) ?? [],
        ...p,
      })

    case 'promo_banners':
      return make('promo_banners', { items: (p.items as unknown[]) ?? [], ...p })

    case 'product_carousel':
      return make('product_carousel', { heading: (p.heading as string) ?? '', items: (p.items as unknown[]) ?? [], ...p })

    case 'marquee':
      return make('marquee', { items: (p.items as string[]) ?? [], ...p })

    case 'lookbook':
      return make('lookbook', { heading: (p.heading as string) ?? '', items: (p.items as unknown[]) ?? [], ...p })

    case 'collaborations':
      return make('collaborations', { heading: (p.heading as string) ?? '', items: (p.items as unknown[]) ?? [], ...p })

    case 'social_grid':
      return make('social_grid', { heading: (p.heading as string) ?? '', ...p })

    case 'philosophy':
      return make('philosophy', { heading: (p.heading as string) ?? '', items: (p.items as unknown[]) ?? [], ...p })

    case 'rich_text':
      return make('rich_text', { html: (p.html as string) ?? '', ...p })

    // ── Beauty-specific sections ──────────────────────────────────────────
    case 'collection_banner':
      return make('collection_banner', {
        heading:         (p.heading         as string) ?? '',
        description:     (p.description     as string) ?? '',
        backgroundImage: (p.backgroundImage as string) ?? (p.image as string) ?? '',
        ctaText:         (p.ctaText         as string) ?? '',
        ctaUrl:          (p.ctaUrl          as string) ?? '',
        ...p,
      })

    case 'product_benefits':
      return make('product_benefits', { heading: (p.heading as string) ?? '', items: (p.items as unknown[]) ?? [], ...p })

    case 'product_categories':
      return make('product_categories', { heading: (p.heading as string) ?? '', items: (p.items as unknown[]) ?? [], ...p })

    case 'founder_quote':
      return make('founder_quote', {
        quote:       (p.quote       as string) ?? '',
        // canonical: founderName; accept legacy 'author' alias from older DB rows
        founderName: (p.founderName as string) ?? (p.author as string) ?? '',
        founderRole: (p.founderRole as string) ?? (p.role   as string) ?? '',
        image:       (p.image       as string) ?? '',
        ...p,
      })

    case 'blog_highlight':
      return make('blog_highlight', { heading: (p.heading as string) ?? '', count: (p.count as number) ?? 3, ...p })

    case 'featured_products':
      return make('featured_products', { heading: (p.heading as string) ?? '', items: (p.items as unknown[]) ?? [], ...p })

    // ── Fashion-new: Stores section (FIX-08) ─────────────────────────────
    case 'stores':
      return make('stores', {
        eyebrow: (p.eyebrow as string) ?? '',
        heading: (p.heading as string) ?? 'Find us near you',
        items:   (p.items   as unknown[]) ?? [],
        ...p,
      })

    default:
      // Unknown section type: render as a labelled heading so it's visible
      // in the editor but doesn't break publish (heading is skipped by sync mapping).
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

    // ── Template & page identification (shared by migration + seeding) ─────────
    const settings        = activeSite?.settings as Record<string, unknown> | null | undefined
    const rawTemplateSlug = (settings?.template_slug as string | undefined)
                         ?? (activeSite?.template_slug ?? '')
    const templateSlug    = rawTemplateSlug ? normalizeTemplateSlug(rawTemplateSlug) : ''
    const orgId           = activeSite?.organization_id ?? ''
    const pageSlug        = page.slug ?? ''

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

    // ── Lito listing page migration ──────────────────────────────────────────
    // Pages saved before the lito_*_listing refactor still contain the OLD
    // multi-block structure (hero + destinations_grid + map, etc.).
    // Because doc.blocks.length > 0 the blank-canvas seeding below is skipped,
    // so old blocks persist indefinitely.  This migration detects that condition
    // and transparently replaces the old blocks with the new single listing block
    // on every page load — before the user ever has to touch anything.
    // Once the user saves the page the new block is persisted and this migration
    // becomes a no-op (LITO_NEW_BLOCK_TYPES.has() returns true).
    const LITO_LISTING_SLUGS   = new Set(['destinations', 'stories', 'journal', 'gallery'])
    const LITO_NEW_BLOCK_TYPES = new Set([
      'lito_destinations_listing', 'lito_stories_listing',
      'lito_journal_listing',      'lito_gallery_listing',
    ])
    const effectiveSlugForMigration = templateSlug || 'lito'
    if (
      doc.blocks.length > 0 &&
      effectiveSlugForMigration === 'lito' &&
      pageSlug &&
      (LITO_LISTING_SLUGS.has(pageSlug) || LITO_LISTING_SLUGS.has(normaliseSlug(pageSlug))) &&
      !doc.blocks.some(b => (LITO_NEW_BLOCK_TYPES as Set<string>).has(b.type))
    ) {
      // Also clear any stale localStorage draft that might contain old blocks
      try { localStorage.removeItem(`editor_draft_${pageId}`) } catch { /* ignore */ }
      tryStaticDefaults(effectiveSlugForMigration, pageSlug)
    }

    // Seeding priority (only when canvas is empty — no existing saved blocks):
    //   1. Legacy page_sections migration
    //   2. page_layouts DB override (per-org customised defaults)
    //   3. PAGE_DEFAULTS_REGISTRY (static in-package defaults keyed by template + pageSlug)
    if (doc.blocks.length === 0) {
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

      // ── E-04: Restore from localStorage draft backup ────────────────────
      // Runs BEFORE doSeed() so a draft always wins over seeded defaults.
      // The draft is written by EditorShell on every dirty change.
      const restoreFromDraft = (): boolean => {
        try {
          const raw = localStorage.getItem(`editor_draft_${pageId}`)
          if (!raw) return false
          const { blockDoc: draftDoc, savedAt } = JSON.parse(raw) as {
            blockDoc: BlockDocument
            savedAt:  number
          }
          // Ignore drafts older than 7 days
          if (Date.now() - savedAt > 7 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(`editor_draft_${pageId}`)
            return false
          }
          if (!isBlockDocument(draftDoc) || draftDoc.blocks.length === 0) return false
          init(draftDoc, pageId, locale)
          return true
        } catch {
          return false
        }
      }

      // Only restore draft if the saved version has no blocks (blank canvas)
      if (doc.blocks.length === 0 && restoreFromDraft()) return

      doSeed()
    }

    return () => {
      mounted = false
      reset()
    }
  }, [page, pageId, init, reset, setPageSeo, activeSite, locale])

  // ── Google Fonts injection — keeps canvas fonts in sync with active template ─

  useEffect(() => {
    const settings           = activeSite?.settings as Record<string, unknown> | null | undefined
    const rawTemplateSlug2   = (settings?.template_slug as string | undefined)
                            ?? (activeSite?.template_slug ?? 'lito')
    const templateSlug       = normalizeTemplateSlug(rawTemplateSlug2 || 'lito')
    const tokens             = getCanvasTokens(templateSlug)
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

  // ── Unpublish function ────────────────────────────────────────────────────

  const unpublishFn = useCallback(async () => {
    if (pageId) {
      await pagesService.update(pageId, { status: 'draft' })
      qc.invalidateQueries({ queryKey: ['page-editor', pageId] })
    }
  }, [pageId, qc])

  // ── Publish function ──────────────────────────────────────────────────────

  const publishFn = useCallback(async () => {
    // 0. Warn the editor if any block on the page will not appear on the live
    //    site. image/video/button/spacer/divider blocks render fine here in
    //    the canvas but are intentionally NOT written to page_sections by the
    //    backend sync bridge (they're meant to live inside a composite block,
    //    not stand alone) — see BLOCKS_NOT_PUBLISHED_AS_SECTIONS. Previously
    //    this failed silently; the editor had no way to know (2026-07-05 audit fix).
    const droppedBlocks = blockDoc.blocks.filter((b) =>
      (BLOCKS_NOT_PUBLISHED_AS_SECTIONS as readonly string[]).includes(b.type),
    )
    if (droppedBlocks.length > 0) {
      const summary = droppedBlocks
        .map((b) => getBlockDef(b.type)?.label ?? b.type)
        .join(', ')
      const proceed = window.confirm(
        `${droppedBlocks.length} block${droppedBlocks.length > 1 ? 's' : ''} on this page ` +
        `(${summary}) will NOT appear on the published website — standalone ` +
        `${summary} blocks aren't rendered as page sections.\n\n` +
        `Publish anyway?`,
      )
      if (!proceed) return
    }

    // 1. Persist the current blockDoc to page_translations.body
    await saveFn()

    if (pageId) {
      // 2. Sync blocks → page_sections so the website's DynamicSectionRenderer
      //    picks up the published content (BUG-002 fix).
      //    Failures here are non-fatal — page_translations.body is the source of truth.
      const blocks = blockDoc.blocks.map((b) => ({
        id:         b.id,
        type:       b.type,
        data:       b.data as Record<string, unknown>,
        styles:     b.styles as Record<string, unknown> | undefined,
        animation:  b.animation as Record<string, unknown> | undefined,
        visibility: b.visibility,
        name:       b.name,
      }))
      try {
        await pagesService.syncSections(pageId, blocks)
      } catch (err) {
        console.warn('[publishFn] page_sections sync failed — content still saved to translations.body', err)
      }

      // 3. Set page status to active (published)
      await pagesService.update(pageId, { status: 'active' })
    }
  }, [pageId, blockDoc, saveFn])

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
      pageStatus={page.status}
      saveFn={saveFn}
      publishFn={publishFn}
      unpublishFn={unpublishFn}
      activeLocale={locale}
      onLocaleChange={setLocale}
    />
  )
}
