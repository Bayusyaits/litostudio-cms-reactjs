/**
 * SimpleContentEditorPage — Editor A (Shopify-style simple content editor).
 *
 * Handles 7 content modules:
 *   stories, journal, services, destinations, products, collections, campaigns
 *
 * Routes:
 *   /:module/new        → CREATE mode  (POST entity → navigate to /:module/:id/edit)
 *   /:module/:id/edit   → EDIT mode    (load entity, PUT translation + PATCH entity)
 *
 * Special cases:
 *   - destinations: upsertTranslation sends { name, description } not { title, excerpt }
 *   - products:     entity.name = title (required on entity); product_type required
 *   - collections:  entity.name = title (required on entity)
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  storiesService,
  journalService,
  servicesService,
  destinationsService,
  productsService,
  collectionsService,
  campaignsService,
} from '@/services/content.service'
import { useWebsiteStore }                   from '@/stores/website.store'
import { formatRelative }                    from '@/lib/utils'

import { ContentEditorLayout }                   from '@/components/organisms/ContentEditorLayout'
import { RichTextEditor, encodeBody, decodeBody } from '@/components/molecules/RichTextEditor'
import { ImageUploader }                          from '@/components/molecules/ImageUploader'
import { SeoCard }                                from '@/components/molecules/SeoCard'
import { PublishCard }                            from '@/components/molecules/PublishCard'
import { TagInput }                               from '@/components/molecules/TagInput'
import { FormField, TextAreaField }               from '@/components/molecules/FormField'
import { DashboardSkeleton }                      from '@/components/atoms/Skeleton'
import { Switch }                                 from '@/components/atoms/Switch'

import type { ContentStatus }  from '@/types/api.types'
import type {
  Story, JournalPost, Service, Destination, Product, Collection, Campaign, ProductType,
} from '@/types/content.types'

// ── Types ──────────────────────────────────────────────────────────────────

type SimpleModule =
  | 'stories' | 'journal' | 'services' | 'destinations'
  | 'products' | 'collections' | 'campaigns'

type AnyEntity = Story | JournalPost | Service | Destination | Product | Collection | Campaign

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyService = any

const LOCALE = 'id'

const MODULE_CONFIG: Record<SimpleModule, { label: string; service: AnyService }> = {
  stories:      { label: 'Story',        service: storiesService      },
  journal:      { label: 'Journal Post', service: journalService      },
  services:     { label: 'Service',      service: servicesService     },
  destinations: { label: 'Destination',  service: destinationsService },
  products:     { label: 'Product',      service: productsService     },
  collections:  { label: 'Collection',   service: collectionsService  },
  campaigns:    { label: 'Campaign',     service: campaignsService    },
}

// ── Pure helpers ───────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 100)
}

function getCoverImage(e: AnyEntity): string {
  return (e as { cover_image?: string | null }).cover_image ?? ''
}

function getEntitySlug(e: AnyEntity): string {
  return (e as { slug?: string }).slug ?? ''
}

function getEntityTranslation(e: AnyEntity, module: SimpleModule) {
  const translations = ((e as unknown as Record<string, unknown>).translations as Record<string, unknown>[] | undefined) ?? []
  const t = translations.find((tr) => tr.locale === LOCALE) ?? translations[0]
  if (!t) return null
  const isDest      = module === 'destinations'
  // products, collections, and services (stored in products table) use `name` in their translation tables
  const isNameBased = module === 'products' || module === 'collections' || module === 'services'
  return {
    displayTitle: isDest
      ? ((t.name as string) ?? (t.title as string) ?? '')
      : isNameBased
        ? ((t.name as string) ?? '')
        : ((t.title as string) ?? ''),
    displayExcerpt:   isDest ? ((t.description as string) ?? (t.excerpt as string) ?? '') : ((t.excerpt as string) ?? ''),
    body:             t.body,
    meta_title:       (t.meta_title       as string) ?? '',
    meta_description: (t.meta_description as string) ?? '',
  }
}

function getModuleExtras(e: AnyEntity, module: SimpleModule): Record<string, unknown> {
  switch (module) {
    case 'stories': {
      const s = e as Story
      return { category: s.category ?? '', location: s.location ?? '', region: s.region ?? '', isFeatured: s.is_featured ?? false }
    }
    case 'journal': {
      const j = e as JournalPost
      return { category: j.category ?? '', isFeatured: j.is_featured ?? false }
    }
    case 'services': {
      const sv = e as Service
      // category + duration are stored in extra JSONB (products table has no dedicated columns)
      const ext = ((sv as unknown as { extra?: Record<string, unknown> }).extra) ?? {}
      return {
        category:   (ext.category ?? sv.category  ?? '') as string,
        price:      String(sv.price ?? ''),
        currency:   (sv.currency ?? 'IDR') as string,
        duration:   (ext.duration ?? sv.duration  ?? '') as string,
        isFeatured: sv.is_featured ?? false,
      }
    }
    case 'destinations': {
      const d = e as Destination
      return { island: d.island ?? '', region: d.region ?? '', province: d.province ?? '', country: d.country ?? '', lat: d.lat ?? '', lng: d.lng ?? '', isFeatured: d.is_featured ?? false }
    }
    case 'products': {
      const p = e as Product
      return { productType: p.product_type ?? 'product', price: p.price ?? '', isFeatured: (p as { is_featured?: boolean }).is_featured ?? false }
    }
    case 'collections': {
      return {}
    }
    case 'campaigns': {
      const c = e as Campaign
      return { ctaLabel: c.cta_label ?? '', ctaUrl: c.cta_url ?? '', startDate: c.start_date ?? '', endDate: c.end_date ?? '', isFeatured: c.is_featured ?? false }
    }
  }
}

function buildTranslationPayload(
  module: SimpleModule,
  title: string, excerpt: string, body: string,
  metaTitle: string, metaDesc: string,
): Record<string, unknown> {
  const common: Record<string, unknown> = {
    body:             encodeBody(body),
    meta_title:       metaTitle || undefined,
    meta_description: metaDesc  || undefined,
  }
  // destinations → name + description (destination_translations schema)
  if (module === 'destinations') return { ...common, name: title, description: excerpt || undefined }
  // products, services, collections → translation tables use `name` not `title`
  // (product_translations, collection_translations both have `name` column, no `title`)
  if (module === 'products' || module === 'services' || module === 'collections') {
    return { ...common, name: title, excerpt: excerpt || undefined }
  }
  // stories, journal, campaigns → translation tables use `title`
  return { ...common, title, excerpt: excerpt || undefined }
}

function buildCreatePayload(
  module: SimpleModule,
  slug: string, title: string, excerpt: string, body: string,
  coverImage: string | null, tags: string[], status: ContentStatus,
  extras: Record<string, unknown>, siteId: string,
): Record<string, unknown> {
  const base: Record<string, unknown> = { site_id: siteId, slug, cover_image: coverImage || undefined, status }
  switch (module) {
    case 'stories':
      return { ...base, category: extras.category || undefined, location: extras.location || undefined, region: extras.region || undefined, is_featured: extras.isFeatured ?? false, tags, translation: { locale: LOCALE, title, excerpt: excerpt || undefined, body: encodeBody(body) } }
    case 'journal':
      return { ...base, category: extras.category || undefined, is_featured: extras.isFeatured ?? false, translation: { locale: LOCALE, title, excerpt: excerpt || undefined, body: encodeBody(body) } }
    case 'services':
      return { ...base, product_type: 'service', price: extras.price ? Number(extras.price) : undefined, currency: extras.currency || undefined, is_featured: extras.isFeatured ?? false, extra: { category: extras.category || undefined, duration: extras.duration || undefined } }
    case 'destinations':
      return { ...base, island: extras.island || undefined, region: extras.region || undefined, province: extras.province || undefined, country: extras.country || undefined, lat: extras.lat ? Number(extras.lat) : undefined, lng: extras.lng ? Number(extras.lng) : undefined, is_featured: extras.isFeatured ?? false, translation: { locale: LOCALE, name: title, description: excerpt || undefined } }
    case 'products':
      return { ...base, product_type: (extras.productType as ProductType) || 'product', price: extras.price ? Number(extras.price) : undefined, is_featured: extras.isFeatured ?? false }
    case 'collections':
      return { ...base }
    case 'campaigns':
      return { ...base, cta_label: extras.ctaLabel || undefined, cta_url: extras.ctaUrl || undefined, start_date: extras.startDate || undefined, end_date: extras.endDate || undefined, is_featured: extras.isFeatured ?? false, translation: { locale: LOCALE, title, excerpt: excerpt || undefined, body: encodeBody(body) } }
    default:
      return base
  }
}

function buildUpdatePatch(
  module: SimpleModule, _title: string,
  coverImage: string | null, tags: string[], status: ContentStatus,
  extras: Record<string, unknown>,
): Record<string, unknown> {
  const base: Record<string, unknown> = { cover_image: coverImage ?? null, status }
  switch (module) {
    case 'stories':      return { ...base, tags, category: extras.category || null, location: extras.location || null, region: extras.region || null, is_featured: extras.isFeatured ?? false }
    case 'journal':      return { ...base, category: extras.category || null, is_featured: extras.isFeatured ?? false }
    case 'services':     return { ...base, price: extras.price ? Number(extras.price) : null, currency: extras.currency || null, is_featured: extras.isFeatured ?? false, extra: { category: extras.category || null, duration: extras.duration || null } }
    case 'destinations': return { ...base, island: extras.island || null, region: extras.region || null, province: extras.province || null, country: extras.country || null, lat: extras.lat ? Number(extras.lat) : null, lng: extras.lng ? Number(extras.lng) : null, is_featured: extras.isFeatured ?? false }
    case 'products':     return { ...base, product_type: (extras.productType as ProductType) || 'product', price: extras.price ? Number(extras.price) : null, is_featured: extras.isFeatured ?? false }
    case 'collections':  return { ...base }
    case 'campaigns':    return { ...base, cta_label: extras.ctaLabel || null, cta_url: extras.ctaUrl || null, start_date: extras.startDate || null, end_date: extras.endDate || null, is_featured: extras.isFeatured ?? false }
    default:             return base
  }
}

function renderModuleExtras(
  module: SimpleModule | null,
  extras: Record<string, unknown>,
  setExtra: (key: string, value: unknown) => void,
): React.ReactNode {
  switch (module) {
    case 'stories':
      return (
        <div className="cms-card p-4 space-y-3">
          <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Story Details</h3>
          <FormField label="Category" value={extras.category as string ?? ''} onChange={(e) => setExtra('category', e.target.value)} placeholder="e.g. Wedding" />
          <FormField label="Location" value={extras.location as string ?? ''} onChange={(e) => setExtra('location', e.target.value)} placeholder="e.g. Bali" />
          <FormField label="Region"   value={extras.region   as string ?? ''} onChange={(e) => setExtra('region',   e.target.value)} placeholder="e.g. Ubud" />
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-[var(--text-primary)]">Featured</span>
            <Switch checked={!!(extras.isFeatured)} onChange={(v) => setExtra('isFeatured', v)} />
          </div>
        </div>
      )
    case 'journal':
      return (
        <div className="cms-card p-4 space-y-3">
          <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Post Details</h3>
          <FormField label="Category" value={extras.category as string ?? ''} onChange={(e) => setExtra('category', e.target.value)} placeholder="e.g. Behind the scenes" />
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-[var(--text-primary)]">Featured</span>
            <Switch checked={!!(extras.isFeatured)} onChange={(v) => setExtra('isFeatured', v)} />
          </div>
        </div>
      )
    case 'services':
      return (
        <div className="cms-card p-4 space-y-3">
          <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Service Details</h3>
          <FormField label="Category" value={extras.category as string ?? ''} onChange={(e) => setExtra('category', e.target.value)} placeholder="e.g. Wedding" />
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Price"    type="number" value={String(extras.price    ?? '')} onChange={(e) => setExtra('price',    e.target.value)} placeholder="0" />
            <FormField label="Currency" value={String(extras.currency ?? 'IDR')}            onChange={(e) => setExtra('currency', e.target.value)} placeholder="IDR" />
          </div>
          <FormField label="Duration" value={extras.duration as string ?? ''} onChange={(e) => setExtra('duration', e.target.value)} placeholder="e.g. 2 hours" />
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-[var(--text-primary)]">Featured</span>
            <Switch checked={!!(extras.isFeatured)} onChange={(v) => setExtra('isFeatured', v)} />
          </div>
        </div>
      )
    case 'destinations':
      return (
        <div className="cms-card p-4 space-y-3">
          <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Location Details</h3>
          <FormField label="Island"   value={extras.island   as string ?? ''} onChange={(e) => setExtra('island',   e.target.value)} placeholder="e.g. Bali" />
          <FormField label="Region"   value={extras.region   as string ?? ''} onChange={(e) => setExtra('region',   e.target.value)} placeholder="e.g. Ubud" />
          <FormField label="Province" value={extras.province as string ?? ''} onChange={(e) => setExtra('province', e.target.value)} placeholder="e.g. Bali" />
          <FormField label="Country"  value={extras.country  as string ?? ''} onChange={(e) => setExtra('country',  e.target.value)} placeholder="Indonesia" />
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Lat" type="number" value={String(extras.lat ?? '')} onChange={(e) => setExtra('lat', e.target.value)} placeholder="-8.409" />
            <FormField label="Lng" type="number" value={String(extras.lng ?? '')} onChange={(e) => setExtra('lng', e.target.value)} placeholder="115.188" />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-[var(--text-primary)]">Featured</span>
            <Switch checked={!!(extras.isFeatured)} onChange={(v) => setExtra('isFeatured', v)} />
          </div>
        </div>
      )
    case 'products':
      return (
        <div className="cms-card p-4 space-y-3">
          <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Product Details</h3>
          <div className="space-y-1.5">
            <label className="cms-label">Type <span className="text-[var(--s-danger)] ml-0.5">*</span></label>
            <select className="cms-input w-full" value={extras.productType as string ?? 'product'} onChange={(e) => setExtra('productType', e.target.value)}>
              <option value="product">Product</option>
              <option value="service">Service</option>
              <option value="package">Package</option>
            </select>
          </div>
          <FormField label="Price" type="number" value={String(extras.price ?? '')} onChange={(e) => setExtra('price', e.target.value)} placeholder="0" />
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-[var(--text-primary)]">Featured</span>
            <Switch checked={!!(extras.isFeatured)} onChange={(v) => setExtra('isFeatured', v)} />
          </div>
        </div>
      )
    case 'campaigns':
      return (
        <div className="cms-card p-4 space-y-3">
          <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Campaign Details</h3>
          <FormField label="CTA Label"  value={extras.ctaLabel  as string ?? ''} onChange={(e) => setExtra('ctaLabel',  e.target.value)} placeholder="Book Now" />
          <FormField label="CTA URL"    value={extras.ctaUrl    as string ?? ''} onChange={(e) => setExtra('ctaUrl',    e.target.value)} placeholder="https://…" />
          <FormField label="Start Date" type="date" value={extras.startDate as string ?? ''} onChange={(e) => setExtra('startDate', e.target.value)} />
          <FormField label="End Date"   type="date" value={extras.endDate   as string ?? ''} onChange={(e) => setExtra('endDate',   e.target.value)} />
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-[var(--text-primary)]">Featured</span>
            <Switch checked={!!(extras.isFeatured)} onChange={(v) => setExtra('isFeatured', v)} />
          </div>
        </div>
      )
    default:
      return null
  }
}

// ── Component ─────────────────────────────────────────────────────────────

export default function SimpleContentEditorPage() {
  const { id }         = useParams<{ id: string }>()
  const { pathname }   = useLocation()
  const navigate       = useNavigate()
  const queryClient    = useQueryClient()
  const { activeSite } = useWebsiteStore()

  const module = (Object.keys(MODULE_CONFIG) as SimpleModule[]).find((k) =>
    pathname.startsWith(`/${k}/`)
  ) ?? null

  const config = module ? MODULE_CONFIG[module] : null
  const isNew  = pathname.endsWith('/new') || !id

  // ── Remote data (EDIT mode only) ─────────────────────────────────────

  const { data: entity, isLoading, error } = useQuery<AnyEntity>({
    queryKey:  ['simple-editor', module, id],
    queryFn:   () => config!.service.getById(id!),
    enabled:   !!config && !isNew && !!id,
    staleTime: 0,
  })

  // ── Local state ──────────────────────────────────────────────────────

  const [title,      setTitle]      = useState('')
  const [slug,       setSlug]       = useState('')
  const [slugLocked, setSlugLocked] = useState(false)
  const [excerpt,    setExcerpt]    = useState('')
  const [body,       setBody]       = useState('')
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [tags,       setTags]       = useState<string[]>([])
  const [status,     setStatus]     = useState<ContentStatus>('draft')
  const [metaTitle,  setMetaTitle]  = useState('')
  const [metaDesc,   setMetaDesc]   = useState('')
  const [extras,     setExtras]     = useState<Record<string, unknown>>({})

  const [isSaving,     setIsSaving]     = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [saveError,    setSaveError]    = useState<string | null>(null)
  const [lastSaved,    setLastSaved]    = useState<string | null>(null)

  const setExtra = useCallback((key: string, value: unknown) => {
    setExtras((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Auto-generate slug from title in CREATE mode
  useEffect(() => {
    if (isNew && !slugLocked && title) setSlug(slugify(title))
  }, [isNew, slugLocked, title])

  // Hydrate from entity (EDIT mode)
  useEffect(() => {
    if (!entity || !module) return
    const t = getEntityTranslation(entity, module)
    if (t) {
      setTitle(t.displayTitle)
      setExcerpt(t.displayExcerpt)
      setBody(decodeBody(t.body))
      setMetaTitle(t.meta_title)
      setMetaDesc(t.meta_description)
    }
    setCoverImage(getCoverImage(entity) || null)
    setTags((entity as { tags?: string[] }).tags ?? [])
    setStatus((entity as { status?: ContentStatus }).status ?? 'draft')
    setSlug(getEntitySlug(entity))
    setSlugLocked(true)
    setExtras(getModuleExtras(entity, module))
  }, [entity, module])

  // ── Save ─────────────────────────────────────────────────────────────

  const doSave = useCallback(
    async (nextStatus?: ContentStatus) => {
      if (!config || !module) return
      setSaveError(null)
      setIsSaving(true)
      const effectiveStatus = nextStatus ?? status

      try {
        if (isNew) {
          if (!activeSite?.id) throw new Error('No active site selected')
          if (!title.trim())   throw new Error('Title is required')
          if (!slug.trim())    throw new Error('Slug is required')

          const createPayload = buildCreatePayload(
            module, slug.trim(), title.trim(), excerpt, body,
            coverImage, tags, effectiveStatus, extras, activeSite.id,
          )
          const newEntity = await config.service.create(createPayload) as { id: string }

          // products/collections/services: create payload omits body — upsert translation separately
          if (module === 'products' || module === 'collections' || module === 'services') {
            await config.service.upsertTranslation(
              newEntity.id, LOCALE,
              buildTranslationPayload(module, title, excerpt, body, metaTitle, metaDesc),
            )
          }

          if (nextStatus) setStatus(nextStatus)
          setLastSaved(formatRelative(new Date().toISOString()))
          void queryClient.invalidateQueries({ queryKey: [module] })
          navigate(`/${module}/${newEntity.id}/edit`, { replace: true })
        } else {
          if (!id) return

          await Promise.all([
            config.service.upsertTranslation(
              id, LOCALE,
              buildTranslationPayload(module, title, excerpt, body, metaTitle, metaDesc),
            ),
            config.service.update(
              id,
              buildUpdatePatch(module, title, coverImage, tags, effectiveStatus, extras),
            ),
          ])

          if (nextStatus) setStatus(nextStatus)
          setLastSaved(formatRelative(new Date().toISOString()))
          void queryClient.invalidateQueries({ queryKey: [module] })
        }
      } catch (err) {
        console.error('[SimpleContentEditor] save error', err)
        setSaveError(err instanceof Error ? err.message : 'Save failed. Please try again.')
      } finally {
        setIsSaving(false)
      }
    },
    [config, module, id, isNew, title, slug, excerpt, body, metaTitle, metaDesc,
     coverImage, tags, status, extras, activeSite, queryClient, navigate],
  )

  const handleSave    = useCallback(() => doSave(), [doSave])
  const handlePublish = useCallback(() => {
    setIsPublishing(true)
    doSave(status === 'published' ? 'draft' : 'published').finally(() => setIsPublishing(false))
  }, [doSave, status])

  // ── Guards ───────────────────────────────────────────────────────────

  if (!module || !config)  return <Navigate to="/" replace />
  if (!isNew && isLoading) return <DashboardSkeleton />
  if (!isNew && error)     return (
    <div className="p-8 text-center text-[var(--s-danger)] font-body">
      Failed to load content. Please go back and try again.
    </div>
  )

  const siteDomain = activeSite?.domain ?? 'yoursite.com'
  const hasTags    = module === 'stories'

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <ContentEditorLayout
      title={isNew ? `New ${config.label}` : `Edit ${config.label}`}
      subtitle={isNew
        ? `${config.label}s › New`
        : `${config.label}s › ${title || slug || id}`
      }
      onBack={() => navigate(`/${module}`)}
      sidebarContent={
        <>
          <PublishCard
            status={status}
            onStatusChange={setStatus}
            onSave={handleSave}
            onPublish={handlePublish}
            isSaving={isSaving}
            isPublishing={isPublishing}
            lastSaved={lastSaved}
          />

          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Cover Image</h3>
            <ImageUploader value={coverImage} onChange={setCoverImage} folder={`${module}/covers`} />
            <input
              type="text"
              value={coverImage ?? ''}
              onChange={(e) => setCoverImage(e.target.value || null)}
              placeholder="https://… or upload above"
              className="cms-input w-full text-xs"
            />
          </div>

          {hasTags && (
            <div className="cms-card p-4 space-y-3">
              <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Tags</h3>
              <TagInput value={tags} onChange={setTags} placeholder="Add tag…" />
            </div>
          )}

          {renderModuleExtras(module, extras, setExtra)}

          <SeoCard
            metaTitle={metaTitle}
            metaDescription={metaDesc}
            slug={isNew ? slug : getEntitySlug(entity ?? {} as AnyEntity)}
            siteDomain={siteDomain}
            onMetaTitleChange={setMetaTitle}
            onMetaDescriptionChange={setMetaDesc}
          />
        </>
      }
    >
      <div className="cms-card p-5 space-y-4">
        <FormField
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`${config.label} title…`}
        />

        {isNew && (
          <div className="space-y-1.5">
            <label className="cms-label">Slug</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugLocked(true) }}
                placeholder="url-friendly-slug"
                className="cms-input flex-1 font-mono text-sm"
              />
              {slugLocked && (
                <button
                  type="button"
                  className="cms-btn cms-btn-ghost cms-btn-sm whitespace-nowrap"
                  onClick={() => { setSlugLocked(false); setSlug(slugify(title)) }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        <TextAreaField
          label="Excerpt"
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short description shown in listings…"
          hint="Used in list views and as meta description fallback."
        />
      </div>

      <div className="cms-card p-5 space-y-3">
        <label className="cms-label">Content</label>
        <RichTextEditor
          value={body}
          onChange={setBody}
          placeholder="Write your content here…"
          minHeight={400}
        />
      </div>

      {saveError && (
        <div className="px-3 py-2 rounded-lg border border-[var(--s-danger)]/20 bg-red-50" role="alert">
          <p className="font-body text-xs text-[var(--s-danger)]">{saveError}</p>
        </div>
      )}
    </ContentEditorLayout>
  )
}
