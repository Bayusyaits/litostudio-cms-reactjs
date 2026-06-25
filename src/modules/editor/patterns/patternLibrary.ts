/**
 * patternLibrary.ts — Pre-built block patterns (Gutenberg "Patterns" parity).
 *
 * A Pattern is a named collection of blocks inserted together in one click.
 * Think of it as a section template: "Hero + CTA", "Pricing row", etc.
 */

import type { Block } from '@/types/editor.types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type PatternCategory =
  | 'hero'
  | 'content'
  | 'portfolio'
  | 'cta'
  | 'contact'
  | 'commerce'
  | 'photography'
  | 'fashion'
  | 'beauty'

export interface BlockPattern {
  id:          string
  name:        string
  description: string
  category:    PatternCategory
  /** Preview emoji/icon */
  preview:     string
  /** Blocks to insert (ids will be regenerated on insert) */
  blocks:      Omit<Block, 'id'>[]
}

// ── Helper ────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10) }

/** Clone pattern blocks with fresh ids */
export function instantiatePattern(pattern: BlockPattern): Block[] {
  return pattern.blocks.map((b) => ({ ...b, id: uid() }))
}

// ── Pattern library ───────────────────────────────────────────────────────────

export const PATTERN_LIBRARY: BlockPattern[] = [
  // ── Hero patterns ──────────────────────────────────────────────────────────
  {
    id:          'hero-simple',
    name:        'Simple Hero',
    description: 'Full-width hero with title, subtitle, and CTA button.',
    category:    'hero',
    preview:     '🌟',
    blocks: [
      {
        type: 'hero',
        data: {
          title:    'Your Story Begins Here',
          subtitle: "Documenting life's most precious moments with artistry and soul.",
          ctaText:  'View Portfolio',
          ctaUrl:   '/portfolio',
          align:    'center',
          backgroundOverlay: 40,
        },
        styles: { paddingTop: 80, paddingBottom: 80 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
    ],
  },
  {
    id:          'hero-with-cta',
    name:        'Hero + CTA Strip',
    description: 'Hero section followed by a call-to-action strip.',
    category:    'hero',
    preview:     '🎯',
    blocks: [
      {
        type: 'hero',
        data: {
          title:    'Visual Storytelling That Moves You',
          subtitle: 'Jakarta · Yogyakarta · Central Java',
          ctaText:  'Book a Session',
          ctaUrl:   '/contact',
          align:    'center',
          backgroundOverlay: 50,
        },
        styles: { paddingTop: 100, paddingBottom: 100 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'cta',
        data: {
          title:       'Ready to tell your story?',
          description: 'Limited slots available each month.',
          buttonText:  'Get in Touch',
          buttonUrl:   '/contact',
          variant:     'brand',
          align:       'center',
        },
        styles: { paddingTop: 40, paddingBottom: 40 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
    ],
  },

  // ── Content patterns ───────────────────────────────────────────────────────
  {
    id:          'intro-text',
    name:        'Intro Text Section',
    description: 'Heading + body paragraph. Good for About or intro copy.',
    category:    'content',
    preview:     '✍️',
    blocks: [
      {
        type: 'heading',
        data: { level: 2, text: 'About Lito Studio' },
        styles: { paddingTop: 48, paddingBottom: 8, textAlign: 'center' },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'text',
        data: { html: '<p>We are a visual storytelling studio based in Jakarta and Yogyakarta, specialising in travel, family, weddings, and documentary photography.</p>' },
        styles: { paddingTop: 8, paddingBottom: 48, maxWidth: 'md', textAlign: 'center' },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
    ],
  },
  {
    id:          'features-grid',
    name:        'Services Grid',
    description: '3-column services grid with icons.',
    category:    'content',
    preview:     '⚙️',
    blocks: [
      {
        type: 'heading',
        data: { level: 2, text: 'What We Offer' },
        styles: { paddingTop: 48, paddingBottom: 8, textAlign: 'center' },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'services',
        data: {
          items: [
            { title: 'Wedding Photography', description: 'Timeless images that preserve every emotion of your wedding day.', icon: '💍' },
            { title: 'Travel Stories',       description: 'Immersive documentary coverage of journeys across Indonesia.',  icon: '✈️' },
            { title: 'Family Portraits',     description: 'Relaxed, natural sessions that capture who you really are.',    icon: '👨‍👩‍👧' },
          ],
          columns: 3,
        },
        styles: { paddingTop: 16, paddingBottom: 60 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
    ],
  },

  // ── Portfolio patterns ─────────────────────────────────────────────────────
  {
    id:          'portfolio-grid',
    name:        'Portfolio Grid',
    description: 'Heading + 3-column portfolio gallery.',
    category:    'portfolio',
    preview:     '🎨',
    blocks: [
      {
        type: 'heading',
        data: { level: 2, text: 'Selected Work' },
        styles: { paddingTop: 60, paddingBottom: 16, textAlign: 'center' },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'portfolio',
        data: {
          items: [
            { title: 'Prewedding in Bali',  category: 'Wedding',   image: '', link: '#', featured: true },
            { title: 'Java Overland',        category: 'Travel',    image: '', link: '#', featured: false },
            { title: 'Family at Home',       category: 'Family',    image: '', link: '#', featured: false },
          ],
          columns: 3,
        },
        styles: { paddingBottom: 60 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
    ],
  },

  // ── CTA patterns ───────────────────────────────────────────────────────────
  {
    id:          'cta-centered',
    name:        'Centered CTA',
    description: 'Bold call-to-action with heading and button.',
    category:    'cta',
    preview:     '📣',
    blocks: [
      {
        type: 'cta',
        data: {
          title:       "Let's Create Something Beautiful",
          description: 'Book your session today — slots fill up fast.',
          buttonText:  'Book Now',
          buttonUrl:   '/contact',
          variant:     'brand',
          align:       'center',
        },
        styles: { paddingTop: 60, paddingBottom: 60 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
    ],
  },
  {
    id:          'testimonials-cta',
    name:        'Testimonials + CTA',
    description: 'Social proof carousel followed by a booking CTA.',
    category:    'cta',
    preview:     '💬',
    blocks: [
      {
        type: 'testimonials',
        data: {
          heading: 'What Our Clients Say',
          layout:  'grid',
          items: [
            { quote: 'Lito Studio captured our wedding exactly how we dreamed.', name: 'Arini & Bima',  rating: 5 },
            { quote: 'Our family photos are absolutely stunning. So natural!',    name: 'The Sutantos', rating: 5 },
          ],
        },
        styles: { paddingTop: 60, paddingBottom: 40 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'cta',
        data: {
          title:      'Join Our Happy Clients',
          buttonText: 'Book a Session',
          buttonUrl:  '/contact',
          variant:    'brand',
          align:      'center',
        },
        styles: { paddingBottom: 60 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
    ],
  },

  // ── Contact ────────────────────────────────────────────────────────────────
  {
    id:          'contact-section',
    name:        'Contact Section',
    description: 'Heading + contact form + social links.',
    category:    'contact',
    preview:     '✉️',
    blocks: [
      {
        type: 'heading',
        data: { level: 2, text: 'Get In Touch' },
        styles: { paddingTop: 60, paddingBottom: 8, textAlign: 'center' },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'contact_form',
        data: {
          heading:    '',
          submitText: 'Send Message',
          fields: [
            { name: 'name',    label: 'Name',    type: 'text',     required: true  },
            { name: 'email',   label: 'Email',   type: 'email',    required: true  },
            { name: 'message', label: 'Message', type: 'textarea', required: true  },
          ],
        },
        styles: { paddingBottom: 40, maxWidth: 'md' },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'social_links',
        data: {
          align: 'center',
          size:  'md',
          links: [
            { platform: 'instagram', url: 'https://instagram.com/litostudio' },
          ],
        },
        styles: { paddingBottom: 60 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
    ],
  },

  // ── Fashion patterns ──────────────────────────────────────────────────────
  {
    id:          'fashion-home-hero',
    name:        'Fashion Home Hero',
    description: 'Full-bleed editorial hero with campaign banner and marquee strip.',
    category:    'fashion',
    preview:     '🖤',
    blocks: [
      {
        type: 'page_hero',
        data: {
          eyebrow:  'New Season',
          title:    'Crafted for the Modern Wardrobe',
          desc:     'Discover the collection.',
          imgSrc:   '',
          imgAlt:   'Campaign hero image',
          ctaLabel: 'Shop Now',
          ctaHref:  '/collections',
        },
        styles: { paddingTop: 0, paddingBottom: 0 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'marquee',
        data: {
          items: ['New Arrivals', 'Free Shipping on Orders Above 500k', 'Exclusive Members', 'Sustainable Fashion'],
        },
        styles: { paddingTop: 0, paddingBottom: 0 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'new_arrival',
        data: {
          title:         'New Arrivals',
          catalogueText: 'View All',
          catalogueLink: '/collections',
          items: [],
        },
        styles: { paddingTop: 80, paddingBottom: 80 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
    ],
  },
  {
    id:          'fashion-about',
    name:        'Fashion About Page',
    description: 'Brand story, philosophy pillars, and contact CTA for an about page.',
    category:    'fashion',
    preview:     '✦',
    blocks: [
      {
        type: 'page_hero',
        data: {
          eyebrow:  'Our Story',
          title:    'Crafted with Purpose',
          desc:     '',
          imgSrc:   '',
          imgAlt:   'Brand story image',
          ctaLabel: '',
          ctaHref:  '',
        },
        styles: { paddingTop: 0, paddingBottom: 0 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'brand_story',
        data: {
          eyebrow:     'Who We Are',
          heading:     'Style rooted in intention.',
          description: 'Founded on the belief that fashion should be both beautiful and responsible, we curate pieces that stand the test of time.',
          image:       '',
          imgAlt:      'Brand image',
          ctaText:     'Shop Collection',
          ctaUrl:      '/collections',
        },
        styles: { paddingTop: 80, paddingBottom: 80 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'philosophy',
        data: {
          heading: 'Our Values',
          items: [
            { number: '01', title: 'Quality', desc: 'Every piece is made to last, not just to trend.' },
            { number: '02', title: 'Sustainability', desc: 'We source responsibly and reduce waste at every step.' },
            { number: '03', title: 'Inclusivity', desc: 'Style has no size — our range is made for everyone.' },
          ],
        },
        styles: { paddingTop: 60, paddingBottom: 80 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'contact_cta',
        data: {
          eyebrow:  'Get In Touch',
          title:    "Let's Work Together",
          desc:     'For wholesale, press, or collaborations — reach out anytime.',
          email:    '',
          ctaText:  'Send an Email',
          ctaLink:  'mailto:hello@example.com',
          homeText: 'Back to Home',
          homeLink: '/',
        },
        styles: { paddingTop: 0, paddingBottom: 0 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
    ],
  },

  // ── Beauty patterns ────────────────────────────────────────────────────────
  {
    id:          'beauty-home',
    name:        'Beauty Home Page',
    description: 'Founder quote, featured products, newsletter, and a booking CTA for beauty brands.',
    category:    'beauty',
    preview:     '🌸',
    blocks: [
      {
        type: 'hero',
        data: {
          title:    'Expert Beauty & Wellness Treatments',
          subtitle: 'Experience the art of self-care with our curated beauty rituals.',
          ctaText:  'Book Treatment',
          ctaUrl:   '/contact',
          align:    'center',
          backgroundOverlay: 45,
        },
        styles: { paddingTop: 0, paddingBottom: 0 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'marquee',
        data: {
          items: ['Facial Treatments', 'Body Sculpting', 'Skin Care', 'Wellness Rituals', 'Luxury Spa'],
        },
        styles: { paddingTop: 0, paddingBottom: 0 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'services',
        data: {
          items: [
            { title: 'Signature Facial',  description: 'Deep cleansing + hydration ritual for radiant skin.',          icon: '✨' },
            { title: 'Body Sculpting',    description: 'Non-invasive contouring treatment for a defined silhouette.',  icon: '💆' },
            { title: 'Brow & Lash',       description: 'Precision shaping and tinting for defined, expressive eyes.',  icon: '👁️' },
          ],
          columns: 3,
        },
        styles: { paddingTop: 60, paddingBottom: 60 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'testimonials',
        data: {
          heading: 'What Our Clients Say',
          layout:  'grid',
          items: [
            { quote: 'My skin has never felt this good. The signature facial is an absolute must.', name: 'Anisa K.',   rating: 5 },
            { quote: 'The team is incredibly skilled. I walk out feeling like a new person every time.', name: 'Rina M.', rating: 5 },
          ],
        },
        styles: { paddingTop: 60, paddingBottom: 60 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'contact_form',
        data: {
          heading:    'Book a Treatment',
          submitText: 'Book Now',
          fields: [
            { name: 'name',    label: 'Full Name', type: 'text',     required: true },
            { name: 'email',   label: 'Email',     type: 'email',    required: true },
            { name: 'service', label: 'Treatment', type: 'text',     required: false },
            { name: 'message', label: 'Message',   type: 'textarea', required: false },
          ],
        },
        styles: { paddingTop: 60, paddingBottom: 80, maxWidth: 'md' },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
    ],
  },

  // ── Photography packages ───────────────────────────────────────────────────
  {
    id:          'photography-packages',
    name:        'Photography Packages',
    description: 'Heading + packages pricing cards.',
    category:    'photography',
    preview:     '📷',
    blocks: [
      {
        type: 'heading',
        data: { level: 2, text: 'Photography Packages' },
        styles: { paddingTop: 60, paddingBottom: 8, textAlign: 'center' },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
      {
        type: 'packages',
        data: {
          items: [
            {
              name:  'Essential',
              price: 'IDR 3.500.000',
              description: '3 hours coverage, 80 edited photos',
              includes: ['3 hours coverage', '80 edited images', 'Online gallery', '30-day delivery'],
              ctaText: 'Book Essential',
              ctaUrl:  '/contact',
            },
            {
              name:     'Signature',
              price:    'IDR 6.500.000',
              description: 'Full-day coverage, 200+ edited photos',
              includes: ['8 hours coverage', '200+ edited images', 'Printed album', 'Priority delivery'],
              ctaText:  'Book Signature',
              ctaUrl:   '/contact',
              featured: true,
            },
          ],
        },
        styles: { paddingBottom: 60 },
        visibility: { desktop: true, tablet: true, mobile: true },
      },
    ],
  },
]

// ── Category metadata ─────────────────────────────────────────────────────────

export const PATTERN_CATEGORIES: Array<{ id: PatternCategory; label: string; emoji: string }> = [
  { id: 'hero',         label: 'Hero',         emoji: '🌟' },
  { id: 'content',      label: 'Content',      emoji: '✍️' },
  { id: 'portfolio',    label: 'Portfolio',    emoji: '🎨' },
  { id: 'cta',          label: 'CTA',          emoji: '📣' },
  { id: 'contact',      label: 'Contact',      emoji: '✉️' },
  { id: 'commerce',     label: 'Commerce',     emoji: '🛍️' },
  { id: 'photography',  label: 'Photography',  emoji: '📷' },
  { id: 'fashion',      label: 'Fashion',      emoji: '🖤' },
  { id: 'beauty',       label: 'Beauty',       emoji: '🌸' },
]
