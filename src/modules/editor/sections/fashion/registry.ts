/**
 * sections/fashion/registry.ts
 *
 * CMS canvas section registry for the Fashion template.
 * Maps block.type → TSX preview component.
 *
 * Pattern mirrors apps/website/templates/fashion/components/sections/registry.ts.
 * BlockRenderer delegates to this map when template === 'fashion'.
 *
 * RULES:
 *  - Keys are snake_case block types (must match section_type in DB / pageDefaults)
 *  - All components are imported from ./[ComponentName] in this folder
 *  - No template-prefix on component names — descriptive names only
 *  - Add every new fashion section here AND in BlockRenderer TEMPLATE_REGISTRIES
 */

import type { Block } from '@/types/editor.types'
import type { ComponentType } from 'react'

// ── Home hero (full-bleed campaign hero, 2 CTAs) ─────────────────────────────
import { HeroSection }            from './HeroSection'

// ── Page hero (listing pages: 70vh, breadcrumb, eyebrow) ─────────────────────
import { PageHeroSection }        from './PageHeroSection'

// ── Listing sections ─────────────────────────────────────────────────────────
import { StoriesListingSection }      from './StoriesListingSection'
import { JournalListingSection }      from './JournalListingSection'
import { GalleryListingSection }      from './GalleryListingSection'
import { DestinationsListingSection } from './DestinationsListingSection'

// ── Home sections ─────────────────────────────────────────────────────────────
import { NewArrivalSection }      from './NewArrivalSection'
import { PromoBannersSection }    from './PromoBannersSection'
import { CampaignBannerSection }  from './CampaignBannerSection'
import { ProductCarouselSection } from './ProductCarouselSection'
import { MarqueeSection }         from './MarqueeSection'
import { BrandStorySection }      from './BrandStorySection'
import { LookbookSection }        from './LookbookSection'
import { AboutCTASection }        from './AboutCTASection'

// ── About page sections ───────────────────────────────────────────────────────
import { PhilosophySection }      from './PhilosophySection'
import { TimelineSection }        from './TimelineSection'
import { CollaborationsSection }  from './CollaborationsSection'

// ── Contact page sections ─────────────────────────────────────────────────────
import { ContactCTASection }      from './ContactCTASection'
import { ContactCardsSection }    from './ContactCardsSection'

// ── Shared fashion sections ───────────────────────────────────────────────────
import { SocialGridSection }      from './SocialGridSection'
import { StoresSection }          from './StoresSection'

// ── Registry type ─────────────────────────────────────────────────────────────

type SectionComponent = ComponentType<{ block: Block }>

// Primary snake_case keys — must match section_type / block.type in the CMS
export const fashionRegistry: Record<string, SectionComponent> = {
  // Hero
  hero:                    HeroSection,
  page_hero:               PageHeroSection,

  // Listing pages
  stories_listing:         StoriesListingSection,
  journal_listing:         JournalListingSection,
  blogs_listing:           JournalListingSection,   // alias
  gallery_listing:         GalleryListingSection,
  destinations_listing:    DestinationsListingSection,

  // Home
  new_arrival:             NewArrivalSection,
  promo_banners:           PromoBannersSection,
  campaign_banner:         CampaignBannerSection,
  product_carousel:        ProductCarouselSection,
  marquee:                 MarqueeSection,
  brand_story:             BrandStorySection,
  lookbook:                LookbookSection,
  about_cta:               AboutCTASection,

  // About
  philosophy:              PhilosophySection,
  timeline:                TimelineSection,
  collaborations:          CollaborationsSection,

  // Contact
  contact_cta:             ContactCTASection,
  contact_cards:           ContactCardsSection,

  // Shared
  social_grid:             SocialGridSection,
  stores:                  StoresSection,

  // Cross-template aliases
  campaign:                CampaignBannerSection,
  campaign_banner_section: CampaignBannerSection,
  offerings:               PhilosophySection,
  services:                PhilosophySection,
}

export type FashionSectionType = keyof typeof fashionRegistry
