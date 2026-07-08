import type { Config } from 'tailwindcss'
import flowbite from 'flowbite/plugin'

const config: Config = {
  darkMode: ['selector', '[data-dark]'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui-cms/src/**/*.{ts,tsx}',
    './node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Lito Studio brand tokens ──────────────────────────────
        cream:   { DEFAULT: '#F7F4EE', alt: '#E6DED1' },
        ink:     { DEFAULT: '#111111', light: '#6B6560', muted: '#9A948E' },
        gold:    { DEFAULT: '#D4A853', soft: 'rgba(212,168,83,0.14)', deep: '#B8902F' },
        teal:    { DEFAULT: '#1A4A5A' },
        border:  { DEFAULT: '#D9D2C7' },
        // ── CMS surface tokens ────────────────────────────────────
        'cms-bg':        '#EDEAE3',
        'cms-card':      '#FFFFFF',
        'cms-header':    '#F7F4EE',
        'cms-sidebar':   '#111111',
        // ── Status tokens ─────────────────────────────────────────
        'status-pub-fg':   '#1A4A5A',
        'status-draft-fg': '#8A6520',
        'status-arch-fg':  '#888888',
        'status-danger':   '#A33028',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.5' }],
        xs:    ['11px', { lineHeight: '1.5' }],
        sm:    ['13px', { lineHeight: '1.6' }],
        base:  ['14px', { lineHeight: '1.6' }],
        md:    ['15px', { lineHeight: '1.6' }],
        lg:    ['16px', { lineHeight: '1.75' }],
      },
      borderRadius: {
        sm:  '4px',
        md:  '8px',
        lg:  '12px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(17,17,17,0.07), 0 1px 2px rgba(17,17,17,0.05)',
        lg:   '0 8px 24px rgba(17,17,17,0.10)',
      },
      keyframes: {
        'page-in': {
          from: { transform: 'translateY(6px)', opacity: '0' },
          to:   { transform: 'none', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'page-in': 'page-in 180ms ease-out both',
        'fade-in': 'fade-in 150ms ease-out both',
      },
    },
  },
  safelist: [
    // Dynamic grid-cols used in GallerySection and other block renderers
    { pattern: /^grid-cols-(1|2|3|4|5|6)$/, variants: ['sm', 'md', 'lg'] },
  ],
  plugins: [flowbite],
}

export default config
