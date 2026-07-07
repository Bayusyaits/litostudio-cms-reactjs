/**
 * editor.types.ts — Block editor data model.
 *
 * The `page_translations.body` column stores a BlockDocument as JSON.
 * The editor reads/writes this shape exclusively.
 */

// ── Block type identifiers ────────────────────────────────────────────────────

export type BlockType =
  | 'text'
  | 'heading'
  | 'image'
  | 'gallery'
  | 'video'
  | 'button'
  | 'spacer'
  | 'divider'
  | 'hero'
  | 'cta'
  | 'services'
  | 'pricing'
  | 'testimonials'
  | 'faq'
  | 'team'
  | 'statistics'
  | 'products'
  | 'collections'
  | 'journal'
  | 'story'
  | 'contact_form'
  | 'newsletter'
  | 'map'
  | 'social_links'
  | 'html'
  // ── Lito template-specific blocks ────────────────────────────────────────
  | 'about'                // Lito: about / studio intro section
  | 'campaign'             // Lito: campaign banner (image + CTA)
  | 'story_categories'     // Lito: story categories grid
  | 'destinations_grid'    // Lito: destinations/locations grid
  | 'portfolio'            // Lito: dark-bg portfolio grid
  | 'booking'              // Lito: booking/calendar section
  | 'packages'             // Lito: photography packages
  // ── Fashion template-specific blocks ─────────────────────────────────────
  | 'new_arrival'          // Fashion: new arrivals product grid
  | 'brand_story'          // Fashion: brand story / about section
  | 'lookbook'             // Fashion: lookbook editorial grid
  | 'campaign_banner'      // Fashion: full-width campaign banner
  | 'philosophy'           // Fashion: brand philosophy pillars
  | 'timeline'             // Fashion: brand timeline
  | 'collaborations'       // Fashion: collaborations / partners grid
  | 'social_grid'          // Fashion: social media links grid
  | 'marquee'              // Fashion: scrolling text marquee
  | 'promo_banners'        // Fashion: dual promo banner blocks
  | 'about_cta'            // Fashion: about page CTA section
  | 'product_carousel'     // Fashion: product carousel / swiper
  | 'promo_banners'        // Fashion: dual promo banner blocks (DB section type)
  | 'stores'               // Fashion: multi-store location cards grid (FIX-08)
  // ── Beauty template-specific blocks ──────────────────────────────────────
  | 'campaigns_grid'       // Beauty: campaign promotions grid
  | 'collection_banner'    // Beauty: collection banner hero
  | 'product_benefits'     // Beauty: product benefits grid
  | 'product_categories'   // Beauty: product categories grid
  | 'founder_quote'        // Beauty: founder/brand quote
  | 'blog_highlight'       // Beauty: highlighted blog posts
  | 'featured_products'    // Beauty: featured products grid
  // ── Cross-template CMS section types ──────────────────────────────────────
  | 'page_hero'            // Fashion/generic: full-width inner-page hero
  | 'contact_cards'        // Fashion: address/phone/email cards strip
  | 'contact_cta'          // Fashion: closing CTA strip on contact/about
  | 'contact'              // All templates: contact form + info section
  | 'rich_text'            // All templates: standalone rich text block
  // ── Listing page section types (CMS listing pages rendered as full sections) ─
  | 'journal_listing'      // Fashion/beauty: paginated journal post grid
  | 'stories_listing'      // Fashion/beauty: featured + paginated story grid
  | 'gallery_listing'      // Fashion/beauty: masonry gallery with filter pills
  | 'blogs_listing'        // All templates: blog post listing grid (alias)
  | 'destinations_listing' // Lito: destinations listing page (fashion-styled)
  // ── Lito-specific listing section types ──────────────────────────────────────
  | 'lito_journal_listing'      // Lito: editorial journal listing (light serif hero)
  | 'lito_stories_listing'      // Lito: editorial stories listing (light serif hero)
  | 'lito_gallery_listing'      // Lito: visual archive gallery listing (light serif hero)
  | 'lito_destinations_listing' // Lito: destinations listing (light serif hero)
  // ── Alias block types (normalised by backend before publish) ─────────────
  | 'destinations'         // → destinations_grid (alias used in registry)
  | 'offerings'            // → services (alias used in fashion registry)
  | 'stories'              // → story (alias used in lito registry)

// ── Rich text metadata ────────────────────────────────────────────────────────
//
// Shared by CMS editor canvas + website renderer.
// CKEditor / contentEditable stores formatting as HTML; tag/align are
// explicit structural metadata persisted alongside the HTML so the
// website can apply them without parsing the HTML string.
//
// Schema version: "1.0-rich"

export type RichTextAlign = 'left' | 'center' | 'right' | 'justify'

export type RichTextTag =
  | 'p'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'blockquote'

export interface RichTextData {
  /** Raw HTML string — output from CKEditor or contentEditable */
  html:    string
  /**
   * Semantic tag applied to the outermost wrapper.
   * 'p' = paragraph (default), 'h1'–'h6' = headings.
   */
  tag?:    RichTextTag
  /** Block-level text alignment */
  align?:  RichTextAlign
}

// ── Per-block data shapes ─────────────────────────────────────────────────────

/** Text block: full CKEditor output — HTML + structural metadata */
export interface TextBlockData extends RichTextData {
  /** Alias kept for backwards-compat when old docs only have html key */
  html: string
}

export interface HeadingBlockData {
  text:  string
  level: 1 | 2 | 3 | 4 | 5 | 6
  /** Optional alignment override — defaults to left */
  align?: RichTextAlign
}

export interface ImageBlockData {
  src: string
  alt: string
  caption?: string
  width?: 'full' | 'wide' | 'normal' | 'small'
  link?: string
}

export interface GalleryBlockData {
  images: Array<{ src: string; alt: string; caption?: string }>
  columns: 2 | 3 | 4
  gap: 'none' | 'sm' | 'md' | 'lg'
}

export interface VideoBlockData {
  url: string           // YouTube / Vimeo URL
  autoplay?: boolean
  loop?: boolean
  caption?: string
}

export interface ButtonBlockData {
  text: string
  url: string
  variant: 'primary' | 'secondary' | 'outline' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  align: 'left' | 'center' | 'right'
  newTab?: boolean
}

export interface SpacerBlockData {
  height: number   // px
}

export interface DividerBlockData {
  style: 'solid' | 'dashed' | 'dotted' | 'double'
  width: 'full' | 'wide' | 'normal'
  color?: string
}

export interface HeroBlockData {
  title: string
  titleItalic?: string         // italic/display portion appended to title
  eyebrow?: string             // small label above title e.g. "EDITORIAL · JAKARTA"
  subtitle?: string
  ctaText?: string
  ctaUrl?: string
  ctaSecondaryText?: string
  ctaSecondaryUrl?: string
  stat?: string                // bottom stat label e.g. "500+ sesi"
  location?: string            // bottom location e.g. "Jakarta · Yogyakarta"
  backgroundImage?: string
  backgroundOverlay?: number   // 0-100
  minHeight?: number           // px
  align: 'left' | 'center' | 'right'
}

export interface CTABlockData {
  title: string
  description?: string
  buttonText: string
  buttonUrl: string
  variant: 'light' | 'dark' | 'brand'
  align: 'left' | 'center' | 'right'
}

export interface ServicesBlockData {
  heading?: string
  sectionNumber?: string
  sectionLabel?: string
  items: Array<{
    icon?: string
    title: string
    description: string
    link?: string
  }>
  columns: 2 | 3 | 4
}

export interface PricingBlockData {
  heading?: string
  plans: Array<{
    name: string
    price: string
    period?: string
    description?: string
    features: string[]
    ctaText: string
    ctaUrl: string
    featured?: boolean
  }>
}

export interface TestimonialsBlockData {
  heading?: string
  sectionNumber?: string
  sectionLabel?: string
  items: Array<{
    quote: string
    name: string
    title?: string
    avatar?: string
    rating?: 1 | 2 | 3 | 4 | 5
  }>
  layout: 'grid' | 'carousel'
}

export interface FAQBlockData {
  heading?: string
  items: Array<{
    question: string
    answer: string
  }>
}

export interface TeamBlockData {
  heading?: string
  members: Array<{
    name: string
    role?: string
    bio?: string
    photo?: string
    social?: { linkedin?: string; instagram?: string; twitter?: string }
  }>
  columns: 2 | 3 | 4
}

export interface StatisticsBlockData {
  heading?: string
  items: Array<{
    value: string
    label: string
    prefix?: string
    suffix?: string
    number?: string   // alias for value used in some patterns
  }>
  columns: 2 | 3 | 4
}

export interface ProductsBlockData {
  heading?: string
  source: 'all' | 'featured' | 'collection'
  collectionId?: string
  limit: number
  columns: 2 | 3 | 4
  showPrice?: boolean
  showCTA?: boolean
}

export interface CollectionsBlockData {
  heading?: string
  limit: number
  columns: 2 | 3 | 4
}

export interface JournalBlockData {
  heading?: string
  sectionNumber?: string
  sectionLabel?: string
  limit: number
  columns: 2 | 3
  showExcerpt?: boolean
}

export interface StoryBlockData {
  heading?: string
  limit: number
  layout: 'grid' | 'list'
}

export interface ContactFormBlockData {
  heading?: string
  description?: string
  submitText?: string
  fields: Array<{
    name: string
    label: string
    type: 'text' | 'email' | 'phone' | 'textarea' | 'select'
    required?: boolean
    options?: string[]   // for select
  }>
}

export interface NewsletterBlockData {
  heading?: string
  description?: string
  placeholder?: string
  buttonText?: string
  successMessage?: string
}

export interface MapBlockData {
  src: string       // Google Maps embed URL
  height?: number   // px
}

export interface SocialLinksBlockData {
  links: Array<{
    platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'pinterest' | 'website'
    url: string
  }>
  align: 'left' | 'center' | 'right'
  size: 'sm' | 'md' | 'lg'
}

export interface HTMLBlockData {
  html: string
}

// ── Template-specific block data ─────────────────────────────────────────────

export interface DestinationsGridBlockData {
  heading?: string
  items: Array<{
    name:        string
    country?:    string
    description?: string
    image?:      string
    link?:       string
    featured?:   boolean
  }>
  columns: 2 | 3
}

export interface PortfolioBlockData {
  heading?: string
  items: Array<{
    title:        string
    category?:    string
    image?:       string
    description?: string
    link?:        string
    featured?:    boolean
  }>
  columns: 2 | 3 | 4
}

export interface BookingBlockData {
  heading?:     string
  description?: string
  calendarUrl?: string
  ctaText?:     string
  showForm?:    boolean
}

export interface PackagesBlockData {
  heading?: string
  items: Array<{
    name:        string
    price:       string
    description?: string
    includes:    string[]
    ctaText?:    string
    ctaUrl?:     string
    featured?:   boolean
  }>
}

// ── Lito-specific section data ────────────────────────────────────────────────

export interface AboutBlockData {
  heading?:          string
  title?:            string   // alias for heading (brand_story uses both)
  eyebrow?:          string
  description?:      string
  image?:            string
  ctaText?:          string
  ctaUrl?:           string
  ctaVariant?:       string
  since?:            string
  yearsStrongLabel?: string   // label next to since year (default "Years Strong")
  missionLabel?:     string   // bold prefix on mission paragraph (default "Our Mission")
  values?:           string[] // brand value tags — CMS-editable list
  cities?:           string
  // Stats grid (lito template — 3 editable stat tiles)
  sessionsValue?: string
  sessionsLabel?: string
  yearsValue?:    string
  yearsLabel?:    string
  citiesCount?:   string
  citiesLabel?:   string
}

export interface CampaignBlockData {
  heading?:     string
  description?: string
  image?:       string
  ctaText?:     string
  ctaUrl?:      string
}

export interface StoryCategoriesBlockData {
  heading?:       string
  sectionLabel?:  string
  sectionNumber?: string
  limit?:         number
}

export interface CampaignsGridBlockData {
  heading?: string
  limit:    number
  status?:  'published' | 'all'
  columns:  2 | 3
}

// ── Fashion-specific section data ─────────────────────────────────────────────

export interface NewArrivalBlockData {
  title?:        string
  catalogueText?: string
  catalogueLink?: string
  productCount?: number
}

export interface BrandStoryBlockData {
  heading?:     string
  title?:       string
  description?: string
  image?:       string
  ctaText?:     string
  ctaUrl?:      string
  since?:       string
}

export interface LookbookBlockData {
  title?:   string
  eyebrow?: string
}

export interface CampaignBannerBlockData {
  heading?:         string
  description?:     string
  eyebrow?:         string
  title?:           string
  backgroundImage?: string
  buttonText?:      string
  primaryLink?:     string
  ctaSecondaryText?: string
  ctaSecondaryLink?: string
  image?:           string
}

export interface PhilosophyBlockData {
  title?:   string
  heading?: string
  eyebrow?: string
  items?: Array<{ icon?: string; number?: string; title: string; desc: string }>
}

export interface TimelineBlockData {
  title?:   string
  eyebrow?: string
  entries?: Array<{ year: string; title: string; description: string }>
}

export interface CollaborationsBlockData {
  title?:   string
  eyebrow?: string
}

export interface SocialGridBlockData {
  title?:   string
  eyebrow?: string
}

export interface MarqueeBlockData {
  items?: string[]
}

export interface PromoBannersBlockData {
  items?: Array<{ image: string; title: string; link: string; buttonText?: string; sub?: string }>
}

export interface FounderQuoteBlockData {
  eyebrow?:     string
  quote?:       string
  founderName?: string
  founderRole?: string
  image?:       string
}

export interface ProductBenefitsBlockData {
  eyebrow?: string
  heading?: string
  items?: Array<{
    eyebrow?:     string
    title?:       string
    description?: string
    image?:       string
    ctaLabel?:    string
    ctaUrl?:      string
    statValue?:   string
    statLabel?:   string
  }>
}

export interface AboutCTABlockData {
  eyebrow?:      string
  title?:        string
  desc?:         string
  description?:  string
  email?:        string
  ctaText?:      string
  ctaLink?:      string
  homeText?:     string
  homeLink?:     string
  // Fashion: about_cta section fields
  shopText?:     string
  shopLink?:     string
  contactText?:  string
  contactLink?:  string
}

export interface ProductCarouselBlockData {
  title?:        string
  limit?:        number
  categorySlug?: string
}

export interface StoresBlockData {
  eyebrow?: string
  heading?: string
  items?: Array<{
    name?:     string
    title?:    string   // alias for name used in some block defaults
    address?:  string
    phone?:    string
    hours?:    string
    mapImage?: string
    mapUrl?:   string
  }>
}

// ── Cross-template CMS section data ──────────────────────────────────────────

export interface PageHeroBlockData {
  eyebrow?:    string
  title?:      string
  desc?:       string
  description?: string
  imgSrc?:     string
  imgAlt?:     string
  alt?:        string
  backgroundImage?: string
  ctaLabel?:   string
  ctaHref?:    string
  ctaText?:    string
  ctaUrl?:     string
  height?:     string   // viewport height e.g. '55vh', '70vh'
}

export interface ContactCardsBlockData {
  heading?: string
  items?: Array<{ icon?: string; label: string; value: string }>
}

export interface ContactCTABlockData {
  eyebrow?:      string
  title?:        string
  desc?:         string
  description?:  string
  email?:        string
  ctaText?:      string
  ctaLink?:      string
  ctaUrl?:       string
  homeText?:     string
  homeLink?:     string
  whatsappUrl?:  string
  whatsappText?: string
}

export interface ContactSectionBlockData {
  heading?:     string
  description?: string
  submitText?:  string
  buttonText?:  string
}

export interface RichTextSectionBlockData {
  html?: string
}

// ── Listing page block data interfaces ───────────────────────────────────────

export interface JournalListingBlockData {
  eyebrow?:     string
  title?:       string
  heading?:     string
  description?: string
  heroImage?:   string
}

export interface StoriesListingBlockData {
  eyebrow?:     string
  title?:       string
  heading?:     string
  description?: string
  heroImage?:   string
}

export interface GalleryListingBlockData {
  eyebrow?:     string
  title?:       string
  heading?:     string
  description?: string
}

// ── Union ─────────────────────────────────────────────────────────────────────

export type BlockData =
  | TextBlockData | HeadingBlockData | ImageBlockData | GalleryBlockData
  | VideoBlockData | ButtonBlockData | SpacerBlockData | DividerBlockData
  | HeroBlockData | CTABlockData | ServicesBlockData | PricingBlockData
  | TestimonialsBlockData | FAQBlockData | TeamBlockData | StatisticsBlockData
  | ProductsBlockData | CollectionsBlockData | JournalBlockData | StoryBlockData
  | ContactFormBlockData | NewsletterBlockData | MapBlockData
  | SocialLinksBlockData | HTMLBlockData
  // Template-specific (Lito/Beauty)
  | DestinationsGridBlockData | PortfolioBlockData
  | BookingBlockData | PackagesBlockData | CampaignsGridBlockData
  | AboutBlockData | CampaignBlockData | StoryCategoriesBlockData
  | FounderQuoteBlockData | ProductBenefitsBlockData
  // Template-specific (Fashion)
  | NewArrivalBlockData | BrandStoryBlockData | LookbookBlockData
  | CampaignBannerBlockData | PhilosophyBlockData | TimelineBlockData
  | CollaborationsBlockData | SocialGridBlockData | MarqueeBlockData
  | PromoBannersBlockData | AboutCTABlockData | ProductCarouselBlockData
  | StoresBlockData
  // Cross-template CMS section types
  | PageHeroBlockData | ContactCardsBlockData | ContactCTABlockData
  | ContactSectionBlockData | RichTextSectionBlockData
  // Listing page sections
  | JournalListingBlockData | StoriesListingBlockData | GalleryListingBlockData

// ── Block styles ──────────────────────────────────────────────────────────────

export interface BlockStyles {
  paddingTop?: number
  paddingBottom?: number
  paddingLeft?: number
  paddingRight?: number
  marginTop?: number
  marginBottom?: number
  backgroundColor?: string
  textColor?: string
  textAlign?: 'left' | 'center' | 'right'
  maxWidth?: 'full' | 'xl' | 'lg' | 'md' | 'sm'
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  customCss?: string
  customId?: string
}

// ── Block visibility / conditions ─────────────────────────────────────────────

export interface BlockVisibility {
  desktop?: boolean
  tablet?: boolean
  mobile?: boolean
}

export interface BlockCondition {
  field: string
  operator: 'eq' | 'neq' | 'contains'
  value: string
}

// ── The Block ─────────────────────────────────────────────────────────────────

export interface Block {
  id: string
  type: BlockType
  data: BlockData
  styles?: BlockStyles
  visibility?: BlockVisibility
  conditions?: BlockCondition[]
  /** SEO metadata override at block level (e.g. for hero) */
  seo?: {
    title?: string
    description?: string
  }
  /** Animation */
  animation?: {
    type?: string
    duration?: number
    delay?: number
  }
  /** Arbitrary id used to group blocks (for columns/grids) */
  groupId?: string
  /** User-defined display name (shown in context menu / layer list) */
  name?: string
  /** When true: block cannot be selected, moved, or deleted until unlocked */
  locked?: boolean
}

// ── Block document ────────────────────────────────────────────────────────────

export interface BlockDocument {
  version: '1.0'
  locale: string
  blocks: Block[]
  seo?: {
    title?: string
    description?: string
    ogImage?: string
  }
}

// ── Editor state ──────────────────────────────────────────────────────────────

export type EditorTab = 'content' | 'styles' | 'spacing' | 'layout' | 'seo' | 'visibility' | 'conditions' | 'animation' | 'history'
export type LeftPanelTab = 'blocks' | 'pages' | 'templates' | 'media' | 'patterns'
export type PreviewMode = 'desktop' | 'tablet' | 'mobile'
/** Top-level editor mode — Content edits blocks, Design edits visuals, Preview shows final output, Code edits raw JSON */
export type EditorMode = 'content' | 'design' | 'preview' | 'code'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ── Block library entry ───────────────────────────────────────────────────────

export type BlockCategory = 'text' | 'media' | 'layout' | 'commerce' | 'forms' | 'social' | 'template'

export interface BlockLibraryItem {
  type: BlockType
  label: string
  icon: string         // lucide icon name or emoji
  category: BlockCategory
  description: string
  defaultData: BlockData
  defaultStyles?: BlockStyles
  /** Which template slug(s) this block is scoped to (undefined = all templates) */
  templateScope?: string[]
}
