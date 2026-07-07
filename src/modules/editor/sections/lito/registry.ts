/**
 * sections/lito/registry.ts
 *
 * CMS canvas section registry for the Lito template.
 * Maps block.type → TSX preview component.
 *
 * Pattern mirrors apps/website/templates/lito/components/sections/registry.ts.
 * BlockRenderer delegates to this map when template === 'lito' | 'photography'.
 *
 * RULES:
 *  - Keys are snake_case block types (must match section_type in DB / pageDefaults)
 *  - Import lito-specific components from ./ and shared from ../
 *  - No template-prefix on component names in this file — descriptive names only
 *  - Add every new lito section here AND in BlockRenderer TEMPLATE_REGISTRIES
 */

import type { Block } from '@/types/editor.types'
import type { ComponentType } from 'react'

// ── Lito home hero ────────────────────────────────────────────────────────────
import { HeroSection }            from './HeroSection'

// ── Page hero (listing pages: full-bleed dark with breadcrumb) ────────────────
import { PageHeroSection }        from './PageHeroSection'

// ── Lito-specific content sections ───────────────────────────────────────────
import { LitoStoriesSection   as StoriesSection   } from './StoriesSection'
import { LitoJournalSection   as JournalSection   } from './JournalSection'
import { LitoGallerySection   as GallerySection   } from './GallerySection'
import { LitoOfferingSection  as OfferingSection  } from './OfferingSection'

// ── Listing sections ──────────────────────────────────────────────────────────
import { StoriesListingSection      } from './StoriesListingSection'
import { JournalListingSection      } from './JournalListingSection'
import { GalleryListingSection      } from './GalleryListingSection'
import { DestinationsListingSection } from './DestinationsListingSection'

// ── Editorial / layout sections ───────────────────────────────────────────────
import { CampaignBannerSection } from './CampaignBannerSection'
import { LookbookSection }       from './LookbookSection'
import { BrandStorySection }     from './BrandStorySection'
import { PromoBannersSection }   from './PromoBannersSection'
import { NewArrivalSection }     from './NewArrivalSection'
import { ProductCarouselSection} from './ProductCarouselSection'
import { MarqueeSection }        from './MarqueeSection'

// ── About / identity sections ─────────────────────────────────────────────────
import { PhilosophySection }    from './PhilosophySection'
import { TimelineSection }      from './TimelineSection'
import { CollaborationsSection} from './CollaborationsSection'
import { AboutCTASection }      from './AboutCTASection'

// ── Contact / utility sections ────────────────────────────────────────────────
import { ContactCTASection }   from './ContactCTASection'
import { ContactCardsSection } from './ContactCardsSection'
import { SocialGridSection }   from './SocialGridSection'
import { StoresSection }       from './StoresSection'
import { NewsletterSection }   from './NewsletterSection'

// ── Data sections ──────────────────────────────────────────────────────────────
import { StatisticsSection }   from './StatisticsSection'
import { FAQSection }          from './FAQSection'
import { RichTextSection }     from './RichTextSection'

// ── Shared sections (from sections/) ─────────────────────────────────────────
import { AboutSection }        from '../AboutSection'
import { CampaignSection }     from '../CampaignSection'
import { CategoriesSection }   from '../CategoriesSection'
import { ContactSection }      from '../ContactSection'
import { MapSection }          from '../MapSection'
import { PortfolioSection }    from '../PortfolioSection'
import { PricingSection }      from '../PricingSection'
import { TestimonialsSection } from '../TestimonialsSection'

// ── Registry type ──────────────────────────────────────────────────────────────

type SectionComponent = ComponentType<{ block: Block }>

export const litoRegistry: Record<string, SectionComponent> = {
  // ── Hero ────────────────────────────────────────────────────────────────────
  hero:                    HeroSection,
  page_hero:               PageHeroSection,

  // ── Core content ────────────────────────────────────────────────────────────
  story:                   StoriesSection,
  stories:                 StoriesSection,
  featured_stories:        StoriesSection,
  featured_content:        StoriesSection,
  journal:                 JournalSection,
  latest_journal:          JournalSection,
  blog_highlight:          JournalSection,
  gallery:                 GallerySection,
  selected_works:          GallerySection,
  services:                OfferingSection,
  offerings:               OfferingSection,
  portfolio:               PortfolioSection,

  // ── Listing pages ────────────────────────────────────────────────────────────
  stories_listing:             StoriesListingSection,
  journal_listing:             JournalListingSection,
  blogs_listing:               JournalListingSection,    // alias
  gallery_listing:             GalleryListingSection,
  destinations_listing:        DestinationsListingSection,
  lito_stories_listing:        StoriesListingSection,
  lito_journal_listing:        JournalListingSection,
  lito_gallery_listing:        GalleryListingSection,
  lito_destinations_listing:   DestinationsListingSection,

  // ── Map / destinations ────────────────────────────────────────────────────────
  destinations:            MapSection,
  destinations_grid:       MapSection,
  story_map:               MapSection,
  map:                     MapSection,

  // ── Editorial / layout ────────────────────────────────────────────────────────
  campaign_banner:         CampaignBannerSection,
  collection_banner:       CampaignBannerSection,
  campaign:                CampaignSection,
  lookbook:                LookbookSection,
  brand_story:             BrandStorySection,
  promo_banners:           PromoBannersSection,
  new_arrival:             NewArrivalSection,
  featured_products:       NewArrivalSection,
  product_carousel:        ProductCarouselSection,
  marquee:                 MarqueeSection,

  // ── About / identity ──────────────────────────────────────────────────────────
  about:                   AboutSection,
  philosophy:              PhilosophySection,
  timeline:                TimelineSection,
  collaborations:          CollaborationsSection,
  about_cta:               AboutCTASection,
  story_categories:        CategoriesSection,

  // ── Contact / utility ─────────────────────────────────────────────────────────
  contact_cta:             ContactCTASection,
  contact_cards:           ContactCardsSection,
  contact_form:            ContactSection,
  contact:                 ContactSection,
  booking:                 ContactSection,
  social_grid:             SocialGridSection,
  stores:                  StoresSection,
  newsletter:              NewsletterSection,

  // ── Data ──────────────────────────────────────────────────────────────────────
  statistics:              StatisticsSection,
  faq:                     FAQSection,
  text:                    RichTextSection,
  rich_text:               RichTextSection,
  testimonials:            TestimonialsSection,
  client_reviews:          TestimonialsSection,

  // ── Pricing ───────────────────────────────────────────────────────────────────
  pricing:                 PricingSection,
  packages:                PricingSection,
}

export type LitoSectionType = keyof typeof litoRegistry
