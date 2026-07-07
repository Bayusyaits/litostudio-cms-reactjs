import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

export function BrandStorySection({ block }: { block: Block }) {
  const d          = block.data as Record<string, unknown>
  const values     = Array.isArray(d.values) ? d.values as string[] : []
  const currentYear = new Date().getFullYear()
  const yearsCount  = d.since ? currentYear - Number(d.since) : null

  return (
    <section style={{ background: 'var(--lito-cream,#FAFAF9)', padding: 'clamp(56px,8vw,100px) 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        {/* Image side */}
        <div style={{ position: 'relative' }}>
          <div style={{ background: '#EDEDED', aspectRatio: '4/5', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {d.image ? (
              <AppImage src={String(d.image)} alt="" priority objectFit="cover" wrapperStyle={{ position: 'absolute', inset: 0 }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <span style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 10, color: '#999', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Brand Image</span>
            )}
          </div>
          {yearsCount !== null && (
            <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, background: 'var(--brand,#E84500)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <span style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{yearsCount}</span>
              <span style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
                {String(d.yearsStrongLabel ?? 'Years')}
              </span>
            </div>
          )}
        </div>
        {/* Text side */}
        <div>
          <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brand,#E84500)', marginBottom: 16, marginTop: 0 }}>
            {String(d.eyebrow ?? 'Our Story')}
          </p>
          <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--lito-ink,#0A0A0A)', margin: 0, marginBottom: 20 }}>
            {String(d.title ?? 'Born from a Passion for Storytelling')}
          </h2>
          <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 14, lineHeight: 1.7, color: '#666', margin: 0, marginBottom: 24 }}>
            {String(d.description ?? 'Tell your brand story here.')}
          </p>
          {values.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {values.map((v, i) => (
                <span key={i} style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--lito-ink,#0A0A0A)', padding: '5px 12px', border: '1px solid var(--lito-border,rgba(0,0,0,.15))' }}>
                  {v}
                </span>
              ))}
            </div>
          )}
          {!!d.ctaText && (
            <a style={{ display: 'inline-block', fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--lito-ink,#0A0A0A)', textDecoration: 'none', borderBottom: '1px solid var(--lito-ink,#0A0A0A)', paddingBottom: 2 }}>
              {String(d.ctaText)}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
