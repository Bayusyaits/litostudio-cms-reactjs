import type { Block } from '@/types/editor.types'

export function PageHeroSection({ block }: { block: Block }) {
  const d          = block.data as Record<string, unknown>
  const heroHeight = d.height ? String(d.height) : '55vh'
  const hasBg      = !!d.imgSrc

  return (
    <div style={{ position: 'relative', minHeight: heroHeight, background: hasBg ? undefined : 'var(--lito-ink,#0A0A0A)', backgroundImage: hasBg ? `url(${d.imgSrc})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.25) 50%,rgba(0,0,0,0.1) 100%)' }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '0 var(--nx-gutter,32px) clamp(2.5rem,6vh,5rem)', width: '100%', maxWidth: 1200 }}>
        {!!d.eyebrow && (
          <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', margin: 0, marginBottom: 14 }}>
            {String(d.eyebrow)}
          </p>
        )}
        <h1 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.025em', textTransform: 'uppercase', color: 'var(--lito-cream,#FAFAF9)', margin: 0, marginBottom: 16 }}>
          {String(d.title ?? 'Page Title')}
        </h1>
        {!!d.desc && (
          <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: 0, marginBottom: 24, maxWidth: '50ch' }}>
            {String(d.desc)}
          </p>
        )}
        {!!d.ctaLabel && (
          <a style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 32px', background: 'var(--lito-cream,#FAFAF9)', color: 'var(--lito-ink,#0A0A0A)', fontFamily: 'var(--font-body,Inter)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {String(d.ctaLabel)}
          </a>
        )}
      </div>
    </div>
  )
}
