import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

export function HeroSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const eyebrow    = String(d.eyebrow    ?? '(01) Botanical skincare · est. Bandung')
  const title      = String(d.title      ?? 'Skin that remembers calm')
  const titleAccent= String(d.titleAccent ?? 'remembers')
  const desc       = String(d.description ?? 'Cold-pressed oils, low-pH cleansers and quiet, effective serums — formulated for sensitive skin and made slowly with archipelago botanicals.')
  const cta1       = String(d.cta1Label  ?? 'Shop the shelf')
  const cta2       = String(d.cta2Label  ?? 'Our story')
  const image      = String(d.heroImage  ?? '')
  const stat1      = [String(d.stat1Value ?? '12+'), String(d.stat1Label ?? 'Clean formulas')]
  const stat2      = [String(d.stat2Value ?? '98%'), String(d.stat2Label ?? 'Natural origin')]
  const stat3      = [String(d.stat3Value ?? '4.9★'), String(d.stat3Label ?? '2,400 reviews')]

  // Split title at the accent word so we can wrap it in italic color
  const parts = title.split(titleAccent)

  return (
    <section style={{ background: 'var(--bx-bg,#FAF8F5)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(28px,5vw,56px) clamp(24px,3vw,40px) clamp(40px,6vw,80px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 'clamp(24px,4vw,56px)', alignItems: 'end' }}>
          {/* Left — text */}
          <div>
            <span style={BODY({ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent-text,#8B5E3C)', display: 'flex', alignItems: 'center', gap: 8 })}>
              <span style={{ fontWeight: 600 }}>(01)</span>{eyebrow.replace(/^\(\d+\)\s*/, '')}
            </span>
            <h1 style={DISP({ fontSize: 'clamp(52px,9vw,128px)', margin: '20px 0 0', lineHeight: 0.92, fontWeight: 400 })}>
              {parts[0]}
              {parts.length > 1 && (
                <span style={{ fontStyle: 'italic', color: 'var(--bx-accent-text,#8B5E3C)' }}>{titleAccent}</span>
              )}
              {parts[1] ?? ''}
            </h1>
            <p style={BODY({ fontSize: 'clamp(14px,1.4vw,17px)', lineHeight: 1.7, color: 'var(--bx-text-muted,#7A6E68)', maxWidth: '42ch', margin: '26px 0 0' })}>
              {desc}
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 34, flexWrap: 'wrap', alignItems: 'center' }}>
              <button style={BODY({ padding: '14px 28px', background: 'var(--bx-text,#2C2420)', color: 'var(--bx-bg,#FAF8F5)', border: 0, borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' })}>
                {cta1}
              </button>
              <span style={BODY({ fontSize: 13, color: 'var(--bx-text,#2C2420)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--bx-text,#2C2420)', paddingBottom: 2 })}>
                {cta2} →
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'clamp(20px,4vw,48px)', marginTop: 48, flexWrap: 'wrap' }}>
              {[stat1, stat2, stat3].map(([val, lbl]) => (
                <div key={lbl}>
                  <p style={DISP({ fontSize: 32, color: 'var(--bx-text,#2C2420)', margin: 0, lineHeight: 1 })}>{val}</p>
                  <p style={BODY({ fontSize: 11, letterSpacing: '.04em', color: 'var(--bx-text-muted,#7A6E68)', margin: '6px 0 0' })}>{lbl}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Right — image */}
          <div style={{ position: 'relative' }}>
            {image ? (
              <AppImage src={image} alt={title}
                objectFit="cover"
                wrapperStyle={{ aspectRatio: '4/5', overflow: 'hidden', borderRadius: 4 }}
                style={{ width: '100%', height: '100%' }} />
            ) : (
              <div style={{ aspectRatio: '4/5', background: 'var(--bx-surface-2,#EDE9E3)', borderRadius: 4, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <span style={BODY({ fontSize: 11, color: 'var(--bx-text-muted,#7A6E68)', padding: 16 })}>Hero image</span>
              </div>
            )}
            {/* Quote chip */}
            <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18 }}>
              <span style={DISP({ display: 'block', background: 'rgba(250,248,245,0.88)', backdropFilter: 'blur(6px)', borderRadius: 4, padding: '12px 16px', fontStyle: 'italic', fontSize: 17, color: 'var(--bx-text,#2C2420)' })}>
                "The one I never travel without."
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
