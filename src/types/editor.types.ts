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

// ── Per-block data shapes ─────────────────────────────────────────────────────

export interface TextBlockData {
  html: string
}

export interface HeadingBlockData {
  text: string
  level: 1 | 2 | 3 | 4 | 5 | 6
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
  subtitle?: string
  ctaText?: string
  ctaUrl?: string
  ctaSecondaryText?: string
  ctaSecondaryUrl?: string
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

// ── Union ─────────────────────────────────────────────────────────────────────

export type BlockData =
  | TextBlockData | HeadingBlockData | ImageBlockData | GalleryBlockData
  | VideoBlockData | ButtonBlockData | SpacerBlockData | DividerBlockData
  | HeroBlockData | CTABlockData | ServicesBlockData | PricingBlockData
  | TestimonialsBlockData | FAQBlockData | TeamBlockData | StatisticsBlockData
  | ProductsBlockData | CollectionsBlockData | JournalBlockData | StoryBlockData
  | ContactFormBlockData | NewsletterBlockData | MapBlockData
  | SocialLinksBlockData | HTMLBlockData

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

export type EditorTab = 'content' | 'styles' | 'spacing' | 'layout' | 'seo' | 'visibility' | 'conditions' | 'animation'
export type LeftPanelTab = 'blocks' | 'pages' | 'templates' | 'media' | 'patterns'
export type PreviewMode = 'desktop' | 'tablet' | 'mobile'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ── Block library entry ───────────────────────────────────────────────────────

export interface BlockLibraryItem {
  type: BlockType
  label: string
  icon: string         // lucide icon name or emoji
  category: 'text' | 'media' | 'layout' | 'commerce' | 'forms' | 'social'
  description: string
  defaultData: BlockData
  defaultStyles?: BlockStyles
}
