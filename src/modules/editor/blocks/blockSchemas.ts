/**
 * blockSchemas.ts — Zod schemas for every block data type.
 *
 * Used for:
 *  - Validating JSON before inserting into the store
 *  - Validating imported JSON in EditorCodeView
 *  - Future: API request body validation
 *
 * Keep in sync with editor.types.ts BlockData shapes.
 */

import { z } from 'zod'

// ── Primitive helpers ─────────────────────────────────────────────────────────

const zAlign   = z.enum(['left', 'center', 'right'])
const zSize    = z.enum(['sm', 'md', 'lg'])
const zWidth   = z.enum(['full', 'wide', 'normal', 'small'])
const zMaxW    = z.enum(['full', 'xl', 'lg', 'md', 'sm'])
const zCols234 = z.union([z.literal(2), z.literal(3), z.literal(4)])
const zCols23  = z.union([z.literal(2), z.literal(3)])
const zLevel   = z.union([
  z.literal(1), z.literal(2), z.literal(3),
  z.literal(4), z.literal(5), z.literal(6),
])

// ── Block data schemas ────────────────────────────────────────────────────────

export const TextBlockDataSchema = z.object({
  html: z.string(),
})

export const HeadingBlockDataSchema = z.object({
  text:  z.string(),
  level: zLevel,
})

export const ImageBlockDataSchema = z.object({
  src:     z.string(),
  alt:     z.string(),
  caption: z.string().optional(),
  width:   zWidth.optional(),
  link:    z.string().optional(),
})

export const GalleryBlockDataSchema = z.object({
  images:  z.array(z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() })),
  columns: zCols234,
  gap:     z.enum(['none', 'sm', 'md', 'lg']),
})

export const VideoBlockDataSchema = z.object({
  url:      z.string().url(),
  autoplay: z.boolean().optional(),
  loop:     z.boolean().optional(),
  caption:  z.string().optional(),
})

export const ButtonBlockDataSchema = z.object({
  text:    z.string(),
  url:     z.string(),
  variant: z.enum(['primary', 'secondary', 'outline', 'ghost']),
  size:    zSize,
  align:   zAlign,
  newTab:  z.boolean().optional(),
})

export const SpacerBlockDataSchema = z.object({
  height: z.number().min(0).max(1000),
})

export const DividerBlockDataSchema = z.object({
  style: z.enum(['solid', 'dashed', 'dotted', 'double']),
  width: z.enum(['full', 'wide', 'normal']),
  color: z.string().optional(),
})

export const HeroBlockDataSchema = z.object({
  title:               z.string(),
  subtitle:            z.string().optional(),
  ctaText:             z.string().optional(),
  ctaUrl:              z.string().optional(),
  ctaSecondaryText:    z.string().optional(),
  ctaSecondaryUrl:     z.string().optional(),
  backgroundImage:     z.string().optional(),
  backgroundOverlay:   z.number().min(0).max(100).optional(),
  minHeight:           z.number().optional(),
  align:               zAlign,
})

export const CTABlockDataSchema = z.object({
  title:       z.string(),
  description: z.string().optional(),
  buttonText:  z.string(),
  buttonUrl:   z.string(),
  variant:     z.enum(['light', 'dark', 'brand']),
  align:       zAlign,
})

export const ServicesBlockDataSchema = z.object({
  heading: z.string().optional(),
  items:   z.array(z.object({
    icon:        z.string().optional(),
    title:       z.string(),
    description: z.string(),
    link:        z.string().optional(),
  })),
  columns: zCols234,
})

export const PricingBlockDataSchema = z.object({
  heading: z.string().optional(),
  plans:   z.array(z.object({
    name:        z.string(),
    price:       z.string(),
    period:      z.string().optional(),
    description: z.string().optional(),
    features:    z.array(z.string()),
    ctaText:     z.string(),
    ctaUrl:      z.string(),
    featured:    z.boolean().optional(),
  })),
})

export const TestimonialsBlockDataSchema = z.object({
  heading: z.string().optional(),
  items:   z.array(z.object({
    quote:  z.string(),
    name:   z.string(),
    title:  z.string().optional(),
    avatar: z.string().optional(),
    rating: z.union([z.literal(1),z.literal(2),z.literal(3),z.literal(4),z.literal(5)]).optional(),
  })),
  layout:  z.enum(['grid', 'carousel']),
})

export const FAQBlockDataSchema = z.object({
  heading: z.string().optional(),
  items:   z.array(z.object({ question: z.string(), answer: z.string() })),
})

export const TeamBlockDataSchema = z.object({
  heading: z.string().optional(),
  members: z.array(z.object({
    name:   z.string(),
    role:   z.string().optional(),
    bio:    z.string().optional(),
    photo:  z.string().optional(),
    social: z.object({
      linkedin:  z.string().optional(),
      instagram: z.string().optional(),
      twitter:   z.string().optional(),
    }).optional(),
  })),
  columns: zCols234,
})

export const StatisticsBlockDataSchema = z.object({
  heading: z.string().optional(),
  items:   z.array(z.object({
    value:  z.string(),
    label:  z.string(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
  })),
  columns: zCols234,
})

export const ProductsBlockDataSchema = z.object({
  heading:      z.string().optional(),
  source:       z.enum(['all', 'featured', 'collection']),
  collectionId: z.string().optional(),
  limit:        z.number().min(1).max(50),
  columns:      zCols234,
  showPrice:    z.boolean().optional(),
  showCTA:      z.boolean().optional(),
})

export const CollectionsBlockDataSchema = z.object({
  heading: z.string().optional(),
  limit:   z.number().min(1).max(50),
  columns: zCols234,
})

export const JournalBlockDataSchema = z.object({
  heading:     z.string().optional(),
  limit:       z.number().min(1).max(50),
  columns:     zCols23,
  showExcerpt: z.boolean().optional(),
})

export const StoryBlockDataSchema = z.object({
  heading: z.string().optional(),
  limit:   z.number().min(1).max(50),
  layout:  z.enum(['grid', 'list']),
})

export const ContactFormBlockDataSchema = z.object({
  heading:     z.string().optional(),
  description: z.string().optional(),
  submitText:  z.string().optional(),
  fields:      z.array(z.object({
    name:     z.string(),
    label:    z.string(),
    type:     z.enum(['text', 'email', 'phone', 'textarea', 'select']),
    required: z.boolean().optional(),
    options:  z.array(z.string()).optional(),
  })),
})

export const NewsletterBlockDataSchema = z.object({
  heading:        z.string().optional(),
  description:    z.string().optional(),
  placeholder:    z.string().optional(),
  buttonText:     z.string().optional(),
  successMessage: z.string().optional(),
})

export const MapBlockDataSchema = z.object({
  src:    z.string(),
  height: z.number().optional(),
})

export const SocialLinksBlockDataSchema = z.object({
  links: z.array(z.object({
    platform: z.enum(['instagram','facebook','twitter','linkedin','youtube','tiktok','pinterest','website']),
    url:      z.string(),
  })),
  align: zAlign,
  size:  zSize,
})

export const HTMLBlockDataSchema = z.object({
  html: z.string(),
})

// ── Template-specific ─────────────────────────────────────────────────────────

export const DestinationsGridBlockDataSchema = z.object({
  heading: z.string().optional(),
  items:   z.array(z.object({
    name:        z.string(),
    country:     z.string().optional(),
    description: z.string().optional(),
    image:       z.string().optional(),
    link:        z.string().optional(),
    featured:    z.boolean().optional(),
  })),
  columns: zCols23,
})

export const ExperiencesBlockDataSchema = z.object({
  heading: z.string().optional(),
  items:   z.array(z.object({
    title:       z.string(),
    description: z.string().optional(),
    duration:    z.string().optional(),
    price:       z.string().optional(),
    image:       z.string().optional(),
    link:        z.string().optional(),
  })),
})

export const PortfolioBlockDataSchema = z.object({
  heading: z.string().optional(),
  items:   z.array(z.object({
    title:       z.string(),
    category:    z.string().optional(),
    image:       z.string().optional(),
    description: z.string().optional(),
    link:        z.string().optional(),
    featured:    z.boolean().optional(),
  })),
  columns: zCols234,
})

export const BookingBlockDataSchema = z.object({
  heading:     z.string().optional(),
  description: z.string().optional(),
  calendarUrl: z.string().optional(),
  ctaText:     z.string().optional(),
  showForm:    z.boolean().optional(),
})

export const PackagesBlockDataSchema = z.object({
  heading: z.string().optional(),
  items:   z.array(z.object({
    name:        z.string(),
    price:       z.string(),
    description: z.string().optional(),
    includes:    z.array(z.string()),
    ctaText:     z.string().optional(),
    ctaUrl:      z.string().optional(),
    featured:    z.boolean().optional(),
  })),
})

export const CampaignsGridBlockDataSchema = z.object({
  heading: z.string().optional(),
  limit:   z.number().min(1).max(50),
  status:  z.enum(['published', 'all']).optional(),
  columns: zCols23,
})

// ── Block styles schema ───────────────────────────────────────────────────────

export const BlockStylesSchema = z.object({
  paddingTop:      z.number().optional(),
  paddingBottom:   z.number().optional(),
  paddingLeft:     z.number().optional(),
  paddingRight:    z.number().optional(),
  marginTop:       z.number().optional(),
  marginBottom:    z.number().optional(),
  backgroundColor: z.string().optional(),
  textColor:       z.string().optional(),
  textAlign:       zAlign.optional(),
  maxWidth:        zMaxW.optional(),
  borderRadius:    z.number().optional(),
  borderWidth:     z.number().optional(),
  borderColor:     z.string().optional(),
  customCss:       z.string().optional(),
  customId:        z.string().optional(),
}).optional()

// ── Block schema map (keyed by BlockType) ─────────────────────────────────────

export const BLOCK_DATA_SCHEMAS = {
  text:              TextBlockDataSchema,
  heading:           HeadingBlockDataSchema,
  image:             ImageBlockDataSchema,
  gallery:           GalleryBlockDataSchema,
  video:             VideoBlockDataSchema,
  button:            ButtonBlockDataSchema,
  spacer:            SpacerBlockDataSchema,
  divider:           DividerBlockDataSchema,
  hero:              HeroBlockDataSchema,
  cta:               CTABlockDataSchema,
  services:          ServicesBlockDataSchema,
  pricing:           PricingBlockDataSchema,
  testimonials:      TestimonialsBlockDataSchema,
  faq:               FAQBlockDataSchema,
  team:              TeamBlockDataSchema,
  statistics:        StatisticsBlockDataSchema,
  products:          ProductsBlockDataSchema,
  collections:       CollectionsBlockDataSchema,
  journal:           JournalBlockDataSchema,
  story:             StoryBlockDataSchema,
  contact_form:      ContactFormBlockDataSchema,
  newsletter:        NewsletterBlockDataSchema,
  map:               MapBlockDataSchema,
  social_links:      SocialLinksBlockDataSchema,
  html:              HTMLBlockDataSchema,
  destinations_grid: DestinationsGridBlockDataSchema,
  experiences:       ExperiencesBlockDataSchema,
  portfolio:         PortfolioBlockDataSchema,
  booking:           BookingBlockDataSchema,
  packages:          PackagesBlockDataSchema,
  campaigns_grid:    CampaignsGridBlockDataSchema,
} as const

// ── Validate a block's data at runtime ───────────────────────────────────────

export function validateBlockData(
  type: string,
  data: unknown,
): { ok: true } | { ok: false; error: string } {
  const schema = BLOCK_DATA_SCHEMAS[type as keyof typeof BLOCK_DATA_SCHEMAS]
  if (!schema) return { ok: false, error: `Unknown block type: ${type}` }
  const result = schema.safeParse(data)
  if (!result.success) {
    return { ok: false, error: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') }
  }
  return { ok: true }
}
