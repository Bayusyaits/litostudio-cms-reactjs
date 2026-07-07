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
      eyebrow: '',
      titleItalic: '',
      backgroundImage: '',
      ctaText: 'Get Started',
      ctaUrl: '#',
      ctaSecondaryText: '',
      ctaSecondaryUrl: '',
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

  // ── Fashion template sections ─────────────────────────────────────────────
  {
    type: 'page_hero',
    label: 'Page Hero',
    icon: 'Image',
    category: 'template',
    description: 'Full-bleed page hero with eyebrow, title, description and CTA',
    defaultData: {
      eyebrow:  'Our Story',
      title:    'Crafted with Purpose',
      desc:     '',
      imgSrc:   '',
      imgAlt:   '',
      ctaLabel: 'Explore',
      ctaHref:  '/collections',
      height:   '',   // e.g. '70vh' | '55vh' — leave empty for default
    },
    defaultStyles: { paddingTop: 0, paddingBottom: 0 },
    templateScope: ['fashion'],
  },
  {
    type: 'contact_cta',
    label: 'Contact CTA',
    icon: 'Mail',
    category: 'template',
    description: 'Dark full-width contact call-to-action section',
    defaultData: {
      eyebrow:       'Get In Touch',
      title:         "Let's Work Together",
      desc:          'Reach out and let us know how we can help.',
      email:         '',
      ctaText:       'Send an Email',
      ctaLink:       'mailto:hello@example.com',
      whatsappUrl:   '',   // e.g. https://wa.me/628123456789
      whatsappText:  'Chat on WhatsApp',
      homeText:      'Back to Home',
      homeLink:      '/',
    },
    defaultStyles: { paddingTop: 0, paddingBottom: 0 },
    templateScope: ['fashion', 'lito', 'beauty'],
  },
  {
    type: 'contact_cards',
    label: 'Contact Cards',
    icon: 'MapPin',
    category: 'template',
    description: 'Contact information cards (address, phone, email, hours)',
    defaultData: {
      heading: 'Contact Us',
      items: [
        { icon: 'MapPin',  label: 'Address',   value: '123 Fashion Street, Jakarta' },
        { icon: 'Mail',    label: 'Email',      value: 'hello@example.com' },
        { icon: 'Phone',   label: 'Phone',      value: '+62 812 0000 0000' },
        { icon: 'Clock',   label: 'Hours',      value: 'Mon–Sat 9am–6pm' },
      ],
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['fashion'],
  },
  {
    type: 'new_arrival',
    label: 'New Arrivals',
    icon: 'Sparkles',
    category: 'template',
    description: 'Featured products — new arrivals grid',
    defaultData: {
      title: 'New Arrivals',
      catalogueText: 'View All',
      catalogueLink: '/collections',
      productCount: 8,
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['fashion'],
  },
  {
    type: 'brand_story',
    label: 'Brand Story',
    icon: 'BookOpen',
    category: 'template',
    description: 'Brand origin story — image, copy, value tags, and years',
    defaultData: {
      eyebrow:          'Who We Are',
      heading:          'Crafted for the modern wardrobe.',
      title:            'Crafted for the modern wardrobe.',
      description:      'Tell your brand story here. Share what makes your brand unique and why customers love you.',
      image:            '',
      ctaText:          '',
      ctaUrl:           '/about',
      since:            '2019',
      yearsStrongLabel: 'Years Strong',
      missionLabel:     'Our Mission',
      values:           ['Innovation', 'Craftsmanship', 'Sustainability', 'Community', 'Accessibility'],
    } as import('@/types/editor.types').AboutBlockData,
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['fashion'],
  },
  {
    type: 'lookbook',
    label: 'Lookbook',
    icon: 'Image',
    category: 'template',
    description: 'Lookbook gallery from the catalog',
    defaultData: {
      title: 'Lookbook',
      eyebrow: 'This Season',
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['fashion'],
  },
  {
    type: 'campaign_banner',
    label: 'Campaign Banner',
    icon: 'Megaphone',
    category: 'template',
    description: 'Full-width editorial campaign banner',
    defaultData: {
      backgroundImage: '',
      eyebrow: 'New Collection',
      title: 'The New Season Is Here',
      description: '',
      buttonText: 'Shop Now',
      primaryLink: '/collections',
      ctaSecondaryText: 'Learn More',
      ctaSecondaryLink: '/about',
    },
    defaultStyles: { paddingTop: 0, paddingBottom: 0 },
    templateScope: ['fashion'],
  },
  {
    type: 'philosophy',
    label: 'Brand Philosophy',
    icon: 'Gem',
    category: 'template',
    description: 'Brand values and philosophy pillars',
    defaultData: {
      heading: 'Our Philosophy',
      items: [
        { title: 'Innovation', description: 'We push boundaries in design and craft.' },
        { title: 'Craftsmanship', description: 'Every piece is made with care and precision.' },
        { title: 'Sustainability', description: 'Responsible sourcing and ethical production.' },
      ],
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['fashion', 'lito'],
  },
  {
    type: 'timeline',
    label: 'Brand Timeline',
    icon: 'Clock',
    category: 'template',
    description: 'Company history as a visual timeline',
    defaultData: {
      heading: 'Our Journey',
      eyebrow: 'History',
      entries: [
        { year: '2020', title: 'Founded', description: 'Our brand was born.' },
        { year: '2022', title: 'First Collection', description: 'Launched our debut collection.' },
      ],
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['fashion'],
  },
  {
    type: 'collaborations',
    label: 'Collaborations',
    icon: 'Users',
    category: 'template',
    description: 'Partner brands and collaboration showcase',
    defaultData: {
      heading: 'Our Collaborations',
      eyebrow: 'Partners',
      items: [],
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['fashion'],
  },
  {
    type: 'social_grid',
    label: 'Social Grid',
    icon: 'Instagram',
    category: 'template',
    description: 'Instagram-style social media grid',
    defaultData: {
      title: 'Follow Our Journey',
      eyebrow: 'Connect With Us',
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['fashion'],
  },
  {
    type: 'marquee',
    label: 'Marquee',
    icon: 'ArrowRight',
    category: 'template',
    description: 'Scrolling marquee text band',
    defaultData: {
      items: ['New Arrivals', 'Free Shipping', 'Sustainable Fashion', 'Shop Now'],
    },
    templateScope: ['fashion', 'beauty', 'lito'],
  },
  {
    type: 'promo_banners',
    label: 'Promo Banners',
    icon: 'LayoutGrid',
    category: 'template',
    description: 'Grid of promotional banners',
    defaultData: {
      items: [
        { image: '', title: 'Summer Sale', link: '/collections', buttonText: 'Shop Now' },
        { image: '', title: 'New Season',  link: '/new-arrivals', buttonText: 'Explore' },
      ],
    },
    defaultStyles: { paddingTop: 40, paddingBottom: 40 },
    templateScope: ['fashion'],
  },
  {
    type: 'about_cta',
    label: 'About CTA',
    icon: 'ArrowUpRight',
    category: 'template',
    description: 'About page call-to-action section',
    defaultData: {
      // Keys match AboutCTASection.vue props exactly
      title:        'Ready to Explore?',
      eyebrow:      '',
      description:  '',
      shopText:     'Shop the Collection',
      shopLink:     '/collections',
      contactText:  'Contact Us',
      contactLink:  '/contact',
    },
    defaultStyles: { paddingTop: 64, paddingBottom: 64 },
    templateScope: ['fashion'],
  },
  {
    type: 'product_carousel',
    label: 'Product Carousel',
    icon: 'ShoppingBag',
    category: 'template',
    description: 'Horizontal scrolling product carousel',
    defaultData: {
      title: 'You May Also Like',
      categorySlug: '',
      limit: 8,
    },
    defaultStyles: { paddingTop: 64, paddingBottom: 64 },
    templateScope: ['fashion'],
  },
  {
    type: 'stores',
    label: 'Our Stores',
    icon: 'MapPin',
    category: 'template',
    description: 'Multi-store location cards with name, address, phone, hours, and map',
    defaultData: {
      eyebrow: 'Our stores',
      heading: 'Find us near you',
      items: [
        {
          name:     'Flagship — Jakarta',
          address:  'Jl. Sudirman Kav. 1, Jakarta Pusat 10220',
          phone:    '+62 21 1234 5678',
          hours:    'Mon–Sat 10:00–21:00\nSun 11:00–20:00',
          mapImage: '',
          mapUrl:   '',
        },
        {
          name:     'Concept Store — Bali',
          address:  'Jl. Sunset Road 88, Seminyak, Bali 80361',
          phone:    '+62 361 987 654',
          hours:    'Daily 10:00–22:00',
          mapImage: '',
          mapUrl:   '',
        },
      ],
    } as import('@/types/editor.types').StoresBlockData,
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['fashion'],
  },

  // ── Beauty template sections ──────────────────────────────────────────────
  {
    type: 'campaigns_grid',
    label: 'Campaigns',
    icon: 'Megaphone',
    category: 'template',
    description: 'Promotions and campaigns grid',
    defaultData: { heading: 'Our Campaigns', limit: 4, status: 'published', columns: 2 },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['beauty'],
  },

  // ── Lito (Photography) template sections ─────────────────────────────────
  {
    type: 'about',
    label: 'About Studio',
    icon: 'Sparkles',
    category: 'template',
    description: 'Studio intro — image + text + stats',
    defaultData: {
      heading: 'Tentang\nLito Studio',
      description: 'Kami mendokumentasikan momen paling berharga dalam hidupmu.',
      image: '',
      ctaText: 'Lihat Portofolio',
      ctaUrl: '/portfolio',
      since: '2022',
      cities: 'Jakarta, Yogyakarta, Jawa Tengah',
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['lito', 'beauty'],
  },
  {
    type: 'campaign',
    label: 'Campaign Banner',
    icon: 'Megaphone',
    category: 'template',
    description: 'Full-width campaign or promo banner',
    defaultData: {
      heading: 'Promo Spesial',
      description: 'Dapatkan penawaran eksklusif untuk sesi foto keluarga.',
      image: '',
      ctaText: 'Pelajari Lebih',
      ctaUrl: '#',
    },
    defaultStyles: { paddingTop: 0, paddingBottom: 0 },
    templateScope: ['lito'],
  },
  {
    type: 'story_categories',
    label: 'Story Categories',
    icon: 'Layers',
    category: 'template',
    description: 'Story category cards grid',
    defaultData: {
      heading: 'Jelajahi Kategori',
      sectionLabel: 'Kategori',
      sectionNumber: '06',
      limit: 6,
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['lito'],
  },
  {
    // type aligned with litoManifest id: 'destinations'
    // website registry handles both 'destinations' and 'destinations_grid' → MapSection
    type: 'destinations',
    label: 'Destinations',
    icon: 'MapPin',
    category: 'template',
    description: 'Destinations and locations grid',
    defaultData: {
      heading: "Where We've Been",
      items: [
        { name: 'Jakarta',    country: 'Indonesia', description: 'Urban stories from the capital.', image: '', link: '#', featured: true },
        { name: 'Yogyakarta', country: 'Indonesia', description: 'Cultural heartland of Java.',     image: '', link: '#', featured: true },
        { name: 'Bali',       country: 'Indonesia', description: 'Island of the Gods.',            image: '', link: '#', featured: false },
      ],
      columns: 3,
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['lito'],
  },
  {
    type: 'portfolio',
    label: 'Portfolio',
    icon: 'Aperture',
    category: 'template',
    description: 'Photography portfolio grid',
    defaultData: {
      heading: 'My Work',
      items: [
        { title: 'Wedding at Ubud', category: 'Wedding', image: '', description: 'Intimate ceremony in the heart of Bali.' },
        { title: 'Corporate Event', category: 'Corporate', image: '', description: 'Annual conference photography.' },
        { title: 'Family Portrait', category: 'Portrait', image: '', description: 'Timeless family memories.' },
      ],
      columns: 3,
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['lito'],
  },
  {
    type: 'packages',
    label: 'Packages',
    icon: 'Camera',
    category: 'template',
    description: 'Photography packages and pricing',
    defaultData: {
      heading: 'Photography Packages',
      items: [
        {
          name: 'Basic', price: '$299',
          description: 'Perfect for small events.',
          includes: ['2-hour coverage', '50 edited photos', 'Online gallery'],
          ctaText: 'Book Now', ctaUrl: '#',
        },
        {
          name: 'Pro', price: '$599',
          description: 'Our most popular package.',
          includes: ['6-hour coverage', '200 edited photos', 'Print album', 'Online gallery'],
          ctaText: 'Book Now', ctaUrl: '#', featured: true,
        },
      ],
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['lito'],
  },
  {
    type: 'booking',
    label: 'Booking',
    icon: 'CalendarDays',
    category: 'template',
    description: 'Booking and scheduling section',
    defaultData: {
      heading: 'Book a Session',
      description: 'Let\'s capture your special moments together. Fill out the form or use the calendar to schedule a session.',
      ctaText: 'Book Now',
      showForm: true,
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['lito'],
  },

  // ── Lito additional sections ──────────────────────────────────────────────
  {
    type: 'stories',
    label: 'Stories',
    icon: 'BookOpen',
    category: 'template',
    description: 'Featured stories grid',
    defaultData: {
      heading: 'Cerita Kami',
      limit: 6,
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['lito'],
  },
  {
    type: 'offerings',
    label: 'Offerings',
    icon: 'Star',
    category: 'template',
    description: 'Service offerings showcase',
    defaultData: {
      heading: 'Layanan Kami',
      items: [
        { title: 'Wedding', description: 'Dokumentasi pernikahan profesional.', icon: '' },
        { title: 'Portrait', description: 'Sesi foto portrait personal.', icon: '' },
      ],
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['lito'],
  },

  // ── Beauty additional sections ────────────────────────────────────────────
  {
    type: 'founder_quote',
    label: 'Founder Quote',
    icon: 'Quote',
    category: 'template',
    description: 'Founder or brand quote highlight',
    defaultData: {
      eyebrow:     'Our Story',
      quote:       'Beauty is confidence.',
      founderName: 'Founder Name',
      founderRole: 'Founder & CEO',
      image:       '',
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['beauty'],
  },
  {
    type: 'product_benefits',
    label: 'Product Benefits',
    icon: 'Sparkles',
    category: 'template',
    description: 'Product benefit cards with stats',
    defaultData: {
      eyebrow: 'Why Choose Us',
      heading: 'The Difference',
      items: [
        { title: 'Natural Ingredients', description: 'Sourced from nature.', statValue: '100%', statLabel: 'Natural' },
        { title: 'Dermatologist Tested', description: 'Safe for all skin types.', statValue: '98%', statLabel: 'Satisfaction' },
      ],
    },
    defaultStyles: { paddingTop: 80, paddingBottom: 80 },
    templateScope: ['beauty'],
  },
  // ── Listing page sections ────────────────────────────────────────────────────
  {
    type: 'journal_listing',
    label: 'Journal Listing',
    icon: 'BookOpen',
    category: 'template',
    description: 'Paginated journal post grid with hero and category filters',
    defaultData: {
      eyebrow: 'Field Notes',
      title: 'Journal',
      description: 'Behind-the-scenes dispatches, style observations, and atelier notes.',
      heroImage: '',
    },
    defaultStyles: { paddingTop: 0, paddingBottom: 0 },
    templateScope: ['fashion', 'beauty'],
  },
  {
    type: 'stories_listing',
    label: 'Stories Listing',
    icon: 'Newspaper',
    category: 'template',
    description: 'Featured story + paginated story grid with hero and category filters',
    defaultData: {
      eyebrow: 'Behind the Work',
      title: 'Stories',
      description: 'The people, places, and moments that inspire every collection.',
      heroImage: '',
    },
    defaultStyles: { paddingTop: 0, paddingBottom: 0 },
    templateScope: ['fashion', 'beauty'],
  },
  {
    type: 'gallery_listing',
    label: 'Gallery Listing',
    icon: 'Images',
    category: 'template',
    description: 'Masonry portfolio gallery with category filter pills',
    defaultData: {
      eyebrow: 'Portfolio',
      title: 'Gallery',
      description: '',
    },
    defaultStyles: { paddingTop: 0, paddingBottom: 0 },
    templateScope: ['fashion', 'beauty'],
  },
  // ── Lito listing sections ────────────────────────────────────────────────────
  {
    type: 'lito_journal_listing',
    label: 'Journal Listing',
    icon: 'BookOpen',
    category: 'template',
    description: 'Editorial hero (03 · Jurnal), rounded-full filter pills, 3-col 4:3 landscape grid',
    defaultData: {
      sectionNumber: '03',
      sectionLabel: 'Jurnal',
      title: 'Journal',
    },
    defaultStyles: { paddingTop: 0, paddingBottom: 0 },
    templateScope: ['lito'],
  },
  {
    type: 'lito_stories_listing',
    label: 'Stories Listing',
    icon: 'Newspaper',
    category: 'template',
    description: 'Editorial hero (01 · Cerita), rounded-full filter pills, 3-col 3:4 portrait grid',
    defaultData: {
      sectionNumber: '01',
      sectionLabel: 'Cerita',
      title: 'Stories',
    },
    defaultStyles: { paddingTop: 0, paddingBottom: 0 },
    templateScope: ['lito'],
  },
  {
    type: 'lito_gallery_listing',
    label: 'Gallery Listing',
    icon: 'Images',
    category: 'template',
    description: 'Editorial hero (02 · Arsip Visual), sticky filter bar, 4-col masonry grid',
    defaultData: {
      sectionNumber: '02',
      sectionLabel: 'Arsip Visual',
      title: 'Gallery',
    },
    defaultStyles: { paddingTop: 0, paddingBottom: 0 },
    templateScope: ['lito'],
  },
  {
    type: 'lito_destinations_listing',
    label: 'Destinations Listing',
    icon: 'MapPin',
    category: 'template',
    description: 'Editorial hero (03 · Destinasi), 3-col 3:4 portrait card grid with gradient overlay',
    defaultData: {
      sectionNumber: '03',
      sectionLabel: 'Destinasi',
      title: 'Places We Explored',
    },
    defaultStyles: { paddingTop: 0, paddingBottom: 0 },
    templateScope: ['lito'],
  },
]

export const BLOCK_CATEGORIES = [
  { id: 'text',     label: 'Text & Layout' },
  { id: 'media',    label: 'Media' },
  { id: 'layout',   label: 'Sections' },
  { id: 'commerce', label: 'Commerce' },
  { id: 'forms',    label: 'Forms' },
  { id: 'social',   label: 'Social' },
  { id: 'template', label: 'Template Sections' },
] as const

/** Find a library item by block type */
export function getBlockDef(type: BlockLibraryItem['type']): BlockLibraryItem | undefined {
  return BLOCK_LIBRARY.find((b) => b.type === type)
}

// ── Publish-time warning list ─────────────────────────────────────────────────
//
// 2026-07-05 audit fix: these block types are insertable as standalone canvas
// blocks (they render fine here in BlockRenderer.tsx), but the backend
// publish-sync bridge intentionally does NOT write them to page_sections —
// they're layout/content primitives meant to live inside a composite block,
// not stand alone as a full website section. Until now that meant an editor
// could build one, publish, and have it silently vanish with zero feedback.
//
// This list MUST stay in sync with the block types mapped to `null` in
// apps/backend/src/modules/pages/interface/blockToSectionMapper.ts
// (BLOCK_TO_SECTION_TYPE / UNPUBLISHED_BLOCK_TYPES). The two apps don't share
// a module boundary for this concern, so it's duplicated here deliberately —
// if you change one, change the other.
export const BLOCKS_NOT_PUBLISHED_AS_SECTIONS: readonly BlockLibraryItem['type'][] = [
  'image', 'video', 'button', 'spacer', 'divider',
]
