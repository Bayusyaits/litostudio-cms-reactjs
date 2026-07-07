import type { Block } from '@/types/editor.types'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

export function PageHeroSection({ block }: { block: Block }) {
  const d     = block.data as Record<string, unknown>
  const num    = String(d.num    ?? '01')
  const eyebrow= String(d.eyebrow ?? 'Stories')
  const title  = String(d.title   ?? 'Our Stories')
  const desc   = String(d.desc    ?? '')

  return (
    <section style={{ background: 'var(--bx-bg,#FAF8F5)', padding: 'clamp(60px,8vw,100px) 0 clamp(40px,6vw,64px)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(24px,3vw,40px)' }}>
        <span style={BODY({ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent-text,#8B5E3C)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 })}>
          <span style={{ fontWeight: 600 }}>({num})</span>{eyebrow}
        </span>
        <h1 style={DISP({ fontSize: 'clamp(42px,7vw,100px)', fontWeight: 400, lineHeight: 0.92, margin: 0, color: 'var(--bx-text,#2C2420)' })}>
          {title}
        </h1>
        {desc && (
          <p style={BODY({ fontSize: 'clamp(14px,1.2vw,16px)', lineHeight: 1.7, color: 'var(--bx-text-muted,#7A6E68)', maxWidth: '52ch', margin: '20px 0 0' })}>
            {desc}
          </p>
        )}
      </div>
    </section>
  )
}
