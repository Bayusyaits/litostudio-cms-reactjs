import type { ContentStatus } from './api.types'

// ── Translation shape ─────────────────────────────────────────────────────

export interface Translation {
  locale: string
  title: string
  excerpt?: string
  body?: unknown  // JSONB from Tiptap
  meta_title?: string
  meta_description?: string
}

// ── Story ─────────────────────────────────────────────────────────────────

export interface Story {
  id: string
  site_id: string
  slug: string
  category: string | null
  location: string | null
  region: string | null
  cover_image: string | null
  images: string[]
  camera: string | null
  tags: string[]
  read_time: number | null
  is_featured: boolean
  status: ContentStatus
  published_at: string | null
  sort_order: number
  view_count?: number
  created_at: string
  updated_at: string
  translations: (Translation & { subtitle?: string })[]
}

export interface StoryCreateRequest {
  site_id?: string
  slug: string
  category?: string
  location?: string
  region?: string
  cover_image?: string
  tags?: string[]
  is_featured?: boolean
  status?: ContentStatus
  translation: {
    locale: string
    title: string
    excerpt?: string
    body?: unknown
  }
}

export interface StoryUpdateRequest extends Partial<StoryCreateRequest> {}

// ── Journal ───────────────────────────────────────────────────────────────

export interface JournalPost {
  id: string
  site_id: string
  slug: string
  category: string | null
  cover_image: string | null
  read_time: number | null
  is_featured: boolean
  status: ContentStatus
  published_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
  translations: Translation[]
}

export interface JournalCreateRequest {
  site_id?: string
  slug: string
  category?: string
  cover_image?: string
  is_featured?: boolean
  status?: ContentStatus
  translation: { locale: string; title: string; excerpt?: string; body?: unknown }
}

export interface JournalUpdateRequest extends Partial<JournalCreateRequest> {}

// ── Gallery ───────────────────────────────────────────────────────────────

export interface GalleryItem {
  id: string
  site_id: string
  story_id: string | null
  slug: string
  image_url: string | null
  category: string | null
  location: string | null
  region: string | null
  aspect_ratio: string | null
  tags: string[]
  is_featured: boolean
  status: ContentStatus
  sort_order: number
  created_at: string
  updated_at: string
  translations: Translation[]
}

export interface GalleryCreateRequest {
  slug: string
  image_url?: string
  category?: string
  tags?: string[]
  is_featured?: boolean
  status?: ContentStatus
  translation: { locale: string; title: string; description?: string }
}

export interface GalleryUpdateRequest extends Partial<GalleryCreateRequest> {}

// ── Destination ───────────────────────────────────────────────────────────

export interface Destination {
  id: string
  site_id: string
  slug: string
  island: string | null
  region: string | null
  province: string | null
  country: string | null
  lat: number | null
  lng: number | null
  cover_image: string | null
  is_featured: boolean
  status: ContentStatus
  sort_order: number
  created_at: string
  updated_at: string
  translations: (Translation & { name?: string; description?: string })[]
}

// ── Product ───────────────────────────────────────────────────────────────

export type ProductType = 'product' | 'service' | 'package'

export interface Product {
  id: string
  site_id: string
  slug: string
  name: string
  product_type: ProductType
  price: number | null
  sort_order: number
  status: ContentStatus
  created_at: string
  updated_at: string
  translations: Translation[]
}

export interface ProductCreateRequest {
  site_id?: string
  slug: string
  name: string
  product_type: ProductType
  price?: number
  sort_order?: number
  status?: ContentStatus
  translation?: { locale: string; title: string; description?: string }
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {}

// ── Collection ────────────────────────────────────────────────────────────

export interface Collection {
  id: string
  site_id: string
  slug: string
  name: string
  product_count: number
  status: ContentStatus
  created_at: string
  updated_at: string
  translations: Translation[]
}

export interface CollectionCreateRequest {
  site_id?: string
  slug: string
  name: string
  status?: ContentStatus
  translation?: { locale: string; title: string; description?: string }
}

export interface CollectionUpdateRequest extends Partial<CollectionCreateRequest> {}

// ── Review ────────────────────────────────────────────────────────────────

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface Review {
  id: string
  site_id: string
  author_name: string
  rating: number
  reviewable_type: string | null
  status: ReviewStatus
  body: string | null
  created_at: string
  updated_at: string
}

export interface ReviewUpdateRequest {
  status?: ReviewStatus
  body?: string
}

// ── FAQ ───────────────────────────────────────────────────────────────────

export interface Faq {
  id: string
  site_id: string
  slug: string
  sort_order: number
  status: ContentStatus
  created_at: string
  updated_at: string
  translations: (Translation & { question?: string; answer?: string })[]
}

export interface FaqCreateRequest {
  site_id?: string
  slug: string
  sort_order?: number
  status?: ContentStatus
  translation: { locale: string; question: string; answer?: string }
}

export interface FaqUpdateRequest extends Partial<FaqCreateRequest> {}

// ── Category / Tag ────────────────────────────────────────────────────────

export interface Category {
  id: string
  site_id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  icon: string | null
  parent_id: string | null
  sort_order: number
  status: ContentStatus
}

export interface Tag {
  id: string
  site_id: string
  name: string
  slug: string
  color: string | null
  status: ContentStatus
}

// ── Translation helpers ────────────────────────────────────────────────────

/** Get the first translation's title, falling back to slug */
export function getTitle(item: { translations: { title?: string }[]; slug?: string }): string {
  return item.translations[0]?.title ?? item.slug ?? '—'
}

/** Get the first translation's excerpt */
export function getExcerpt(item: { translations: { excerpt?: string }[] }): string | undefined {
  return item.translations[0]?.excerpt
}

/** Get Destination display name from translations */
export function getDestName(item: { translations: (Translation & { name?: string })[]; slug?: string }): string {
  return item.translations[0]?.name ?? item.translations[0]?.title ?? item.slug ?? '—'
}
