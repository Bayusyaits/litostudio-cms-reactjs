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

// ── Service ───────────────────────────────────────────────────────────────

export interface Service {
  id: string
  site_id: string
  slug: string
  category: string | null
  cover_image: string | null
  price: number | null
  currency: string | null
  duration: string | null
  sort_order: number
  is_featured: boolean
  status: ContentStatus
  published_at: string | null
  created_at: string
  updated_at: string
  translations: Translation[]
}

export interface ServiceCreateRequest {
  site_id?: string
  slug: string
  category?: string
  cover_image?: string
  price?: number
  currency?: string
  duration?: string
  sort_order?: number
  is_featured?: boolean
  status?: ContentStatus
  translation: { locale: string; title: string; excerpt?: string; body?: unknown }
}

export interface ServiceUpdateRequest extends Partial<ServiceCreateRequest> {}

// ── Testimonial ───────────────────────────────────────────────────────────

export interface Testimonial {
  id: string
  site_id: string
  slug: string
  author_name: string
  author_title: string | null
  author_company: string | null
  author_avatar: string | null
  service_type: string | null
  rating: number | null
  sort_order: number
  is_featured: boolean
  status: ContentStatus
  created_at: string
  updated_at: string
  translations: Translation[]
}

export interface TestimonialCreateRequest {
  site_id?: string
  slug: string
  author_name: string
  author_title?: string
  author_company?: string
  author_avatar?: string
  service_type?: string
  rating?: number
  sort_order?: number
  is_featured?: boolean
  status?: ContentStatus
  translation: { locale: string; title?: string; body?: unknown }
}

export interface TestimonialUpdateRequest extends Partial<TestimonialCreateRequest> {}

// ── Feedback (unified reviews + testimonials) ─────────────────────────────

export type FeedbackType   = 'review' | 'testimonial'
export type FeedbackStatus = 'draft' | 'active' | 'inactive' | 'archived' | 'pending' | 'approved' | 'rejected' | 'suspended'

export interface FeedbackTranslation {
  locale: string
  title:  string | null
  body:   string | null
}

export interface Feedback {
  id:               string
  site_id:          string
  feedback_type:    FeedbackType
  entity_type:      string | null
  entity_id:        string | null
  author_name:      string
  author_email:     string | null
  author_title:     string | null
  author_company:   string | null
  author_location:  string | null
  author_avatar:    string | null
  rating:           number
  body:             string | null
  service_type:     string | null
  project_type:     string | null
  is_featured:      boolean
  is_verified:      boolean
  sort_order:       number
  status:           FeedbackStatus
  submitted_at:     string
  created_at:       string
  updated_at:       string
  deleted_at:       string | null
  translations:     FeedbackTranslation[]
}

export interface FeedbackCreateRequest {
  site_id:         string
  feedback_type?:  FeedbackType
  author_name:     string
  author_email?:   string
  author_title?:   string
  author_company?: string
  author_location?: string
  author_avatar?:  string
  rating?:         number
  body?:           string
  service_type?:   string
  project_type?:   string
  is_featured?:    boolean
  sort_order?:     number
  status?:         FeedbackStatus
  entity_type?:    string
  entity_id?:      string
}

export interface FeedbackUpdateRequest extends Partial<FeedbackCreateRequest> {}

// ── Pricing Package ───────────────────────────────────────────────────────

export interface PricingPackage {
  id: string
  site_id: string
  slug: string
  service_id: string | null
  price: number | null
  price_max: number | null
  currency: string | null
  billing_period: string | null
  sort_order: number
  is_featured: boolean
  is_popular: boolean
  status: ContentStatus
  created_at: string
  updated_at: string
  translations: Translation[]
}

export interface PricingCreateRequest {
  site_id?: string
  slug: string
  service_id?: string
  price?: number
  price_max?: number
  currency?: string
  billing_period?: string
  sort_order?: number
  is_featured?: boolean
  is_popular?: boolean
  status?: ContentStatus
  translation: { locale: string; title: string; excerpt?: string; body?: unknown }
}

export interface PricingUpdateRequest extends Partial<PricingCreateRequest> {}

// ── Hero Slide ────────────────────────────────────────────────────────────

// Hero slides use a different status set than the generic ContentStatus
export type HeroStatus = 'draft' | 'active' | 'inactive' | 'archived' | 'suspended'

// Translation shape as stored in content_translations.
// 'description' from the old hero_slide_translations is now 'excerpt'.
// 'cta_label' and 'category' live in the extra JSONB column.
export interface HeroSlideTranslation {
  locale: string
  title: string | null
  subtitle: string | null
  /** Maps to content_translations.excerpt */
  excerpt: string | null
  meta_title?: string | null
  meta_description?: string | null
  extra?: {
    cta_label?: string | null
    category?: string | null
    [key: string]: unknown
  }
}

// HeroSlide now maps to the unified content_items table.
// image_url  → cover_image
// href       → extra.href
// story_id   → extra.story_id
export interface HeroSlide {
  id: string
  site_id: string
  content_type: 'hero'
  slug: string
  /** Hero image URL — stored as cover_image in content_items */
  cover_image: string
  location: string | null
  region: string | null
  sort_order: number
  status: HeroStatus
  created_at: string
  updated_at: string
  extra: {
    href?: string | null
    story_id?: string | null
    [key: string]: unknown
  }
  translations: HeroSlideTranslation[]
}

export interface HeroSlideCreateRequest {
  site_id: string
  /** Must be unique per site — generate as 'hero-{sort_order}-{timestamp}' */
  slug: string
  cover_image: string
  location?: string
  region?: string
  sort_order?: number
  status?: HeroStatus
  extra?: {
    href?: string
    [key: string]: unknown
  }
}

export interface HeroSlideUpdateRequest {
  cover_image?: string
  location?: string
  region?: string
  sort_order?: number
  status?: HeroStatus
  extra?: {
    href?: string
    [key: string]: unknown
  }
}

// ── Comment ───────────────────────────────────────────────────────────────

export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam'

export interface Comment {
  id: string
  site_id: string
  entity_type: string
  entity_id: string
  parent_id: string | null
  author_name: string
  author_email: string | null
  author_avatar: string | null
  body: string
  reply_count: number
  status: CommentStatus
  created_at: string
  updated_at: string
}

export interface CommentUpdateRequest {
  status?: CommentStatus
  body?: string
}

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
export function getTitle(item: { translations?: { title?: string }[] | null; slug?: string }): string {
  return item.translations?.[0]?.title ?? item.slug ?? '—'
}

/** Get the first translation's excerpt */
export function getExcerpt(item: { translations?: { excerpt?: string }[] | null }): string | undefined {
  return item.translations?.[0]?.excerpt
}

/** Get Destination display name from translations */
export function getDestName(item: { translations?: (Translation & { name?: string })[] | null; slug?: string }): string {
  return item.translations?.[0]?.name ?? item.translations?.[0]?.title ?? item.slug ?? '—'
}

// ── Campaign ──────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string
  site_id: string
  slug: string
  cover_image: string | null
  start_date: string | null
  end_date: string | null
  cta_label: string | null
  cta_url: string | null
  is_featured: boolean
  status: ContentStatus
  sort_order: number
  created_at: string
  updated_at: string
  translations: Translation[]
}

export interface CampaignCreateRequest {
  site_id?: string
  slug: string
  cover_image?: string
  start_date?: string
  end_date?: string
  cta_label?: string
  cta_url?: string
  is_featured?: boolean
  status?: ContentStatus
  sort_order?: number
  translation: { locale: string; title: string; excerpt?: string; body?: unknown }
}

export interface CampaignUpdateRequest extends Partial<CampaignCreateRequest> {}

// ── SEO Metadata ─────────────────────────────────────────────────────────────

export interface SeoMetadata {
  id?: string
  site_id?: string
  page_type?: string
  locale?: string
  entity_id?: string | null
  title?: string
  description?: string
  og_title?: string
  og_description?: string
  og_image?: string
  og_url?: string
  og_type?: string
  canonical?: string
  robots?: string
  keywords?: string
  twitter_card?: string
  twitter_site?: string
  twitter_title?: string
  twitter_description?: string
  twitter_image?: string
  schema_markup?: Record<string, unknown>
  noindex?: boolean
  nofollow?: boolean
}

export interface SeoSaveRequest extends Omit<SeoMetadata, 'id' | 'site_id' | 'entity_id'> {
  page_type?: string
  locale?: string
}
