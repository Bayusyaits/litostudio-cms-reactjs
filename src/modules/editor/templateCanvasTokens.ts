/**
 * templateCanvasTokens
 *
 * Per-template CSS custom property overrides injected onto the editor canvas
 * content wrapper. They remap the CMS vars that BlockRenderer uses so that
 * blocks render with the real website's palette, fonts and surfaces instead
 * of the CMS UI variables.
 *
 * Keys must match the variable names already referenced in BlockRenderer.tsx
 * and EditorCanvas.tsx — no changes to those files needed.
 */

export interface TemplateCanvasTokens {
  '--cms-card-bg':      string  // canvas / page background
  '--cms-main-bg':      string  // outer chrome around page
  '--cms-surface-2':    string  // section / card backgrounds (used in BlockRenderer)
  '--cms-surface-3':    string  // elevated / alt surfaces (used in BlockRenderer)
  '--text-primary':     string  // main body text
  '--text-secondary':   string  // secondary text
  '--text-muted':       string  // muted / helper text
  '--lito-teal':        string  // primary accent (CTAs, links, selection)
  '--lito-gold':        string  // secondary / warm accent
  '--lito-gold-deep':   string  // deep accent
  '--lito-border':      string  // dividers and card borders
  '--font-display':     string  // heading / editorial font
  '--font-body':        string  // paragraph / UI font
  // Mock header branding
  headerBg:             string  // mock-header background
  headerText:           string  // mock-header text colour
  headerAccent:         string  // mock-header logo accent
  siteName:             string  // displayed in mock header
  /** Google Fonts URL to inject as <link> in the editor canvas */
  fontUrl?:             string
}

const LITO: TemplateCanvasTokens = {
  '--cms-card-bg':    '#F7F4EE',      // warm cream — lito --surface-page
  '--cms-main-bg':    '#EDE8E0',      // outer chrome (slightly darker cream)
  '--cms-surface-2':  '#E6DED1',      // cream alt  — lito --surface-alt
  '--cms-surface-3':  '#FFFFFF',      // white raised card
  '--text-primary':   '#111111',      // lito --lito-ink
  '--text-secondary': '#6B6560',      // lito --lito-ink-light
  '--text-muted':     '#9E9E9E',      // lito --lito-ink-muted
  '--lito-teal':      '#1A4A5A',      // lito teal (unchanged)
  '--lito-gold':      '#D4A853',      // lito gold (unchanged)
  '--lito-gold-deep': '#B68A3A',      // lito gold-deep (unchanged)
  '--lito-border':    '#D9D2C7',      // lito border (unchanged)
  '--font-display':   "'Cormorant Garamond', Georgia, serif",
  '--font-body':      "'Inter', system-ui, -apple-system, sans-serif",
  headerBg:           '#111111',
  headerText:         '#F7F4EE',
  headerAccent:       '#D4A853',
  siteName:           'Lito Studio',
  fontUrl:            'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap',
}

const PHOTOGRAPHY: TemplateCanvasTokens = {
  '--cms-card-bg':    '#FAFAFA',
  '--cms-main-bg':    '#EFEFEF',
  '--cms-surface-2':  '#F0F0F0',
  '--cms-surface-3':  '#FFFFFF',
  '--text-primary':   '#1A1A1A',
  '--text-secondary': '#4A4A4A',
  '--text-muted':     '#777777',
  '--lito-teal':      '#2D5A6B',
  '--lito-gold':      '#C9A865',
  '--lito-gold-deep': '#A08040',
  '--lito-border':    '#E5E5E5',
  '--font-display':   "'Playfair Display', Georgia, serif",
  '--font-body':      "'Inter', system-ui, -apple-system, sans-serif",
  headerBg:           '#1A1A1A',
  headerText:         '#FAFAFA',
  headerAccent:       '#C9A865',
  siteName:           'Photography',
  fontUrl:            'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap',
}

const FASHION: TemplateCanvasTokens = {
  '--cms-card-bg':    '#FAFAF9',      // fashion --nx-bg
  '--cms-main-bg':    '#E8E8E7',
  '--cms-surface-2':  '#F5F5F4',      // fashion --nx-surface-alt
  '--cms-surface-3':  '#EDEDED',      // fashion --nx-surface-raised
  '--text-primary':   '#0A0A0A',      // fashion --nx-text
  '--text-secondary': '#333333',
  '--text-muted':     '#666666',      // fashion --nx-text-muted
  '--lito-teal':      '#0A0A0A',      // fashion uses black as accent
  '--lito-gold':      '#0A0A0A',
  '--lito-gold-deep': '#333333',
  '--lito-border':    'rgba(0,0,0,0.10)',
  '--font-display':   "'Inter', system-ui, -apple-system, sans-serif",
  '--font-body':      "'Inter', system-ui, -apple-system, sans-serif",
  headerBg:           '#0A0A0A',
  headerText:         '#FAFAF9',
  headerAccent:       '#FAFAF9',
  siteName:           'FASHION',
  fontUrl:            'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
}

const BEAUTY: TemplateCanvasTokens = {
  '--cms-card-bg':    '#FAF8F5',      // beauty --bx-bg
  '--cms-main-bg':    '#EDE9E3',
  '--cms-surface-2':  '#F7F5F1',      // beauty --bx-surface-alt
  '--cms-surface-3':  '#FFFFFF',
  '--text-primary':   '#2C2420',      // beauty --bx-text
  '--text-secondary': '#4A3C36',
  '--text-muted':     '#7A6E68',      // beauty --bx-text-muted
  '--lito-teal':      '#C4956A',      // beauty --bx-accent (rose gold)
  '--lito-gold':      '#C4956A',
  '--lito-gold-deep': '#A87A52',
  '--lito-border':    'rgba(44,36,32,0.10)',
  '--font-display':   "'Cormorant Garamond', Georgia, serif",
  '--font-body':      "'Inter', system-ui, -apple-system, sans-serif",
  headerBg:           '#2C2420',
  headerText:         '#FAF8F5',
  headerAccent:       '#C4956A',
  siteName:           'Beauty',
  fontUrl:            'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap',
}

const TRAVEL: TemplateCanvasTokens = {
  '--cms-card-bg':    '#F8FAFC',
  '--cms-main-bg':    '#E8EDF3',
  '--cms-surface-2':  '#EEF2F7',
  '--cms-surface-3':  '#FFFFFF',
  '--text-primary':   '#0F172A',
  '--text-secondary': '#334155',
  '--text-muted':     '#64748B',
  '--lito-teal':      '#1A4A5A',
  '--lito-gold':      '#1DA462',
  '--lito-gold-deep': '#15803D',
  '--lito-border':    '#E2E8F0',
  '--font-display':   "'Poppins', system-ui, sans-serif",
  '--font-body':      "'Inter', system-ui, -apple-system, sans-serif",
  headerBg:           '#0F172A',
  headerText:         '#F8FAFC',
  headerAccent:       '#1DA462',
  siteName:           'Travel',
  fontUrl:            'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap',
}

export const TEMPLATE_CANVAS_TOKENS: Record<string, TemplateCanvasTokens> = {
  lito:        LITO,
  photography: PHOTOGRAPHY,
  fashion:     FASHION,
  beauty:      BEAUTY,
  travel:      TRAVEL,
}

/** Get tokens for a slug, falling back to lito defaults */
export function getCanvasTokens(slug: string | null | undefined): TemplateCanvasTokens {
  return TEMPLATE_CANVAS_TOKENS[slug ?? ''] ?? LITO
}
