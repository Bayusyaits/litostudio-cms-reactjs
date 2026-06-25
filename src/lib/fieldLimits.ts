/**
 * fieldLimits — centralized character-limit constants for all CMS form fields.
 *
 * Aligned with Shopify's published field limits where applicable.
 * Applied via `maxLength` HTML attribute (hard stop) + live character counter.
 *
 * References:
 *   Shopify page title:      255 chars
 *   Shopify handle (slug):   255 chars
 *   Shopify tag name:        255 chars (we use 50 — practical limit for UI)
 *   Google meta title shown: ~60–70 chars
 *   Google meta desc shown:  ~155–160 chars
 */

export const FIELD_LIMITS = {
  // ── Content titles ────────────────────────────────────────────────────────
  /** Page, story, journal, campaign, service, product, collection titles */
  TITLE:             255,
  /** Hero slide headline — shorter for layout fit */
  HERO_TITLE:        120,
  /** Hero slide supporting text */
  HERO_SUBTITLE:     200,
  /** Hero slide longer description / body copy */
  HERO_DESCRIPTION:  500,

  // ── Short labels / UI text ────────────────────────────────────────────────
  /** CTA / button text (hero, section blocks, campaigns) */
  CTA_LABEL:          50,
  /** Navigation menu item label */
  MENU_LABEL:         50,
  /** Button text in block editor fields */
  BUTTON_TEXT:        50,

  // ── Excerpts & descriptions ───────────────────────────────────────────────
  /** Short excerpt shown in list views; fallback for meta description */
  EXCERPT:           500,
  /** General-purpose description textarea (categories, FAQs, testimonials) */
  DESCRIPTION:      1000,

  // ── Taxonomy ─────────────────────────────────────────────────────────────
  /** Category or collection name */
  CATEGORY_NAME:     100,
  /** URL slug for category / collection */
  CATEGORY_SLUG:     100,
  /** Individual tag name (Shopify allows 255; 50 is practical for UI) */
  TAG_NAME:           50,
  /** Maximum tags per content item */
  MAX_TAGS:           20,

  // ── SEO (Google display limits) ───────────────────────────────────────────
  /** Meta / OG / Twitter title */
  META_TITLE:         70,
  /** Meta / OG / Twitter description */
  META_DESCRIPTION:  160,
  /** Comma-separated keywords string */
  META_KEYWORDS:     500,

  // ── URL fields ────────────────────────────────────────────────────────────
  /** URL slug / handle — Shopify: 255 */
  SLUG:              255,

  // ── Extra content fields ──────────────────────────────────────────────────
  /** Location, region, province, island, country fields */
  LOCATION:          100,
  /** Category extra field on content items */
  CONTENT_CATEGORY:  100,
  /** Duration field (e.g. "2 hours") */
  DURATION:           50,
  /** Currency code (e.g. "IDR") */
  CURRENCY:           10,

  // ── Media ─────────────────────────────────────────────────────────────────
  /** Image alt text — Shopify: 512; we use 255 */
  IMAGE_ALT:         255,

  // ── Organisation / site settings ─────────────────────────────────────────
  /** Organisation or user display name */
  ORG_NAME:           80,
  /** Website / site name */
  SITE_NAME:          80,
} as const

export type FieldLimitKey = keyof typeof FIELD_LIMITS

/** Returns true when the value is close to or past the limit (≥ 90%). */
export function isNearLimit(value: string, max: number): boolean {
  return value.length >= Math.floor(max * 0.9)
}

/** Returns true when the value has exceeded the limit. */
export function isOverLimit(value: string, max: number): boolean {
  return value.length > max
}
