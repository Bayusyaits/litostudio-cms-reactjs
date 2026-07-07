import type { Block } from '@/types/editor.types'

export function AboutCTASection({ block }: { block: Block }) {
  const d     = block.data as Record<string, unknown>
  const hasBg = !!d.backgroundImage

  return (
    <section style={{ position: 'relative', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: hasBg ? undefined : 'var(--lito-ink,#0A0A0A)', backgroundImage: hasBg ? `url(${d.backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff', padding: '60px 32px' }}>
        <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 'clamp(40px,5vw,72px)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.025em', margin: 0, marginBottom: 32 }}>
          {String(d.title ?? 'Ready to Explore?')}
        </h2>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a style={{ display: 'inline-block', padding: '14px 32px', background: 'var(--lito-cream,#FAFAF9)', color: 'var(--lito-ink,#0A0A0A)', fontFamily: 'var(--font-body,Inter)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {String(d.shopText ?? 'Explore Stories')}
          </a>
          <a style={{ display: 'inline-block', padding: '14px 32px', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', fontFamily: 'var(--font-body,Inter)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {String(d.contactText ?? 'Contact Us')}
          </a>
        </div>
      </div>
    </section>
  )
}
