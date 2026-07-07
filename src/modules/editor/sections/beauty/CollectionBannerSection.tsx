import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

export function CollectionBannerSection({ block }: { block: Block }) {
  const d       = block.data as Record<string, unknown>
  const eyebrow = String(d.eyebrow     ?? 'New Collection')
  const title   = String(d.title       ?? 'The New Season Is Here')
  const desc    = String(d.description ?? '')
  const cta1    = String(d.buttonText  ?? d.ctaLabel ?? 'Shop Now')
  const cta2    = String(d.ctaSecondaryText ?? d.cta2Label ?? 'Learn More')
  const image   = String(d.backgroundImage ?? d.image ?? '')

  return (
    <section style={{ position: 'relative', minHeight: 460, display: 'flex', alignItems: 'center', overflow: 'hidden', background: 'var(--bx-page-alt,#F3F0EB)' }}>
      {image && (
        <AppImage src={image} alt={title} objectFit="cover"
          wrapperStyle={{ position: 'absolute', inset: 0 }}
          style={{ width: '100%', height: '100%' }} />
      )}
      {/* overlay */}
      {image && <div style={{ position: 'absolute', inset: 0, background: 'rgba(44,36,32,0.45)' }} />}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, padding: 'clamp(60px,8vw,100px) clamp(24px,3vw,40px)' }}>
        <span style={BODY({ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: image ? 'rgba(250,248,245,0.7)' : 'var(--bx-accent-text,#8B5E3C)' })}>
          {eyebrow}
        </span>
        <h2 style={DISP({ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 400, lineHeight: 0.95, margin: '16px 0 0', color: image ? 'var(--bx-bg,#FAF8F5)' : 'var(--bx-text,#2C2420)', whiteSpace: 'pre-line' })}>
          {title}
        </h2>
        {desc && (
          <p style={BODY({ fontSize: 15, lineHeight: 1.7, color: image ? 'rgba(250,248,245,0.7)' : 'var(--bx-text-muted,#7A6E68)', margin: '18px 0 0', maxWidth: '44ch' })}>
            {desc}
          </p>
        )}
        <div style={{ display: 'flex', gap: 14, marginTop: 32, flexWrap: 'wrap' }}>
          <button style={BODY({ padding: '13px 28px', background: image ? 'var(--bx-bg,#FAF8F5)' : 'var(--bx-text,#2C2420)', color: image ? 'var(--bx-text,#2C2420)' : 'var(--bx-bg,#FAF8F5)', border: 0, borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer' })}>
            {cta1}
          </button>
          {cta2 && (
            <span style={BODY({ fontSize: 13, color: image ? 'var(--bx-bg,#FAF8F5)' : 'var(--bx-text,#2C2420)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderBottom: `1px solid ${image ? 'rgba(250,248,245,0.6)' : 'var(--bx-text,#2C2420)'}`, paddingBottom: 2 })}>
              {cta2} →
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
