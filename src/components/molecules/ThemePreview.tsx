/**
 * ThemePreview
 * Renders an inline SVG mini-mockup that visually represents each template's
 * design identity. Used as the fallback when theme.preview_image is null.
 *
 * Supports: 'lito' | 'fashion' | 'beauty'
 * Falls back to a neutral placeholder for unknown template_slug values.
 */

interface ThemePreviewProps {
  templateSlug: string | null
  className?: string
}

// ── Lito Studio (photography portfolio) ──────────────────────────────────────
// Cream editorial background, serif headings, photo grid — clean & minimal.
function LitoPreview() {
  return (
    <svg viewBox="0 0 260 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      {/* Background */}
      <rect width="260" height="140" fill="#F0ECE5" />

      {/* Nav bar */}
      <rect x="0" y="0" width="260" height="26" fill="#F0ECE5" />
      {/* Logo wordmark */}
      <rect x="20" y="10" width="32" height="5" rx="1" fill="#2C2C2C" opacity="0.75" />
      {/* Nav links right */}
      <rect x="170" y="11" width="20" height="3" rx="0.5" fill="#2C2C2C" opacity="0.3" />
      <rect x="198" y="11" width="22" height="3" rx="0.5" fill="#2C2C2C" opacity="0.3" />
      <rect x="228" y="11" width="12" height="3" rx="0.5" fill="#2C2C2C" opacity="0.3" />
      {/* Nav border */}
      <line x1="0" y1="26" x2="260" y2="26" stroke="#2C2C2C" strokeWidth="0.5" opacity="0.15" />

      {/* Hero — editorial full-width */}
      <rect x="0" y="26" width="260" height="66" fill="#D9D2C7" />
      {/* Subtle grain texture via small rects */}
      <rect x="0" y="26" width="260" height="66" fill="url(#lito-overlay)" opacity="0.4" />
      {/* Hero text */}
      <text x="20" y="56" fontSize="13" fill="#2C2C2C" opacity="0.85" fontStyle="italic">Visual Storytelling</text>
      <rect x="20" y="62" width="72" height="2.5" rx="0.5" fill="#2C2C2C" opacity="0.25" />
      <rect x="20" y="68" width="44" height="2.5" rx="0.5" fill="#2C2C2C" opacity="0.18" />
      {/* CTA pill */}
      <rect x="20" y="76" width="56" height="11" rx="5.5" fill="none" stroke="#2C2C2C" strokeWidth="0.8" opacity="0.5" />
      <rect x="28" y="80" width="40" height="3" rx="0.5" fill="#2C2C2C" opacity="0.4" />

      {/* Portfolio grid */}
      <rect x="12" y="100" width="72" height="36" rx="2" fill="#C8C1B7" />
      <rect x="94" y="100" width="72" height="36" rx="2" fill="#BEB7AC" />
      <rect x="176" y="100" width="72" height="36" rx="2" fill="#C8C1B7" />

      {/* Caption lines under grid */}
      <rect x="12" y="114" width="30" height="2.5" rx="0.5" fill="#2C2C2C" opacity="0.25" />
      <rect x="94" y="114" width="40" height="2.5" rx="0.5" fill="#2C2C2C" opacity="0.25" />
      <rect x="176" y="114" width="35" height="2.5" rx="0.5" fill="#2C2C2C" opacity="0.25" />
    </svg>
  )
}

// ── Lito Fashion (fashion e-commerce) ────────────────────────────────────────
// Near-black background, bold uppercase typography, clean product grid.
function FashionPreview() {
  return (
    <svg viewBox="0 0 260 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      {/* Background */}
      <rect width="260" height="140" fill="#0A0A0A" />

      {/* Announcement bar */}
      <rect x="0" y="0" width="260" height="12" fill="#161616" />
      <rect x="90" y="4.5" width="80" height="2.5" rx="0.5" fill="#FFFFFF" opacity="0.25" />

      {/* Nav bar */}
      <rect x="0" y="12" width="260" height="26" fill="#0A0A0A" />
      {/* Logo — bold */}
      <rect x="20" y="22" width="36" height="5" rx="0" fill="#FFFFFF" opacity="0.9" />
      {/* Nav links right */}
      <rect x="165" y="23" width="22" height="3" rx="0" fill="#FFFFFF" opacity="0.4" />
      <rect x="196" y="23" width="18" height="3" rx="0" fill="#FFFFFF" opacity="0.4" />
      <rect x="223" y="23" width="17" height="3" rx="0" fill="#FFFFFF" opacity="0.4" />
      {/* Nav border */}
      <line x1="0" y1="38" x2="260" y2="38" stroke="#FFFFFF" strokeWidth="0.4" opacity="0.12" />

      {/* Hero text — large bold */}
      <rect x="20" y="46" width="100" height="10" rx="0" fill="#FFFFFF" opacity="0.85" />
      <rect x="20" y="60" width="72" height="7" rx="0" fill="#FFFFFF" opacity="0.55" />
      {/* Season label */}
      <rect x="20" y="71" width="50" height="3" rx="0" fill="#FFFFFF" opacity="0.25" />
      {/* CTA — sharp button */}
      <rect x="20" y="79" width="68" height="14" rx="0" fill="#FFFFFF" opacity="0.9" />
      <rect x="28" y="84" width="52" height="4" rx="0" fill="#0A0A0A" opacity="0.8" />

      {/* Product grid */}
      <rect x="0" y="104" width="84" height="36" fill="#181818" />
      <rect x="88" y="104" width="84" height="36" fill="#141414" />
      <rect x="176" y="104" width="84" height="36" fill="#1C1C1C" />

      {/* Price labels */}
      <rect x="8" y="126" width="28" height="2.5" rx="0" fill="#FFFFFF" opacity="0.3" />
      <rect x="96" y="126" width="32" height="2.5" rx="0" fill="#FFFFFF" opacity="0.3" />
      <rect x="184" y="126" width="24" height="2.5" rx="0" fill="#FFFFFF" opacity="0.3" />
    </svg>
  )
}

// ── Lito Beauty (luxury skincare) ────────────────────────────────────────────
// Warm cream, gold accents, delicate serif typography, editorial two-column hero.
function BeautyPreview() {
  return (
    <svg viewBox="0 0 260 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      {/* Background */}
      <rect width="260" height="140" fill="#FAF8F5" />

      {/* Announcement bar */}
      <rect x="0" y="0" width="260" height="13" fill="#C4956A" opacity="0.12" />
      <rect x="80" y="4.5" width="100" height="3" rx="1" fill="#C4956A" opacity="0.55" />

      {/* Nav bar */}
      <rect x="0" y="13" width="260" height="27" fill="#FAF8F5" />
      {/* Logo — centered serif */}
      <rect x="100" y="23" width="60" height="5" rx="1" fill="#2C2C2C" opacity="0.7" />
      {/* Nav items left */}
      <rect x="18" y="24" width="22" height="3" rx="0.5" fill="#2C2C2C" opacity="0.28" />
      <rect x="48" y="24" width="18" height="3" rx="0.5" fill="#2C2C2C" opacity="0.28" />
      {/* Nav items right */}
      <rect x="185" y="24" width="18" height="3" rx="0.5" fill="#2C2C2C" opacity="0.28" />
      <rect x="212" y="24" width="14" height="3" rx="0.5" fill="#2C2C2C" opacity="0.28" />
      <rect x="234" y="22" width="6" height="6" rx="3" fill="#C4956A" opacity="0.6" />
      {/* Nav border */}
      <line x1="0" y1="40" x2="260" y2="40" stroke="#2C2C2C" strokeWidth="0.5" opacity="0.1" />

      {/* Hero — two column editorial */}
      {/* Left: hero image */}
      <rect x="0" y="40" width="130" height="66" fill="#E8E1D9" />
      {/* Right: text */}
      <rect x="130" y="40" width="130" height="66" fill="#FAF8F5" />
      {/* Eyebrow */}
      <rect x="148" y="50" width="44" height="2.5" rx="0.5" fill="#C4956A" opacity="0.7" />
      {/* Heading */}
      <rect x="148" y="57" width="88" height="6" rx="1" fill="#2C2C2C" opacity="0.75" />
      <rect x="148" y="67" width="68" height="6" rx="1" fill="#2C2C2C" opacity="0.75" />
      {/* Sub */}
      <rect x="148" y="77" width="90" height="2.5" rx="0.5" fill="#2C2C2C" opacity="0.2" />
      <rect x="148" y="82" width="70" height="2.5" rx="0.5" fill="#2C2C2C" opacity="0.2" />
      {/* CTA pill */}
      <rect x="148" y="90" width="60" height="11" rx="5.5" fill="#C4956A" opacity="0.22" />
      <rect x="156" y="94" width="44" height="3" rx="0.5" fill="#C4956A" opacity="0.7" />

      {/* Product shelf */}
      <rect x="10" y="112" width="55" height="24" rx="2" fill="#EDE7DF" />
      <rect x="72" y="112" width="55" height="24" rx="2" fill="#E5DDD5" />
      <rect x="133" y="112" width="55" height="24" rx="2" fill="#EDE7DF" />
      <rect x="194" y="112" width="55" height="24" rx="2" fill="#E5DDD5" />
    </svg>
  )
}

// ── Neutral fallback ──────────────────────────────────────────────────────────
function NeutralPreview() {
  return (
    <svg viewBox="0 0 260 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      <rect width="260" height="140" fill="var(--lito-cream-alt, #F0ECE5)" />
      {/* Mock nav */}
      <rect x="0" y="0" width="260" height="24" fill="var(--cms-surface-2, #ECEAE5)" opacity="0.8" />
      <rect x="20" y="9" width="28" height="5" rx="1" fill="#2C2C2C" opacity="0.3" />
      {/* Mock content blocks */}
      <rect x="20" y="36" width="120" height="10" rx="2" fill="#2C2C2C" opacity="0.12" />
      <rect x="20" y="52" width="80" height="6" rx="1.5" fill="#2C2C2C" opacity="0.08" />
      <rect x="20" y="64" width="90" height="6" rx="1.5" fill="#2C2C2C" opacity="0.08" />
      <rect x="12" y="90" width="70" height="40" rx="3" fill="#2C2C2C" opacity="0.07" />
      <rect x="96" y="90" width="70" height="40" rx="3" fill="#2C2C2C" opacity="0.07" />
      <rect x="180" y="90" width="68" height="40" rx="3" fill="#2C2C2C" opacity="0.07" />
    </svg>
  )
}

// ── Human-readable labels per template ───────────────────────────────────────
const TEMPLATE_LABELS: Record<string, string> = {
  lito:    'Lito Studio template preview — photography portfolio style',
  fashion: 'Fashion template preview — dark e-commerce style',
  beauty:  'Beauty template preview — luxury skincare style',
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ThemePreview({ templateSlug, className = '' }: ThemePreviewProps) {
  const inner = (() => {
    switch (templateSlug) {
      case 'lito':    return <LitoPreview />
      case 'fashion': return <FashionPreview />
      case 'beauty':  return <BeautyPreview />
      default:        return <NeutralPreview />
    }
  })()

  const label = (templateSlug && TEMPLATE_LABELS[templateSlug])
    ? TEMPLATE_LABELS[templateSlug]
    : 'Template preview'

  // AC-13: role="img" + aria-label so screen readers announce the template
  // identity even though the inner SVGs are aria-hidden (decorative shapes).
  return (
    <div
      role="img"
      aria-label={label}
      className={`w-full h-full overflow-hidden ${className}`}
    >
      {inner}
    </div>
  )
}
