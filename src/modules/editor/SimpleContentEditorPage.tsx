/**
 * SimpleContentEditorPage — Editor A (Shopify-style simple content editor).
 *
 * Handles 8 content modules:
 *   stories, journal, gallery, services, destinations, products, collections, campaigns
 *
 * Routes:
 *   /:module/new        → CREATE mode  (POST entity → navigate to /:module/:id/edit)
 *   /:module/:id/edit   → EDIT mode    (load entity, PUT translation + PATCH entity)
 *
 * Special cases:
 *   - destinations: upsertTranslation sends { name, description } not { title, excerpt }
 *   - products:     entity.name = title (required on entity); product_type required
 *   - collections:  entity.name = title (required on entity)
 *   - gallery, destinations: island/province/country/lat/lng/photographer/
 *     shoot_date/shots are NOT real content_items columns (only category/
 *     location/region/tags/cover_image are first-class — see DB.sql). They
 *     must be nested under a single `extra` JSONB field on create/update, or
 *     Supabase/PostgREST rejects the request with a "column does not exist"
 *     error. This was a real bug for destinations (island/lat/lng were being
 *     sent top-level) — fixed here alongside adding gallery + shots support.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useLocation, useNavigate, Navigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  storiesService,
  journalService,
  galleryService,
  servicesService,
  destinationsService,
  brandsService,
  productsService,
  collectionsService,
  campaignsService,
} from '@/services/content.service'
// Category picker for products — reuses the (fixed) Categories CMS module's
// own service rather than adding a second category client. See
// taxonomy.service.ts's file-header comment for why this was broken before.
import { categoryService, type Category } from '@/services/taxonomy.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { formatRelative }                    from '@/lib/utils'

import { ContentEditorLayout }                   from '@/components/organisms/ContentEditorLayout'
import { RichTextEditor, encodeBody, decodeBody, ImageUploader, FIELD_LIMITS, DashboardSkeleton, FormField, TextAreaField } from '@litostudio/ui-cms'
import { SeoCard }                                from '@/components/molecules/SeoCard'
import { PublishCard }                            from '@/components/molecules/PublishCard'
import { TagInput }                               from '@/components/molecules/TagInput'
import { Switch }                                 from '@/components/atoms/Switch'

import type { ContentStatus } from '@litostudio/ui-cms'
import type {
  Story, JournalPost, GalleryItem, Service, Destination, Brand, Product, Collection, Campaign,
  ProductType, ProductCategory, ProductExtra,
} from '@/types/content.types'
import { getTitle } from '@/types/content.types'

// ── Types ──────────────────────────────────────────────────────────────────

type SimpleModule =
  | 'stories' | 'journal' | 'gallery' | 'services' | 'destinations' | 'brands'
  | 'products' | 'collections' | 'campaigns'

type AnyEntity = Story | JournalPost | GalleryItem | Service | Destination | Brand | Product | Collection | Campaign

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyService = any

const LOCALE = 'id'

const MODULE_CONFIG: Record<SimpleModule, { label: string; service: AnyService }> = {
  stories:      { label: 'Story',        service: storiesService      },
  journal:      { label: 'Journal Post', service: journalService      },
  gallery:      { label: 'Gallery Item', service: galleryService      },
  services:     { label: 'Service',      service: servicesService     },
  destinations: { label: 'Destination',  service: destinationsService },
  brands:       { label: 'Brand',        service: brandsService       },
  products:     { label: 'Product',      service: productsService     },
  collections:  { label: 'Collection',   service: collectionsService  },
  campaigns:    { label: 'Campaign',     service: campaignsService    },
}

/** A single frame in a gallery item's or destination's shot album. */
interface ShotEntry { url: string; title?: string; sub?: string }

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
  // products, collections, and services (stored in products table, via
  // product_translations which has a real `name` column) use `name`.
  // Everything else — including destinations — is stored in the unified
  // content_translations table (title/excerpt columns only; that table has
  // NO name/description columns, unlike the old dedicated
  // destination_translations table this used to special-case for).
  const isNameBased = module === 'products' || module === 'collections' || module === 'services'
  return {
    displayTitle:     isNameBased ? ((t.name as string) ?? '') : ((t.title as string) ?? ''),
    displayExcerpt:   (t.excerpt as string) ?? '',
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
    case 'gallery': {
      const g = e as GalleryItem
      // aspect_ratio/photographer/shoot_date/shots live in extra JSONB —
      // location/region/tags are real content_items columns.
      const ext = (g.extra ?? {}) as Record<string, unknown>
      return {
        category:     g.category ?? '',
        location:     g.location ?? '',
        region:       g.region ?? '',
        aspectRatio:  (ext.aspect_ratio as string) ?? '',
        photographer: (ext.photographer as string) ?? '',
        shootDate:    (ext.shoot_date as string) ?? '',
        shots:        (ext.shots as ShotEntry[]) ?? [],
        isFeatured:   g.is_featured ?? false,
      }
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
      // island/province/country/lat/lng/shots are NOT real content_items
      // columns — they live in extra JSONB (see file header comment).
      // `d.island` etc. are read defensively as a fallback only in case
      // older data was ever written with them top-level; extra is authoritative.
      const ext = (d.extra ?? {}) as Record<string, unknown>
      return {
        island:     (ext.island as string)   ?? d.island   ?? '',
        region:     d.region ?? '',
        province:   (ext.province as string) ?? d.province ?? '',
        country:    (ext.country as string)  ?? d.country  ?? '',
        lat:        (ext.lat as number)      ?? d.lat      ?? '',
        lng:        (ext.lng as number)      ?? d.lng      ?? '',
        shots:      (ext.shots as ShotEntry[]) ?? [],
        isFeatured: d.is_featured ?? false,
      }
    }
    case 'brands': {
      const b = e as Brand
      const ext = (b.extra ?? {}) as Record<string, unknown>
      return {
        category:   b.category ?? '',
        linkUrl:    (ext.link_url as string) ?? '',
        isFeatured: b.is_featured ?? false,
      }
    }
    case 'products': {
      const p = e as Product
      const ext = p.extra ?? {}
      return {
        productType: p.product_type ?? 'product',
        price:       p.price ?? '',
        isFeatured:  p.is_featured ?? false,
        category:    ext.category   ?? '',
        // Legacy free-text brand name (pre-dates the brandId picker below).
        // No longer editable in the UI, but still round-tripped so an
        // existing product's extra.brand text isn't silently wiped the next
        // time someone edits and saves it (buildUpdatePatch rebuilds `extra`
        // from scratch from this `extras` bag on every save).
        brand:       ext.brand      ?? '',
        sizes:       ext.sizes      ?? [],
        gender:      ext.gender     ?? '',
        skin_type:   ext.skin_type  ?? '',
        volume:      ext.volume     ?? '',
        shade:       ext.shade      ?? '',
        color:       ext.color      ?? '',
        material:    ext.material   ?? '',
        // Real relational fields (products.category_id / products.brand_id,
        // migration 085) — NOT part of the `extra` JSONB, unlike everything
        // else in this case. Kept in the same `extras` state bag purely so
        // the existing setExtra()/renderModuleExtras() plumbing can be
        // reused; buildCreatePayload/buildUpdatePatch route these two keys
        // to top-level product columns instead of into `extra`.
        categoryId:  p.category_id  ?? null,
        brandId:     p.brand_id     ?? null,
        // Also real top-level columns (not `extra`), same reasoning as
        // category_id/brand_id above — is_digital gates checkout's
        // shipping-address step (Task #28), digital_file_url is what the
        // "paid" email links to for a digital product.
        isDigital:      p.is_digital ?? false,
        digitalFileUrl: p.digital_file_url ?? '',
      }
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
  // products, services, collections → translation tables use `name` not `title`
  // (product_translations, collection_translations both have `name` column, no `title`)
  if (module === 'products' || module === 'services' || module === 'collections') {
    return { ...common, name: title, excerpt: excerpt || undefined }
  }
  // stories, journal, gallery, destinations, campaigns → all share the
  // unified content_translations table, which has `title`/`excerpt` only.
  // (destinations used to send `name`/`description` here — a leftover from
  // the old dedicated destination_translations table; content_translations
  // has no such columns, so that write silently 400'd. Fixed.)
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
    case 'gallery': {
      const extra: Record<string, unknown> = {}
      if (extras.aspectRatio)  extra.aspect_ratio = extras.aspectRatio
      if (extras.photographer) extra.photographer = extras.photographer
      if (extras.shootDate)    extra.shoot_date   = extras.shootDate
      if (Array.isArray(extras.shots) && (extras.shots as ShotEntry[]).length > 0) extra.shots = extras.shots
      return {
        ...base,
        category:    extras.category || undefined,
        location:    extras.location || undefined,
        region:      extras.region   || undefined,
        is_featured: extras.isFeatured ?? false,
        extra,
        translation: { locale: LOCALE, title, excerpt: excerpt || undefined, body: encodeBody(body) },
      }
    }
    case 'services':
      return { ...base, product_type: 'service', price: extras.price ? Number(extras.price) : undefined, currency: extras.currency || undefined, is_featured: extras.isFeatured ?? false, extra: { category: extras.category || undefined, duration: extras.duration || undefined } }
    case 'destinations': {
      // island/province/country/lat/lng/shots are NOT real content_items
      // columns — must be nested under `extra` (see file header comment),
      // not sent top-level like the old dedicated `destinations` table.
      const extra: Record<string, unknown> = {}
      if (extras.island)   extra.island   = extras.island
      if (extras.province) extra.province = extras.province
      if (extras.country)  extra.country  = extras.country
      if (extras.lat)       extra.lat      = Number(extras.lat)
      if (extras.lng)       extra.lng      = Number(extras.lng)
      if (Array.isArray(extras.shots) && (extras.shots as ShotEntry[]).length > 0) extra.shots = extras.shots
      return {
        ...base,
        region:      extras.region || undefined,
        is_featured: extras.isFeatured ?? false,
        extra,
        translation: { locale: LOCALE, title, excerpt: excerpt || undefined },
      }
    }
    case 'products': {
      const extra: ProductExtra = {}
      if (extras.category)  extra.category  = extras.category  as ProductCategory
      if (extras.brand)     extra.brand     = extras.brand     as string
      if (extras.gender)    extra.gender    = extras.gender    as string
      if (extras.skin_type) extra.skin_type = extras.skin_type as string
      if (extras.volume)    extra.volume    = extras.volume    as string
      if (extras.shade)     extra.shade     = extras.shade     as string
      if (extras.color)     extra.color     = extras.color     as string
      if (extras.material)  extra.material  = extras.material  as string
      if (Array.isArray(extras.sizes) && (extras.sizes as string[]).length > 0) extra.sizes = extras.sizes as string[]
      return {
        ...base,
        product_type: (extras.productType as ProductType) || 'product',
        price:        extras.price ? Number(extras.price) : undefined,
        is_featured:  extras.isFeatured ?? false,
        // Real FK columns (migration 085) — deliberately top-level, not
        // nested in `extra`, unlike everything above.
        category_id:  (extras.categoryId as string) || undefined,
        brand_id:     (extras.brandId as string) || undefined,
        is_digital:      extras.isDigital ?? false,
        digital_file_url: extras.isDigital ? ((extras.digitalFileUrl as string) || undefined) : undefined,
        extra,
      }
    }
    case 'brands':
      // category is a plain content_items column (free text, e.g. 'payment'/
      // 'courier') — link_url has no dedicated column, nests under extra.
      return {
        ...base,
        category:    extras.category || undefined,
        is_featured: extras.isFeatured ?? false,
        extra:       extras.linkUrl ? { link_url: extras.linkUrl } : {},
        translation: { locale: LOCALE, title },
      }
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
    case 'gallery': {
      const extra: Record<string, unknown> = {}
      if (extras.aspectRatio)  extra.aspect_ratio = extras.aspectRatio
      if (extras.photographer) extra.photographer = extras.photographer
      if (extras.shootDate)    extra.shoot_date   = extras.shootDate
      if (Array.isArray(extras.shots) && (extras.shots as ShotEntry[]).length > 0) extra.shots = extras.shots
      return {
        ...base,
        tags,
        category:    extras.category || null,
        location:    extras.location || null,
        region:      extras.region   || null,
        is_featured: extras.isFeatured ?? false,
        extra,
      }
    }
    case 'services':     return { ...base, price: extras.price ? Number(extras.price) : null, currency: extras.currency || null, is_featured: extras.isFeatured ?? false, extra: { category: extras.category || null, duration: extras.duration || null } }
    case 'destinations': {
      // See buildCreatePayload's destinations case — same extra-routing fix.
      const extra: Record<string, unknown> = {}
      if (extras.island)   extra.island   = extras.island
      if (extras.province) extra.province = extras.province
      if (extras.country)  extra.country  = extras.country
      if (extras.lat)       extra.lat      = Number(extras.lat)
      if (extras.lng)       extra.lng      = Number(extras.lng)
      if (Array.isArray(extras.shots) && (extras.shots as ShotEntry[]).length > 0) extra.shots = extras.shots
      return {
        ...base,
        region:      extras.region || null,
        is_featured: extras.isFeatured ?? false,
        extra,
      }
    }
    case 'products': {
      const extra: ProductExtra = {}
      if (extras.category)  extra.category  = extras.category  as ProductCategory
      if (extras.brand)     extra.brand     = extras.brand     as string
      if (extras.gender)    extra.gender    = extras.gender    as string
      if (extras.skin_type) extra.skin_type = extras.skin_type as string
      if (extras.volume)    extra.volume    = extras.volume    as string
      if (extras.shade)     extra.shade     = extras.shade     as string
      if (extras.color)     extra.color     = extras.color     as string
      if (extras.material)  extra.material  = extras.material  as string
      if (Array.isArray(extras.sizes) && (extras.sizes as string[]).length > 0) extra.sizes = extras.sizes as string[]
      return {
        ...base,
        product_type: (extras.productType as ProductType) || 'product',
        price:        extras.price ? Number(extras.price) : null,
        is_featured:  extras.isFeatured ?? false,
        category_id:  (extras.categoryId as string) || null,
        brand_id:     (extras.brandId as string) || null,
        is_digital:      extras.isDigital ?? false,
        digital_file_url: extras.isDigital ? ((extras.digitalFileUrl as string) || null) : null,
        extra,
      }
    }
    case 'brands':
      return {
        ...base,
        category:    extras.category || null,
        is_featured: extras.isFeatured ?? false,
        extra:       extras.linkUrl ? { link_url: extras.linkUrl } : {},
      }
    case 'collections':  return { ...base }
    case 'campaigns':    return { ...base, cta_label: extras.ctaLabel || null, cta_url: extras.ctaUrl || null, start_date: extras.startDate || null, end_date: extras.endDate || null, is_featured: extras.isFeatured ?? false }
    default:             return base
  }
}

/**
 * Reusable "shot album" editor — a repeatable list of { url, title, sub }
 * frames, used by both gallery items and destinations (extra.shots). No
 * prior array-of-objects `extra` field existed in this file to copy from
 * (products.extra.sizes is an array of strings, not objects) — built fresh
 * to match the shared `GalleryShot` shape read by the public website
 * (apps/website/composables/repositories/parseShots.ts: url/title/sub,
 * with `image`/`src`/`caption` accepted as aliases on read for resilience).
 */
function ShotsEditor({
  shots, onChange, folder,
}: {
  shots: ShotEntry[]
  onChange: (next: ShotEntry[]) => void
  folder: string
}) {
  const updateShot = (i: number, patch: Partial<ShotEntry>) => {
    onChange(shots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }
  const removeShot = (i: number) => onChange(shots.filter((_, idx) => idx !== i))
  const addShot = () => onChange([...shots, { url: '' }])

  return (
    <div className="space-y-3">
      {shots.map((shot, i) => (
        <div key={i} className="rounded-lg border border-[var(--lito-border)] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-body text-xs font-semibold text-[var(--text-muted)]">Shot {i + 1}</span>
            <button
              type="button"
              onClick={() => removeShot(i)}
              className="font-body text-xs text-[var(--s-danger)] hover:underline"
            >
              Remove
            </button>
          </div>
          <ImageUploader value={shot.url || null} onChange={(url) => updateShot(i, { url: url ?? '' })} folder={folder} />
          <FormField
            label="Title"
            value={shot.title ?? ''}
            onChange={(e) => updateShot(i, { title: e.target.value })}
            placeholder="e.g. Underpass, blue hour"
          />
          <FormField
            label="Subtitle"
            value={shot.sub ?? ''}
            onChange={(e) => updateShot(i, { sub: e.target.value })}
            placeholder="e.g. FIZ-R200 Shell Jacket"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addShot}
        className="cms-btn cms-btn-ghost cms-btn-sm w-full justify-center"
      >
        + Add Shot
      </button>
    </div>
  )
}

function renderModuleExtras(
  module: SimpleModule | null,
  extras: Record<string, unknown>,
  setExtra: (key: string, value: unknown) => void,
  /** products-only reference data for the Category / Brand pickers below. */
  productPickers?: { categories: Category[]; brands: Brand[] },
): React.ReactNode {
  switch (module) {
    case 'stories':
      return (
        <div className="cms-card p-4 space-y-3">
          <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Story Details</h3>
          <FormField label="Category" value={extras.category as string ?? ''} onChange={(e) => setExtra('category', e.target.value)} placeholder="e.g. Wedding"          maxLength={FIELD_LIMITS.CONTENT_CATEGORY} />
          <FormField label="Location" value={extras.location as string ?? ''} onChange={(e) => setExtra('location', e.target.value)} placeholder="e.g. Bali"             maxLength={FIELD_LIMITS.LOCATION} />
          <FormField label="Region"   value={extras.region   as string ?? ''} onChange={(e) => setExtra('region',   e.target.value)} placeholder="e.g. Ubud"             maxLength={FIELD_LIMITS.LOCATION} />
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
          <FormField label="Category" value={extras.category as string ?? ''} onChange={(e) => setExtra('category', e.target.value)} placeholder="e.g. Behind the scenes" maxLength={FIELD_LIMITS.CONTENT_CATEGORY} />
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-[var(--text-primary)]">Featured</span>
            <Switch checked={!!(extras.isFeatured)} onChange={(v) => setExtra('isFeatured', v)} />
          </div>
        </div>
      )
    case 'gallery':
      return (
        <>
          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Gallery Item Details</h3>
            <FormField label="Category"     value={extras.category     as string ?? ''} onChange={(e) => setExtra('category',     e.target.value)} placeholder="e.g. Landscape"        maxLength={FIELD_LIMITS.CONTENT_CATEGORY} />
            <FormField label="Location"     value={extras.location     as string ?? ''} onChange={(e) => setExtra('location',     e.target.value)} placeholder="e.g. Bali"             maxLength={FIELD_LIMITS.LOCATION} />
            <FormField label="Region"       value={extras.region       as string ?? ''} onChange={(e) => setExtra('region',       e.target.value)} placeholder="e.g. Ubud"             maxLength={FIELD_LIMITS.LOCATION} />
            <FormField label="Photographer" value={extras.photographer as string ?? ''} onChange={(e) => setExtra('photographer', e.target.value)} placeholder="e.g. Karin Wijaya" />
            <FormField label="Shoot Date"   type="date" value={extras.shootDate as string ?? ''} onChange={(e) => setExtra('shootDate', e.target.value)} />
            <div className="space-y-1.5">
              <label className="cms-label">Aspect Ratio</label>
              <select
                className="cms-input w-full"
                value={extras.aspectRatio as string ?? ''}
                onChange={(e) => setExtra('aspectRatio', e.target.value)}
              >
                <option value="">— Default (3:4) —</option>
                <option value="3:4">Portrait (3:4)</option>
                <option value="4:3">Landscape (4:3)</option>
                <option value="1:1">Square (1:1)</option>
                <option value="16:9">Widescreen (16:9)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-[var(--text-primary)]">Featured</span>
              <Switch checked={!!(extras.isFeatured)} onChange={(v) => setExtra('isFeatured', v)} />
            </div>
          </div>
          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">
              Shot Album
              <span className="font-body text-xs font-normal text-[var(--text-muted)] ml-1.5">
                — extra frames shown in the gallery detail lightbox
              </span>
            </h3>
            <ShotsEditor
              shots={(extras.shots as ShotEntry[]) ?? []}
              onChange={(next) => setExtra('shots', next)}
              folder="gallery/shots"
            />
          </div>
        </>
      )
    case 'services':
      return (
        <div className="cms-card p-4 space-y-3">
          <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Service Details</h3>
          <FormField label="Category" value={extras.category as string ?? ''} onChange={(e) => setExtra('category', e.target.value)} placeholder="e.g. Wedding"          maxLength={FIELD_LIMITS.CONTENT_CATEGORY} />
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Price"    type="number" value={String(extras.price    ?? '')} onChange={(e) => setExtra('price',    e.target.value)} placeholder="0" />
            <FormField label="Currency" value={String(extras.currency ?? 'IDR')}            onChange={(e) => setExtra('currency', e.target.value)} placeholder="IDR"       maxLength={FIELD_LIMITS.CURRENCY} />
          </div>
          <FormField label="Duration" value={extras.duration as string ?? ''} onChange={(e) => setExtra('duration', e.target.value)} placeholder="e.g. 2 hours"            maxLength={FIELD_LIMITS.DURATION} />
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-[var(--text-primary)]">Featured</span>
            <Switch checked={!!(extras.isFeatured)} onChange={(v) => setExtra('isFeatured', v)} />
          </div>
        </div>
      )
    case 'destinations':
      return (
        <>
          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Location Details</h3>
            <FormField label="Island"   value={extras.island   as string ?? ''} onChange={(e) => setExtra('island',   e.target.value)} placeholder="e.g. Bali"      maxLength={FIELD_LIMITS.LOCATION} />
            <FormField label="Region"   value={extras.region   as string ?? ''} onChange={(e) => setExtra('region',   e.target.value)} placeholder="e.g. Ubud"      maxLength={FIELD_LIMITS.LOCATION} />
            <FormField label="Province" value={extras.province as string ?? ''} onChange={(e) => setExtra('province', e.target.value)} placeholder="e.g. Bali"      maxLength={FIELD_LIMITS.LOCATION} />
            <FormField label="Country"  value={extras.country  as string ?? ''} onChange={(e) => setExtra('country',  e.target.value)} placeholder="Indonesia"      maxLength={FIELD_LIMITS.LOCATION} />
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Lat" type="number" value={String(extras.lat ?? '')} onChange={(e) => setExtra('lat', e.target.value)} placeholder="-8.409" />
              <FormField label="Lng" type="number" value={String(extras.lng ?? '')} onChange={(e) => setExtra('lng', e.target.value)} placeholder="115.188" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-[var(--text-primary)]">Featured</span>
              <Switch checked={!!(extras.isFeatured)} onChange={(v) => setExtra('isFeatured', v)} />
            </div>
          </div>
          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">
              Shot Album
              <span className="font-body text-xs font-normal text-[var(--text-muted)] ml-1.5">
                — campaign/location photos shown in the destination detail lightbox
              </span>
            </h3>
            <ShotsEditor
              shots={(extras.shots as ShotEntry[]) ?? []}
              onChange={(next) => setExtra('shots', next)}
              folder="destinations/shots"
            />
          </div>
        </>
      )
    case 'products': {
      const cat = (extras.category as string) || ''
      const sizes = (extras.sizes as string[]) || []
      const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      const toggleSize = (sz: string) => {
        const next = sizes.includes(sz) ? sizes.filter((s) => s !== sz) : [...sizes, sz]
        setExtra('sizes', next)
      }
      return (
        <div className="cms-card p-4 space-y-3">
          <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Product Details</h3>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="cms-label">Type <span className="text-[var(--s-danger)] ml-0.5">*</span></label>
            <select className="cms-input w-full" value={extras.productType as string ?? 'product'} onChange={(e) => setExtra('productType', e.target.value)}>
              <option value="product">Product</option>
              <option value="service">Service</option>
              <option value="package">Package</option>
            </select>
          </div>

          {/* Digital product — real top-level column (is_digital), gates
              whether checkout asks for a shipping address at all (Task
              #28). File upload itself reuses the Media Library (any file
              type in the ALLOWED_TYPES allowlist, including zip/pdf/epub
              since migration alongside this feature) — paste the resulting
              URL here rather than a dedicated uploader widget. */}
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-[var(--text-primary)]">Digital product (no shipping)</span>
            <Switch
              checked={!!(extras.isDigital)}
              onChange={(v) => { setExtra('isDigital', v); if (!v) setExtra('digitalFileUrl', '') }}
            />
          </div>
          {!!(extras.isDigital) && (
            <FormField
              label="Digital file URL"
              value={extras.digitalFileUrl as string ?? ''}
              onChange={(e) => setExtra('digitalFileUrl', e.target.value)}
              placeholder="https://…"
              hint="Upload the file on the Media Library page first, then paste its URL here. Sent to the customer once payment is confirmed."
            />
          )}

          {/* Category — real site taxonomy (categories table, migration 085).
              Determines where the product shows up in nav/filtering, NOT
              which extra fields appear below (that's "Attributes" further
              down). Empty until categories are added on the Categories page. */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="cms-label">Category</label>
              <Link to="/categories" className="font-body text-[11px] text-[var(--lito-teal)] hover:underline">Manage categories</Link>
            </div>
            <select
              className="cms-input w-full"
              value={(extras.categoryId as string) ?? ''}
              onChange={(e) => setExtra('categoryId', e.target.value || null)}
            >
              <option value="">— No category —</option>
              {(productPickers?.categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {(productPickers?.categories?.length ?? 0) === 0 && (
              <p className="font-body text-xs text-[var(--text-muted)]">No categories yet — add one on the Categories page.</p>
            )}
          </div>

          {/* Brand — real content_items brand (content_type='brand',
              category='product'), migration 085. Reuses the same Brands
              module/page that already manages payment/courier logos —
              product brands just live in the same list under a 'product'
              category, distinguished by that field. */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="cms-label">Brand</label>
              <Link to="/brands/new" className="font-body text-[11px] text-[var(--lito-teal)] hover:underline">+ Add brand</Link>
            </div>
            <select
              className="cms-input w-full"
              value={(extras.brandId as string) ?? ''}
              onChange={(e) => setExtra('brandId', e.target.value || null)}
            >
              <option value="">— No brand —</option>
              {(productPickers?.brands ?? []).map((b) => (
                <option key={b.id} value={b.id}>{getTitle(b)}</option>
              ))}
            </select>
            {(productPickers?.brands?.length ?? 0) === 0 && (
              <p className="font-body text-xs text-[var(--text-muted)]">No product brands yet — add one on the Brands page with category "product".</p>
            )}
          </div>

          {/* Attributes — a fixed template that decides which of the
              category-specific fields below (sizes, skin type, shade…)
              appear. Independent of the real Category above — e.g. a
              product can be in the "Sale" category but still use the
              Fashion attribute template. */}
          <div className="space-y-1.5">
            <label className="cms-label">Attributes</label>
            <select className="cms-input w-full" value={cat} onChange={(e) => {
              setExtra('category', e.target.value)
              // reset category-specific fields on change
              setExtra('sizes', [])
              setExtra('gender', '')
              setExtra('skin_type', '')
              setExtra('volume', '')
              setExtra('shade', '')
              setExtra('color', '')
              setExtra('material', '')
            }}>
              <option value="">— None —</option>
              <option value="fashion">Fashion</option>
              <option value="skincare">Skin Care</option>
              <option value="beauty">Beauty</option>
              <option value="accessories">Accessories</option>
              <option value="food_beverage">Food &amp; Beverage</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* ── Fashion fields ─────────────────────── */}
          {cat === 'fashion' && (
            <>
              <div className="space-y-1.5">
                <label className="cms-label">Available Sizes</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      className={[
                        'px-2.5 py-1 rounded font-body text-xs font-semibold border transition-colors',
                        sizes.includes(sz)
                          ? 'bg-[var(--lito-teal)] text-white border-[var(--lito-teal)]'
                          : 'bg-transparent text-[var(--text-secondary)] border-[var(--lito-border)] hover:border-[var(--lito-teal)]',
                      ].join(' ')}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
                {sizes.length > 0 && (
                  <p className="font-body text-xs text-[var(--text-muted)]">Selected: {sizes.join(', ')}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="cms-label">Gender</label>
                <div className="flex gap-2">
                  {(['men', 'women', 'unisex'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setExtra('gender', extras.gender === g ? '' : g)}
                      className={[
                        'flex-1 py-1.5 rounded font-body text-xs font-semibold border transition-colors capitalize',
                        extras.gender === g
                          ? 'bg-[var(--lito-teal)] text-white border-[var(--lito-teal)]'
                          : 'bg-transparent text-[var(--text-secondary)] border-[var(--lito-border)] hover:border-[var(--lito-teal)]',
                      ].join(' ')}
                    >
                      {g === 'men' ? 'Men' : g === 'women' ? 'Women' : 'Unisex'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Skincare fields ────────────────────── */}
          {cat === 'skincare' && (
            <>
              <div className="space-y-1.5">
                <label className="cms-label">Skin Type</label>
                <select className="cms-input w-full" value={extras.skin_type as string ?? ''} onChange={(e) => setExtra('skin_type', e.target.value)}>
                  <option value="">— All skin types —</option>
                  <option value="oily">Oily</option>
                  <option value="dry">Dry</option>
                  <option value="combination">Combination</option>
                  <option value="sensitive">Sensitive</option>
                  <option value="all">All types</option>
                </select>
              </div>
              <FormField
                label="Volume / Size"
                value={extras.volume as string ?? ''}
                onChange={(e) => setExtra('volume', e.target.value)}
                placeholder="e.g. 100ml, 50g"
              />
            </>
          )}

          {/* ── Beauty fields ──────────────────────── */}
          {cat === 'beauty' && (
            <>
              <FormField
                label="Shade / Color Name"
                value={extras.shade as string ?? ''}
                onChange={(e) => setExtra('shade', e.target.value)}
                placeholder="e.g. Rose Petal, Nude 02"
              />
              <div className="space-y-1.5">
                <label className="cms-label">Skin Type</label>
                <select className="cms-input w-full" value={extras.skin_type as string ?? ''} onChange={(e) => setExtra('skin_type', e.target.value)}>
                  <option value="">— All skin types —</option>
                  <option value="oily">Oily</option>
                  <option value="dry">Dry</option>
                  <option value="combination">Combination</option>
                  <option value="sensitive">Sensitive</option>
                  <option value="all">All types</option>
                </select>
              </div>
            </>
          )}

          {/* ── Accessories fields ─────────────────── */}
          {cat === 'accessories' && (
            <>
              <FormField
                label="Color"
                value={extras.color as string ?? ''}
                onChange={(e) => setExtra('color', e.target.value)}
                placeholder="e.g. Black, Gold"
              />
              <FormField
                label="Material"
                value={extras.material as string ?? ''}
                onChange={(e) => setExtra('material', e.target.value)}
                placeholder="e.g. Leather, Silver"
              />
            </>
          )}

          {/* ── Food & Beverage fields ─────────────── */}
          {cat === 'food_beverage' && (
            <FormField
              label="Weight / Volume"
              value={extras.volume as string ?? ''}
              onChange={(e) => setExtra('volume', e.target.value)}
              placeholder="e.g. 250g, 500ml"
            />
          )}

          {/* Price */}
          <FormField label="Price" type="number" value={String(extras.price ?? '')} onChange={(e) => setExtra('price', e.target.value)} placeholder="0" />

          {/* Featured */}
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-[var(--text-primary)]">Featured</span>
            <Switch checked={!!(extras.isFeatured)} onChange={(v) => setExtra('isFeatured', v)} />
          </div>
        </div>
      )
    }
    case 'brands':
      return (
        <div className="cms-card p-4 space-y-3">
          <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Brand Details</h3>
          <div className="space-y-1.5">
            <label className="cms-label">Category</label>
            <input
              list="brand-category-suggestions"
              className="cms-input w-full"
              value={extras.category as string ?? ''}
              onChange={(e) => setExtra('category', e.target.value)}
              placeholder="e.g. payment, courier"
              maxLength={FIELD_LIMITS.CONTENT_CATEGORY}
            />
            {/* Free text, not a closed dropdown — new categories (fashion,
                awards, etc.) can be typed straight in, same convention as
                Story/Journal/Gallery's category field. These three are just
                the currently-seeded suggestions — 'product' (migration 085)
                is what makes a brand selectable in the product editor's
                Brand picker (products.brand_id requires category='product'). */}
            <datalist id="brand-category-suggestions">
              <option value="payment" />
              <option value="courier" />
              <option value="product" />
              {/* partners + architects both render together under one combined
                  "Partners" footer section — see useSiteFooter.ts's
                  FOOTER_BRAND_GROUPS */}
              <option value="partners" />
              <option value="architects" />
            </datalist>
          </div>
          <FormField
            label="Link URL"
            value={extras.linkUrl as string ?? ''}
            onChange={(e) => setExtra('linkUrl', e.target.value)}
            placeholder="https://…"
          />
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
          <FormField label="CTA Label"  value={extras.ctaLabel  as string ?? ''} onChange={(e) => setExtra('ctaLabel',  e.target.value)} placeholder="Book Now" maxLength={FIELD_LIMITS.CTA_LABEL} />
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

  // Reference data for the products Category/Brand pickers — fetched only
  // when actually editing a product, reusing the Categories module's own
  // service (taxonomy.service.ts) and the existing brandsService.
  const { data: categoriesData } = useQuery({
    queryKey:  ['simple-editor-categories', activeSite?.id],
    queryFn:   () => categoryService.getList(activeSite!.id),
    enabled:   module === 'products' && !!activeSite,
    staleTime: 2 * 60 * 1000,
  })
  const { data: brandsData } = useQuery({
    queryKey:  ['simple-editor-brands', activeSite?.id],
    queryFn:   () => brandsService.getList({ site_id: activeSite!.id }),
    enabled:   module === 'products' && !!activeSite,
    staleTime: 2 * 60 * 1000,
  })
  const productCategories = categoriesData?.data ?? []
  // Only brands seeded/created under the 'product' content_categories slug
  // (migration 085) are valid picks — payment/courier logo brands share the
  // same table/list but must not show up here.
  const productBrands = ((brandsData?.data ?? []) as Brand[]).filter((b) => b.category === 'product')

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

  // ── Autosave (EDIT mode only — 2s debounce on any field change) ──────────
  // Mirrors the pattern in EditorShell.tsx. Skips NEW mode (no entity yet).
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasHydrated   = useRef(false)

  useEffect(() => {
    // Mark hydrated after first entity load
    if (entity) hasHydrated.current = true
  }, [entity])

  useEffect(() => {
    // Only autosave in EDIT mode after initial hydration, and when not already saving
    if (isNew || !hasHydrated.current || isSaving) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      void doSave()
    }, 2_000)
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, excerpt, body, coverImage, tags, metaTitle, metaDesc, extras])

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

          // Brands: case-insensitive duplicate check within the same
          // category. The DB only rejects an exact slug clash — two brands
          // named "Visa" / "VISA " under the same category would otherwise
          // both save fine as different slugs.
          if (module === 'brands') {
            const existing = await brandsService.getList({ site_id: activeSite.id })
            const normalizedTitle    = title.trim().toLowerCase()
            const normalizedCategory = String(extras.category ?? '').trim().toLowerCase()
            const clash = (existing.data ?? []).find((b) =>
              getTitle(b).trim().toLowerCase() === normalizedTitle
              && (b.category ?? '').trim().toLowerCase() === normalizedCategory,
            )
            if (clash) {
              throw new Error(`A brand named "${title.trim()}" already exists in the "${extras.category || 'uncategorized'}" category.`)
            }
          }

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
  const hasTags    = module === 'stories' || module === 'gallery'

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
            <ImageUploader
              value={coverImage}
              onChange={setCoverImage}
              folder={`${module}/covers`}
              // Brand logos are capped at 1MB (payment/courier marks, not
              // hero photography) — every other module keeps the
              // ImageUploader's default 5MB limit.
              maxBytes={module === 'brands' ? 1024 * 1024 : undefined}
            />
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

          {renderModuleExtras(module, extras, setExtra, { categories: productCategories, brands: productBrands })}

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
          maxLength={FIELD_LIMITS.TITLE}
        />

        {isNew && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="cms-label">Slug</label>
              <span className="font-body text-[11px] text-[var(--text-faint)]">
                {slug.length}/{FIELD_LIMITS.SLUG}
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugLocked(true) }}
                placeholder="url-friendly-slug"
                maxLength={FIELD_LIMITS.SLUG}
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
          maxLength={FIELD_LIMITS.EXCERPT}
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
        <div className="px-3 py-2 rounded-lg border border-[var(--cms-danger)] bg-[var(--cms-danger-bg)]" role="alert">
          <p className="font-body text-xs text-[var(--cms-danger)]">{saveError}</p>
        </div>
      )}
    </ContentEditorLayout>
  )
}
