/**
 * BlockEditorPage — route component for /pages/:pageId/edit and /pages/new.
 *
 * Loads the page (+ its translations) from the backend, parses the
 * existing BlockDocument from `page_translations[n].body`, initialises
 * the editor store, then renders EditorShell.
 */

import { useEffect, useCallback } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { pagesService }            from '@/services/pages.service'
import { pageSectionsService }     from '@/services/pageSectionsService'
import type { PageSection }        from '@/services/pageSectionsService'
import { useEditorStore }          from '@/stores/editor.store'
import { useWebsiteStore }         from '@/stores/website.store'
import { draftMediaStore }         from '@/stores/draftMedia.store'
import { EditorShell }             from './EditorShell'
import { DashboardSkeleton }       from '@/components/atoms/Skeleton'
import type { BlockDocument, Block, ImageBlockData, GalleryBlockData, HeroBlockData } from '@/types/editor.types'

// LOCALE is now driven by the activeSite's default locale or falls back to 'id'.
// TODO: add a locale switcher UI in EditorToolbar to allow editing multiple locales.
const LOCALE = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('locale')) || 'id'

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
  return (
    typeof v === 'object' &&
    v !== null &&
    'version' in v &&
    (v as BlockDocument).version === '1.0' &&
    Array.isArray((v as BlockDocument).blocks)
  )
}

export default function BlockEditorPage() {
  const { pageId } = useParams<{ pageId: string }>()
  const { activeSite } = useWebsiteStore()
  const { init, reset, setPageSeo, blockDoc, pageSeo } = useEditorStore()

  const { data: page, isLoading, error } = useQuery({
    queryKey:  ['page-editor', pageId],
    queryFn:   () => pagesService.getOne(pageId!),
    enabled:   !!pageId,
    staleTime: 0,
  })

  // Initialise editor store when page loads
  useEffect(() => {
    if (!page || !pageId) return

    const translation = (page.page_translations ?? []).find((t) => t.locale === LOCALE)
    const rawBody     = translation?.body

    const doc: BlockDocument = isBlockDocument(rawBody)
      ? rawBody
      : { version: '1.0', locale: LOCALE, blocks: [] }

    init(doc, pageId, LOCALE)
    setPageSeo({
      metaTitle:       translation?.meta_title ?? '',
      metaDescription: translation?.meta_description ?? '',
    })

    // Bug C fix: if no block content exists, migrate legacy page_sections
    if (doc.blocks.length === 0) {
      pageSectionsService.list(pageId).then((sections) => {
        if (sections.length > 0) {
          const migratedBlocks = sections
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(sectionToBlock)
          init({ version: '1.0', locale: LOCALE, blocks: migratedBlocks }, pageId, LOCALE)
        }
      }).catch(() => {
        // Sections fetch failed — leave the editor at empty canvas, not a crash
      })
    }

    return () => { reset() }
  }, [page, pageId, init, reset, setPageSeo])

  // ── Save function ─────────────────────────────────────────────────────────

  const saveFn = useCallback(async () => {
    if (!pageId) return
    const translation = (page?.page_translations ?? []).find((t) => t.locale === LOCALE)
    const title = translation?.title ?? page?.slug ?? ''
    // Resolve any blob: URLs (deferred ImageUploader uploads) before persisting
    const resolvedDoc = await resolveBlockDocMedia(blockDoc)
    await pagesService.update(pageId, {
      translations: [{
        locale: LOCALE,
        title,
        body:             resolvedDoc as unknown as Record<string, unknown>,
        meta_title:       pageSeo.metaTitle || undefined,
        meta_description: pageSeo.metaDescription || undefined,
      }],
    })
  }, [pageId, page, blockDoc, pageSeo])

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

  const translation = (page.page_translations ?? []).find((t) => t.locale === LOCALE)
  const pageTitle   = translation?.title ?? page.slug

  return (
    <EditorShell
      pageTitle={pageTitle}
      pageSlug={page.slug}
      saveFn={saveFn}
      publishFn={publishFn}
    />
  )
}
