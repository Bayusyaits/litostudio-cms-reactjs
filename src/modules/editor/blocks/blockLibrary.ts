/**
 * blockLibrary.ts — Registry of all available block types.
 *
 * Each entry describes the block's UI metadata and supplies the
 * default data shape used when inserting a fresh block.
 */

import type { BlockLibraryItem } from '@/types/editor.types'

export const BLOCK_LIBRARY: BlockLibraryItem[] = [
  // ── Text ──────────────────────────────────────────────────────────────────
  {
    type: 'heading',
    label: 'Heading',
    icon: 'Heading',
    category: 'text',
    description: 'Section heading (H1–H6)',
    defaultData: { text: 'Your Heading', level: 2 },
  },
  {
    type: 'text',
    label: 'Text',
    icon: 'AlignLeft',
    category: 'text',
    description: 'Rich text paragraph',
    defaultData: { html: '<p>Start writing your content here...</p>' },
  },
  {
    type: 'button',
    label: 'Button',
    icon: 'MousePointerClick',
    category: 'text',
    description: 'Call-to-action button',
    defaultData: { text: 'Click here', url: '#', variant: 'primary', size: 'md', align: 'center', newTab: false },
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: 'Minus',
    category: 'text',
    description: 'Horizontal rule',
    defaultData: { style: 'solid', width: 'full' },
  },
  {
    type: 'spacer',
    label: 'Spacer',
    icon: 'ArrowUpDown',
    category: 'text',
    description: 'Vertical whitespace',
    defaultData: { height: 48 },
  },
  {
    type: 'html',
    label: 'HTML',
    icon: 'Code2',
    category: 'text',
    description: 'Embed custom HTML/CSS/JS',
    defaultData: { html: '<!-- Custom HTML -->' },
  },

  // ── Media ─────────────────────────────────────────────────────────────────
  {
    type: 'image',
    label: 'Image',
    icon: 'Image',
    category: 'media',
    description: 'Single image block',
    defaultData: { src: '', alt: '', caption: '', width: 'full' },
  },
  {
    type: 'gallery',
    label: 'Gallery',
    icon: 'LayoutGrid',
    category: 'media',
    description: 'Multi-image grid',
    defaultData: { images: [], columns: 3, gap: 'md' },
  },
  {
    type: 'video',
    label: 'Video',
    icon: 'Play',
    category: 'media',
    description: 'YouTube or Vimeo embed',
    defaultData: { url: '', autoplay: false, loop: false },
  },

  // ── Layout / sections ─────────────────────────────────────────────────────
  {
    type: 'hero',
    label: 'Hero',
    icon: 'Star',
    category: 'layout',
    description: 'Full-width hero banner',
    defaultData: {
      title: 'Welcome to Your Website',
      subtitle: 'Tell your story, grow your brand.',
      ctaText: 'Get Started',
      ctaUrl: '#',
      align: 'center',
      backgroundOverlay: 50,
    },
    defaultStyles: { paddingTop: 120, paddingBottom: 120 },
  },
  {
    type: 'cta',
    label: 'CTA Band',
    icon: 'Megaphone',
    category: 'layout',
    description: 'Call-to-action banner',
    defaultData: { title: 'Ready to Get Started?', buttonText: 'Contact Us', buttonUrl: '#', variant: 'brand', align: 'center' },
    defaultStyles: { paddingTop: 64, paddingBottom: 64 },
  },
  {
    type: 'services',
    label: 'Services',
    icon: 'Layers',
    category: 'layout',
    description: 'Services grid',
    defaultData: {
      heading: 'Our Services',
      items: [
        { title: 'Service 1', description: 'Brief description of service 1.' },
        { title: 'Service 2', description: 'Brief description of service 2.' },
        { title: 'Service 3', description: 'Brief description of service 3.' },
      ],
      columns: 3,
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
  },
  {
    type: 'pricing',
    label: 'Pricing',
    icon: 'DollarSign',
    category: 'layout',
    description: 'Pricing table',
    defaultData: {
      heading: 'Simple Pricing',
      plans: [
        { name: 'Starter', price: 'Free', features: ['Feature 1', 'Feature 2'], ctaText: 'Get Started', ctaUrl: '#' },
        { name: 'Pro', price: '$19', period: '/mo', features: ['Everything in Starter', 'Feature 3', 'Feature 4'], ctaText: 'Start Free Trial', ctaUrl: '#', featured: true },
      ],
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    icon: 'Quote',
    category: 'layout',
    description: 'Customer testimonials',
    defaultData: {
      heading: 'What Our Clients Say',
      items: [
        { quote: 'This is an amazing service!', name: 'Jane Doe', title: 'CEO', rating: 5 },
        { quote: 'Highly recommend to everyone.', name: 'John Smith', title: 'Designer', rating: 5 },
      ],
      layout: 'grid',
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
  },
  {
    type: 'faq',
    label: 'FAQ',
    icon: 'HelpCircle',
    category: 'layout',
    description: 'Accordion FAQ section',
    defaultData: {
      heading: 'Frequently Asked Questions',
      items: [
        { question: 'What is your return policy?', answer: 'We offer a 30-day money-back guarantee.' },
        { question: 'Do you offer support?', answer: 'Yes, 24/7 email and chat support.' },
      ],
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
  },
  {
    type: 'team',
    label: 'Team',
    icon: 'Users',
    category: 'layout',
    description: 'Team members grid',
    defaultData: {
      heading: 'Meet the Team',
      members: [
        { name: 'Alice Johnson', role: 'Founder & CEO' },
        { name: 'Bob Williams', role: 'Head of Design' },
      ],
      columns: 3,
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
  },
  {
    type: 'statistics',
    label: 'Statistics',
    icon: 'BarChart3',
    category: 'layout',
    description: 'Number/stats counter',
    defaultData: {
      heading: 'Our Impact',
      items: [
        { value: '500', suffix: '+', label: 'Happy Clients' },
        { value: '10', suffix: 'k', label: 'Projects' },
        { value: '5', suffix: '', label: 'Years Experience' },
      ],
      columns: 3,
    },
    defaultStyles: { paddingTop: 64, paddingBottom: 64 },
  },
  {
    type: 'map',
    label: 'Map',
    icon: 'MapPin',
    category: 'layout',
    description: 'Google Maps embed',
    defaultData: { src: '', height: 400 },
  },

  // ── Commerce ──────────────────────────────────────────────────────────────
  {
    type: 'products',
    label: 'Products',
    icon: 'Package',
    category: 'commerce',
    description: 'Product grid from catalog',
    defaultData: { heading: 'Our Products', source: 'all', limit: 6, columns: 3, showPrice: true, showCTA: true },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
  },
  {
    type: 'collections',
    label: 'Collections',
    icon: 'Archive',
    category: 'commerce',
    description: 'Product collections grid',
    defaultData: { heading: 'Shop by Collection', limit: 4, columns: 4 },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
  },
  {
    type: 'journal',
    label: 'Journal',
    icon: 'BookOpen',
    category: 'commerce',
    description: 'Blog / journal posts grid',
    defaultData: { heading: 'Latest from the Journal', limit: 3, columns: 3, showExcerpt: true },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
  },
  {
    type: 'story',
    label: 'Stories',
    icon: 'FileText',
    category: 'commerce',
    description: 'Stories grid or list',
    defaultData: { heading: 'Our Stories', limit: 4, layout: 'grid' },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
  },

  // ── Forms ─────────────────────────────────────────────────────────────────
  {
    type: 'contact_form',
    label: 'Contact Form',
    icon: 'Mail',
    category: 'forms',
    description: 'Contact / inquiry form',
    defaultData: {
      heading: 'Get in Touch',
      description: 'Fill out the form and we\'ll get back to you.',
      submitText: 'Send Message',
      fields: [
        { name: 'name',    label: 'Full Name',  type: 'text',  required: true },
        { name: 'email',   label: 'Email',       type: 'email', required: true },
        { name: 'message', label: 'Message',     type: 'textarea', required: true },
      ],
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
  },
  {
    type: 'newsletter',
    label: 'Newsletter',
    icon: 'Send',
    category: 'forms',
    description: 'Email signup / newsletter',
    defaultData: {
      heading: 'Stay in the Loop',
      description: 'Subscribe to our newsletter for updates.',
      placeholder: 'Enter your email',
      buttonText: 'Subscribe',
      successMessage: 'Thank you for subscribing!',
    },
    defaultStyles: { paddingTop: 64, paddingBottom: 64 },
  },

  // ── Social ────────────────────────────────────────────────────────────────
  {
    type: 'social_links',
    label: 'Social Links',
    icon: 'Share2',
    category: 'social',
    description: 'Social media icon links',
    defaultData: {
      links: [
        { platform: 'instagram', url: '' },
        { platform: 'facebook',  url: '' },
      ],
      align: 'center',
      size: 'md',
    },
  },
]

export const BLOCK_CATEGORIES = [
  { id: 'text',     label: 'Text & Layout' },
  { id: 'media',    label: 'Media' },
  { id: 'layout',   label: 'Sections' },
  { id: 'commerce', label: 'Commerce' },
  { id: 'forms',    label: 'Forms' },
  { id: 'social',   label: 'Social' },
] as const

/** Find a library item by block type */
export function getBlockDef(type: BlockLibraryItem['type']): BlockLibraryItem | undefined {
  return BLOCK_LIBRARY.find((b) => b.type === type)
}
