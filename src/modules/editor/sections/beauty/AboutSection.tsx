import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

export function AboutSection({ block }: { block: Block }) {
  const d       = block.data as Record<string, unknown>
  const eyebrow = String(d.eyebrow     ?? 'Our Story')
  const title   = String(d.title       ?? 'Born from a belief that beauty should be kind.')
  const body    = String(d.description ?? 'Lito Beauty was founded with a simple conviction: your skin deserves ingredients you can trust. Every product we formulate is backed by dermatologist research, free from harmful chemicals, and tested by real people with real skin concerns.')
  const image   = String(d.image       ?? '')
  const cta     = String(d.ctaText     ?? 'Read our story')

  return (
    <section style={{ background: 'var(--bx-bg,#FAF8F5)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(56px,8vw,110px) clamp(24px,3vw,40px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,5vw,80px)', alignItems: 'center' }}>
          {/* Image */}
          <div style={{ aspectRatio: '4/5', overflow: 'hidden', background: 'var(--bx-surface-2,#EDE9E3)', borderRadius: 2 }}>
            {image ? (
              <AppImage src={image} alt={title} objectFit="cover"
                wrapperStyle={{ width: '100%', height: '100%' }}
                style={{ width: '100%', height: '100%' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={BODY({ fontSize: 11, color: 'var(--bx-text-muted,#7A6E68)' })}>Brand image</span>
              </div>
            )}
          </div>
          {/* Text */}
          <div>
            <span style={BODY({ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent-text,#8B5E3C)', display: 'block', marginBottom: 20 })}>
              {eyebrow}
            </span>
            <h2 style={DISP({ fontSize: 'clamp(30px,4vw,52px)', fontWeight: 400, lineHeight: 1.05, margin: 0, color: 'var(--bx-text,#2C2420)' })}>
              {title}
            </h2>
            <p style={BODY({ fontSize: 15, lineHeight: 1.8, color: 'var(--bx-text-muted,#7A6E68)', margin: '24px 0 0', maxWidth: '46ch' })}>
              {body}
            </p>
            {cta && (
              <span style={BODY({ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 28, fontSize: 12.5, color: 'var(--bx-text,#2C2420)', cursor: 'pointer', borderBottom: '1px solid var(--bx-text,#2C2420)', paddingBottom: 2 })}>
                {cta} →
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
