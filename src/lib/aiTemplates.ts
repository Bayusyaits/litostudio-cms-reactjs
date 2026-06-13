/**
 * aiTemplates.ts — Client-side content block template generation.
 *
 * No paid API required. Generates structured Block[] from content_type +
 * topic + description + tone, fully offline. Used as the primary generator
 * (or fallback when the backend /generate endpoint is unavailable).
 */

import type { Block } from '@/types/editor.types'

export type AiTone = 'professional' | 'friendly' | 'casual' | 'luxury' | 'modern'

export interface TemplateOptions {
  contentType: string
  topic: string
  description: string
  tone: AiTone
  locale: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function vis() {
  return { desktop: true, tablet: true, mobile: true }
}

function block(type: Block['type'], data: Record<string, unknown>, styles: Record<string, unknown> = {}): Block {
  return { id: uid(), type, data: data as Block['data'], styles, visibility: vis() }
}

const TAGLINES: Record<AiTone, string> = {
  professional: 'Excellence. Quality. Results.',
  friendly:     "We're here to help you succeed!",
  casual:       "Let's build something great together.",
  luxury:       'Crafted for those who demand the finest.',
  modern:       'Innovative solutions for a connected world.',
}

const SUBTEXTS: Record<AiTone, string> = {
  professional: 'Delivering exceptional value through expertise and dedication.',
  friendly:     'Join thousands of happy customers who trust us every day.',
  casual:       'No fuss, no frills — just great work that gets results.',
  luxury:       'An uncompromising commitment to artistry and refinement.',
  modern:       'Built with cutting-edge technology for tomorrow\'s challenges.',
}

// ── Generator ─────────────────────────────────────────────────────────────────

export function generateLocalBlocks(opts: TemplateOptions): Block[] {
  const { contentType, topic, description, tone } = opts
  const name    = topic.trim() || 'Your Brand'
  const desc    = description.trim() || SUBTEXTS[tone]
  const tagline = TAGLINES[tone]

  switch (contentType) {
    case 'hero':
      return [
        block('hero', {
          heading: name, subheading: tagline, description: desc,
          ctaText: 'Get Started', ctaUrl: '#',
          secondaryCtaText: 'Learn More', secondaryCtaUrl: '#',
          align: 'center', overlayOpacity: 0.4,
        }),
      ]

    case 'about':
      return [
        block('heading',    { text: `About ${name}`, level: 2, align: 'center' }),
        block('text',       { content: desc, align: 'center' }),
        block('spacer',     { height: 32 }),
        block('statistics', { items: [
          { value: '10+',  label: 'Years Experience' },
          { value: '500+', label: 'Happy Clients' },
          { value: '98%',  label: 'Satisfaction Rate' },
        ], columns: 3 }),
      ]

    case 'services':
      return [
        block('heading',  { text: 'Our Services', level: 2, align: 'center' }),
        block('text',     { content: desc, align: 'center' }),
        block('spacer',   { height: 24 }),
        block('services', { items: [
          { title: 'Service One',   description: 'Describe your first service offering here.' },
          { title: 'Service Two',   description: 'Describe your second service offering here.' },
          { title: 'Service Three', description: 'Describe your third service offering here.' },
        ], columns: 3 }),
      ]

    case 'products':
      return [
        block('heading',  { text: 'Featured Products', level: 2, align: 'center' }),
        block('text',     { content: desc, align: 'center' }),
        block('spacer',   { height: 24 }),
        block('products', { limit: 6, columns: 3, showPrice: true, showAddToCart: true }),
      ]

    case 'faq':
      return [
        block('heading', { text: 'Frequently Asked Questions', level: 2, align: 'center' }),
        block('text',    { content: 'Find answers to the most common questions below.', align: 'center' }),
        block('spacer',  { height: 24 }),
        block('faq', { items: [
          { question: `What makes ${name} different?`,     answer: desc },
          { question: 'How do I get started?',              answer: 'Getting started is easy — contact us today.' },
          { question: 'What is your pricing model?',        answer: 'We offer flexible pricing for businesses of all sizes.' },
          { question: 'Do you offer customer support?',     answer: 'Yes, our team is available every step of the way.' },
        ] }),
      ]

    case 'testimonials':
      return [
        block('heading',      { text: 'What Our Clients Say', level: 2, align: 'center' }),
        block('spacer',       { height: 24 }),
        block('testimonials', { columns: 2 }),
      ]

    case 'team':
      return [
        block('heading', { text: 'Meet Our Team', level: 2, align: 'center' }),
        block('text',    { content: `The talented people behind ${name}.`, align: 'center' }),
        block('spacer',  { height: 24 }),
        block('team',    { columns: 3 }),
      ]

    case 'contact':
      return [
        block('heading', { text: 'Get In Touch', level: 2, align: 'center' }),
        block('text',    { content: desc, align: 'center' }),
        block('spacer',  { height: 24 }),
        block('contact_form', {
          fields: ['name', 'email', 'phone', 'message'],
          submitText: 'Send Message',
          successMessage: "Thank you! We'll be in touch soon.",
        }),
      ]

    case 'newsletter':
      return [
        block('newsletter', {
          heading:     `Stay Updated with ${name}`,
          subheading:  'Subscribe to our newsletter for the latest news and updates.',
          placeholder: 'Enter your email address',
          buttonText:  'Subscribe',
        }),
      ]

    case 'statistics':
      return [
        block('heading',    { text: `${name} by the Numbers`, level: 2, align: 'center' }),
        block('spacer',     { height: 24 }),
        block('statistics', { items: [
          { value: '1K+',  label: 'Happy Customers' },
          { value: '50+',  label: 'Products' },
          { value: '5★',   label: 'Average Rating' },
          { value: '24/7', label: 'Support' },
        ], columns: 4 }),
      ]

    case 'pricing':
      return [
        block('heading', { text: 'Simple, Transparent Pricing', level: 2, align: 'center' }),
        block('text',    { content: 'Choose the plan that works best for you.', align: 'center' }),
        block('spacer',  { height: 24 }),
        block('pricing', { columns: 3 }),
      ]

    case 'story':
      return [
        block('heading', { text: 'Our Story', level: 2, align: 'center' }),
        block('spacer',  { height: 16 }),
        block('story',   { columns: 2 }),
      ]

    case 'blog':
    case 'journal':
      return [
        block('heading', { text: `Latest from ${name}`, level: 2, align: 'center' }),
        block('text',    { content: desc, align: 'center' }),
        block('spacer',  { height: 24 }),
        block('journal', { limit: 3, columns: 3, showExcerpt: true, showDate: true }),
      ]

    case 'landing_page':
    case 'cta':
      return [
        block('hero', {
          heading: name, subheading: tagline, description: desc,
          ctaText: 'Get Started', ctaUrl: '#', align: 'center', overlayOpacity: 0.4,
        }),
        block('spacer', { height: 48 }),
        block('statistics', { items: [
          { value: '500+', label: 'Customers' },
          { value: '98%',  label: 'Satisfaction' },
          { value: '24/7', label: 'Support' },
        ], columns: 3 }),
        block('spacer', { height: 48 }),
        block('services', { items: [
          { title: 'Feature One',   description: 'Describe your first key feature or benefit.' },
          { title: 'Feature Two',   description: 'Describe your second key feature or benefit.' },
          { title: 'Feature Three', description: 'Describe your third key feature or benefit.' },
        ], columns: 3 }),
        block('spacer',       { height: 48 }),
        block('testimonials', { columns: 2 }),
        block('spacer',       { height: 48 }),
        block('cta', {
          heading:     `Ready to get started with ${name}?`,
          subheading:  desc,
          ctaText:     'Start Today',
          ctaUrl:      '#',
          align:       'center',
        }),
        block('spacer', { height: 48 }),
        block('newsletter', {
          heading:    'Stay in the loop',
          subheading: 'Get updates from us directly to your inbox.',
          buttonText: 'Subscribe',
        }),
      ]

    default:
      return [
        block('heading', { text: name,  level: 2, align: 'center' }),
        block('text',    { content: desc, align: 'left' }),
      ]
  }
}

// ── Content type catalog ──────────────────────────────────────────────────────

export interface ContentTypeOption {
  value: string
  label: string
  description: string
  blockCount: number
}

export const CONTENT_TYPE_OPTIONS: ContentTypeOption[] = [
  { value: 'landing_page',   label: 'Landing Page',   description: 'Full page: hero → features → social proof → CTA → newsletter', blockCount: 9 },
  { value: 'hero',           label: 'Hero Section',   description: 'Large banner with headline, subheading, and CTA buttons',       blockCount: 1 },
  { value: 'about',          label: 'About Section',  description: 'Brand story with heading, description, and statistics',          blockCount: 4 },
  { value: 'services',       label: 'Services',       description: 'Service cards with heading and 3-column grid',                   blockCount: 4 },
  { value: 'products',       label: 'Products',       description: 'Product grid with heading and product listing',                  blockCount: 4 },
  { value: 'faq',            label: 'FAQ',            description: 'Accordion with 4 pre-written question/answer pairs',             blockCount: 4 },
  { value: 'testimonials',   label: 'Testimonials',   description: 'Client review grid with heading',                                blockCount: 3 },
  { value: 'team',           label: 'Team',           description: 'Team member cards with heading and bio',                         blockCount: 4 },
  { value: 'contact',        label: 'Contact Form',   description: 'Contact section with form fields',                               blockCount: 4 },
  { value: 'newsletter',     label: 'Newsletter',     description: 'Email subscription block',                                       blockCount: 1 },
  { value: 'statistics',     label: 'Statistics',     description: '4 key metrics with labels',                                      blockCount: 3 },
  { value: 'pricing',        label: 'Pricing',        description: '3-column pricing table',                                         blockCount: 4 },
  { value: 'story',          label: 'Story / History', description: 'Company story in 2-column layout',                             blockCount: 3 },
  { value: 'blog',           label: 'Blog / Journal', description: 'Latest posts grid with heading',                                 blockCount: 4 },
  { value: 'cta',            label: 'Call to Action', description: 'Bold CTA with headline and button',                              blockCount: 1 },
]
