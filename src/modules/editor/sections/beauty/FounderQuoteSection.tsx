import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

export function FounderQuoteSection({ block }: { block: Block }) {
  const d       = block.data as Record<string, unknown>
  const eyebrow = String(d.eyebrow   ?? '(04) From the founder')
  const quote   = String(d.quote     ?? '"I built Seroja for skin like mine — reactive, tired, asking only to be left calm. Every formula starts with one question: does it respect the barrier?"')
  const accent  = String(d.quoteAccent ?? 'does it respect the barrier?')
  const name    = String(d.founderName ?? 'Dewi Anggraini')
  const role    = String(d.founderRole ?? 'Founder & formulator')
  const image   = String(d.image      ?? '')
  const avatar  = String(d.avatar     ?? '')

  const parts = quote.split(accent)

  return (
    <section style={{ background: 'var(--bx-text,#2C2420)', color: 'var(--bx-bg,#FAF8F5)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(60px,9vw,130px) clamp(24px,3vw,40px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 'clamp(28px,5vw,72px)', alignItems: 'center' }}>
          {/* Image */}
          <div style={{ aspectRatio: '4/5', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
            {image ? (
              <AppImage src={image} alt={name} objectFit="cover"
                wrapperStyle={{ width: '100%', height: '100%' }}
                style={{ width: '100%', height: '100%' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={BODY({ fontSize: 11, opacity: 0.4 })}>Founder photo</span>
              </div>
            )}
          </div>
          {/* Quote */}
          <div>
            <span style={BODY({ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.55)', display: 'flex', gap: 8, marginBottom: 24 })}>
              <span style={{ fontWeight: 600 }}>{eyebrow.match(/\((\d+)\)/)?.[0] ?? '(04)'}</span>
              {eyebrow.replace(/^\(\d+\)\s*/, '')}
            </span>
            <blockquote style={DISP({ fontWeight: 400, fontSize: 'clamp(26px,3.4vw,46px)', lineHeight: 1.18, letterSpacing: '-0.01em', margin: 0, color: 'var(--bx-bg,#FAF8F5)' })}>
              {parts[0]}
              {parts.length > 1 && (
                <span style={{ fontStyle: 'italic', color: 'var(--bx-accent,#C4956A)' }}>{accent}</span>
              )}
              {parts[1] ?? ''}
            </blockquote>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 32 }}>
              {avatar ? (
                <AppImage src={avatar} alt={name} objectFit="cover"
                  wrapperStyle={{ width: 48, height: 48, borderRadius: 999, overflow: 'hidden', flexShrink: 0 }}
                  style={{ width: '100%', height: '100%' }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 999, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
              )}
              <div>
                <p style={BODY({ fontSize: 13.5, fontWeight: 600, margin: 0, color: 'var(--bx-bg,#FAF8F5)' })}>{name}</p>
                <p style={BODY({ fontSize: 12, opacity: 0.6, margin: '3px 0 0', color: 'var(--bx-bg,#FAF8F5)' })}>{role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
