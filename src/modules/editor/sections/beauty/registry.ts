/**
 * sections/beauty/registry.ts
 *
 * CMS canvas section registry for the Beauty template.
 * Maps block.type → TSX preview component.
 *
 * Pattern mirrors apps/website/templates/beauty/components/sections/registry.ts.
 * BlockRenderer delegates to this map when template === 'beauty'.
 *
 * RULES:
 *  - Keys are snake_case block types (must match section_type in DB / pageDefaults)
 *  - All components are imported from ./[ComponentName] in this folder
 *  - No template-prefix on component names — descriptive names only
 *  - Add every new beauty section here AND in BlockRenderer TEMPLATE_REGISTRIES
 */

import type { Block } from '@/types/editor.types'
import type { ComponentType } from 'react'

// ── Home hero (2-col editorial, light cream bg) ─────────────────────────────
import { HeroSection }               from './HeroSection'

// ── Page hero (listing pages: light bg, eyebrow, display heading) ───────────
import { PageHeroSection }           from './PageHeroSection'

// ── Listing sections ─────────────────────────────────────────────────────────
import { StoriesListingSection }     from './StoriesListingSection'
import { JournalListingSection }     from './JournalListingSection'
import { GalleryListingSection }     from './GalleryListingSection'
import { DestinationsListingSection }from './DestinationsListingSection'

// ── Home sections ─────────────────────────────────────────────────────────────
import { MarqueeSection }            from './MarqueeSection'
import { ProductCategoriesSection }  from './ProductCategoriesSection'
import { FeaturedProductsSection }   from './FeaturedProductsSection'
import { FounderQuoteSection }       from './FounderQuoteSection'
import { ProductBenefitsSection }    from './ProductBenefitsSection'
import { ReviewsSection }            from './ReviewsSection'
import { BlogHighlightSection }      from './BlogHighlightSection'
import { NewsletterSection }         from './NewsletterSection'
import { CollectionBannerSection }   from './CollectionBannerSection'
import { StatisticsSection }         from './StatisticsSection'

// ── Shared sections ───────────────────────────────────────────────────────────
import { AboutSection }              from './AboutSection'
import { ContactFormSection }        from './ContactFormSection'
import { FaqSection }                from './FaqSection'
import { TimelineSection }           from './TimelineSection'
import { ContactCTASection }         from './ContactCTASection'
import { RichTextSection }           from './RichTextSection'

// ── Registry type ─────────────────────────────────────────────────────────────
type SectionComponent = ComponentType<{ block: Block }>

// Primary snake_case keys — must match section_type / block.type in the CMS.
// Mirrors the website sectionRegistry keys exactly.
export const beautyRegistry: Record<string, SectionComponent> = {
  // ── Hero ─────────────────────────────────────────────────────────────────
  hero:                    HeroSection,
  page_hero:               PageHeroSection,

  // ── Listing pages ─────────────────────────────────────────────────────────
  stories_listing:         StoriesListingSection,
  journal_listing:         JournalListingSection,
  blogs_listing:           JournalListingSection,   // alias
  gallery_listing:         GalleryListingSection,
  destinations_listing:    DestinationsListingSection,

  // ── Home / generic ────────────────────────────────────────────────────────
  services:                ProductCategoriesSection,
  products:                FeaturedProductsSection,
  featured_products:       FeaturedProductsSection,
  product_categories:      ProductCategoriesSection,
  statistics:              StatisticsSection,
  text:                    RichTextSection,
  rich_text:               RichTextSection,
  custom_html:             RichTextSection,
  newsletter:              NewsletterSection,
  testimonials:            ReviewsSection,
  client_reviews:          ReviewsSection,
  journal:                 BlogHighlightSection,
  blog_highlight:          BlogHighlightSection,
  gallery:                 FeaturedProductsSection,

  // ── Beauty-specific ───────────────────────────────────────────────────────
  marquee:                 MarqueeSection,
  founder_quote:           FounderQuoteSection,
  product_benefits:        ProductBenefitsSection,
  collection_banner:       CollectionBannerSection,
  campaign_banner:         CollectionBannerSection,
  campaign:                CollectionBannerSection,

  // ── About / brand ─────────────────────────────────────────────────────────
  about:                   AboutSection,
  brand_story:             AboutSection,

  // ── Contact ───────────────────────────────────────────────────────────────
  contact:                 ContactFormSection,
  contact_form:            ContactFormSection,
  faq:                     FaqSection,
  contact_cta:             ContactCTASection,

  // ── Misc ──────────────────────────────────────────────────────────────────
  timeline:                TimelineSection,
  pricing:                 FeaturedProductsSection,  // no native beauty pricing
  team:                    ReviewsSection,
  social_grid:             BlogHighlightSection,
  social_links:            BlogHighlightSection,
  map:                     CollectionBannerSection,
  cta:                     ContactCTASection,
  about_cta:               ContactCTASection,

  // ── Cross-template (fashion) aliases ─────────────────────────────────────
  new_arrival:             FeaturedProductsSection,
  product_carousel:        FeaturedProductsSection,
  philosophy:              ProductBenefitsSection,
  collaborations:          ReviewsSection,
  promo_banners:           CollectionBannerSection,
  lookbook:                BlogHighlightSection,
  stores:                  DestinationsListingSection,
  destinations:            CollectionBannerSection,
  contact_cards:           ContactFormSection,
}

export type BeautyCMSSectionType = keyof typeof beautyRegistry
