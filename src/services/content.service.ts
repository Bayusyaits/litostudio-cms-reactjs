import { http } from '@/lib/request'
import type { ApiResponse, PaginatedResponse, ListParams, BulkUpdateRequest, BulkDeleteRequest, BulkUpdateResponse, BulkDeleteResponse } from '@/types/api.types'
import type { Story, StoryCreateRequest, StoryUpdateRequest, JournalPost, JournalCreateRequest, JournalUpdateRequest, GalleryItem, GalleryCreateRequest, GalleryUpdateRequest, Destination, Product, ProductCreateRequest, ProductUpdateRequest, Collection, CollectionCreateRequest, CollectionUpdateRequest, Review, ReviewUpdateRequest, Faq, FaqCreateRequest, FaqUpdateRequest, Service, ServiceCreateRequest, ServiceUpdateRequest, Testimonial, TestimonialCreateRequest, TestimonialUpdateRequest, Feedback, FeedbackCreateRequest, FeedbackUpdateRequest, PricingPackage, PricingCreateRequest, PricingUpdateRequest, HeroSlide, HeroSlideCreateRequest, HeroSlideUpdateRequest, Comment, CommentUpdateRequest, Campaign, CampaignCreateRequest, CampaignUpdateRequest, SeoMetadata, SeoSaveRequest } from '@/types/content.types'
import type { Order, UpdateOrderStatusRequest, NewsletterSubscriber, UpdateNewsletterStatusRequest, ContactMessage } from '@/types/commerce.types'

// ── Generic content service factory ─────────────────────────────────────

function buildParams(params: ListParams & { site_id?: string }): Record<string, string> {
  const q: Record<string, string> = {}
  if (params.page)    q.page    = String(params.page)
  if (params.limit)   q.limit   = String(params.limit)
  if (params.search)  q.search  = params.search
  if (params.status)  q.status  = params.status
  if (params.sort)    q.sort    = params.sort
  if (params.order)   q.order   = params.order
  if (params.site_id) q.site_id = params.site_id
  return q
}

/**
 * Generic CRUD service for a named backend path.
 * Used by modules with their own dedicated backend routes
 * (e.g. /products, /collections, /feedbacks, /campaigns).
 */
function createContentService<Entity, CreateDTO, UpdateDTO>(basePath: string) {
  return {
    async getList(params?: ListParams & { site_id?: string }) {
      const query = params ? new URLSearchParams(buildParams(params)).toString() : ''
      const url = query ? `${basePath}?${query}` : basePath
      const data = await http.get<PaginatedResponse<Entity>>(url)
      return data
    },

    async getById(id: string) {
      const data = await http.get<ApiResponse<Entity>>(`${basePath}/${id}`)
      return data.data
    },

    async create(payload: CreateDTO) {
      const data = await http.post<ApiResponse<Entity>>(basePath, payload)
      return data.data
    },

    async update(id: string, payload: UpdateDTO) {
      const data = await http.patch<ApiResponse<Entity>>(`${basePath}/${id}`, payload)
      return data.data
    },

    async remove(id: string) {
      await http.delete(`${basePath}/${id}`)
    },

    async bulkUpdate(payload: BulkUpdateRequest) {
      const data = await http.patch<BulkUpdateResponse>(`${basePath}/bulk`, payload)
      return data
    },

    async bulkDelete(payload: BulkDeleteRequest) {
      const data = await http.delete<BulkDeleteResponse>(`${basePath}/bulk`, payload)
      return data
    },

    async upsertTranslation(id: string, locale: string, payload: Record<string, unknown>) {
      const data = await http.put<ApiResponse<unknown>>(`${basePath}/${id}/translations/${locale}`, payload)
      return data.data
    },
  }
}

/**
 * Service factory for content types stored in the unified `content_items` table.
 * All data lives at /api/v1/cms/content/items with a `type` query param.
 *
 * - GET list:   injects `type=<contentType>` automatically
 * - POST:       injects `content_type: <contentType>` into the body
 * - PATCH/PUT/DELETE: use item ID — no type injection needed
 *
 * Correct for: story, journal, gallery, destination, hero
 */
function createContentItemService<Entity, CreateDTO, UpdateDTO>(contentType: string) {
  const BASE = '/api/v1/cms/content/items'

  return {
    async getList(params?: ListParams & { site_id?: string }) {
      const q = buildParams(params ?? {})
      q.type = contentType
      const url = `${BASE}?${new URLSearchParams(q).toString()}`
      const data = await http.get<PaginatedResponse<Entity>>(url)
      return data
    },

    async getById(id: string) {
      const data = await http.get<ApiResponse<Entity>>(`${BASE}/${id}`)
      return data.data
    },

    async create(payload: CreateDTO) {
      const data = await http.post<ApiResponse<Entity>>(BASE, { ...(payload as Record<string, unknown>), content_type: contentType })
      return data.data
    },

    async update(id: string, payload: UpdateDTO) {
      const data = await http.patch<ApiResponse<Entity>>(`${BASE}/${id}`, payload)
      return data.data
    },

    async remove(id: string) {
      await http.delete(`${BASE}/${id}`)
    },

    async bulkUpdate(payload: BulkUpdateRequest) {
      const data = await http.patch<BulkUpdateResponse>(`${BASE}/bulk`, payload)
      return data
    },

    async bulkDelete(payload: BulkDeleteRequest) {
      const data = await http.delete<BulkDeleteResponse>(`${BASE}/bulk`, payload)
      return data
    },

    async upsertTranslation(id: string, locale: string, payload: Record<string, unknown>) {
      const data = await http.put<ApiResponse<unknown>>(`${BASE}/${id}/translations/${locale}`, payload)
      return data.data
    },
  }
}

// ── Module-specific services ──────────────────────────────────────────────
//
// Routing legend (verified from backend routes.ts + migration history):
//   content_items table  → /api/v1/cms/content/items  (via createContentItemService)
//   feedbacks table      → /api/v1/cms/content/feedbacks
//   products table       → /api/v1/cms/content/products
//   collections table    → /api/v1/cms/content/collections
//   campaigns table      → /api/v1/cms/content/campaigns
//   faqs table           → /api/v1/cms/content/faqs
//   orders table         → /api/v1/cms/content/orders
//   comments table       → /api/v1/cms/content/comments
//   newsletter table     → /api/v1/cms/content/newsletter

// Stories, Journal, Gallery, Destinations, Hero → content_items (type filter)
export const storiesService       = createContentItemService<Story,          StoryCreateRequest,       StoryUpdateRequest>(      'story')
export const journalService       = createContentItemService<JournalPost,    JournalCreateRequest,     JournalUpdateRequest>(    'journal')
export const galleryService       = createContentItemService<GalleryItem,    GalleryCreateRequest,     GalleryUpdateRequest>(    'gallery')
export const destinationsService  = createContentItemService<Destination,    Record<string,unknown>,   Record<string,unknown>>(  'destination')
export const heroService          = createContentItemService<HeroSlide,      HeroSlideCreateRequest,   HeroSlideUpdateRequest>(  'hero')

// Reviews & Testimonials → feedbacks table
export const reviewsService       = createContentService<Review,         Record<string,unknown>,    ReviewUpdateRequest>(       '/api/v1/cms/content/feedbacks')
export const testimonialsService  = createContentService<Testimonial,    TestimonialCreateRequest,  TestimonialUpdateRequest>(  '/api/v1/cms/content/feedbacks')
export const feedbacksService     = createContentService<Feedback,       FeedbackCreateRequest,     FeedbackUpdateRequest>(     '/api/v1/cms/content/feedbacks')

// Services & Pricing → products table (product_type='service'/'package')
export const servicesService      = createContentService<Service,        ServiceCreateRequest,      ServiceUpdateRequest>(      '/api/v1/cms/content/products')
export const pricingService       = createContentService<PricingPackage, PricingCreateRequest,      PricingUpdateRequest>(      '/api/v1/cms/content/products')

// Dedicated routes
export const productsService      = createContentService<Product,        ProductCreateRequest,      ProductUpdateRequest>(      '/api/v1/cms/content/products')
export const collectionsService   = createContentService<Collection,     CollectionCreateRequest,   CollectionUpdateRequest>(   '/api/v1/cms/content/collections')
export const faqsService          = createContentService<Faq,            FaqCreateRequest,          FaqUpdateRequest>(          '/api/v1/cms/content/faqs')
export const commentsService      = createContentService<Comment,        Record<string,unknown>,    CommentUpdateRequest>(      '/api/v1/cms/content/comments')
export const campaignsService     = createContentService<Campaign,       CampaignCreateRequest,     CampaignUpdateRequest>(     '/api/v1/cms/content/campaigns')

// ── Commerce services ─────────────────────────────────────────────────────────

// Orders use a custom updateStatus endpoint (PATCH /:id/status)
const _ordersBase = createContentService<Order, Record<string,unknown>, Record<string,unknown>>('/api/v1/cms/content/orders')
export const ordersService = {
  ..._ordersBase,
  async updateStatus(id: string, payload: UpdateOrderStatusRequest) {
    const data = await http.patch<ApiResponse<Order>>(`/api/v1/cms/content/orders/${id}/status`, payload)
    return data.data
  },
}

export const newsletterService = createContentService<NewsletterSubscriber, Record<string,unknown>, UpdateNewsletterStatusRequest>('/api/v1/cms/content/newsletter')

// ── SEO service ───────────────────────────────────────────────────────────────

export const seoService = {
  async get(siteId: string, pageType = 'site', locale = 'id') {
    const q = new URLSearchParams({ page_type: pageType, locale }).toString()
    const data = await http.get<{ success: boolean; data: SeoMetadata }>(`/api/v1/cms/sites/${siteId}/seo?${q}`)
    return data.data
  },
  async save(siteId: string, payload: SeoSaveRequest) {
    return http.put<{ success: boolean; message: string }>(`/api/v1/cms/sites/${siteId}/seo`, payload)
  },
}

// ── Messages (contact_submissions) ────────────────────────────────────────────
// Read-only from CMS — contact module owns mutations
export const messagesService = {
  async getList(params?: ListParams & { site_id?: string }) {
    const q: Record<string, string> = {}
    if (params?.page)    q.page    = String(params.page)
    if (params?.limit)   q.limit   = String(params.limit)
    if (params?.search)  q.search  = params.search
    if (params?.status)  q.status  = params.status
    if (params?.site_id) q.site_id = params.site_id
    const qs = new URLSearchParams(q).toString()
    const url = qs ? `/api/v1/cms/contact?${qs}` : '/api/v1/cms/contact'
    return http.get<PaginatedResponse<ContactMessage>>(url)
  },
  async getById(id: string) {
    const data = await http.get<ApiResponse<ContactMessage>>(`/api/v1/cms/contact/${id}`)
    return data.data
  },
  async markRead(id: string) {
    const data = await http.patch<ApiResponse<ContactMessage>>(`/api/v1/cms/contact/${id}`, { status: 'read' })
    return data.data
  },
  async markReplied(id: string) {
    const data = await http.patch<ApiResponse<ContactMessage>>(`/api/v1/cms/contact/${id}`, { status: 'replied' })
    return data.data
  },
  async remove(id: string) {
    await http.delete(`/api/v1/cms/contact/${id}`)
  },
}
