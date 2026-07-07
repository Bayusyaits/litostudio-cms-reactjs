import type { Block } from '@/types/editor.types'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

const DEFAULTS = [
  { value: '100%', label: 'Natural Ingredients' },
  { value: 'Cruelty', label: 'Free Always' },
  { value: '30-Day', label: 'Money Back' },
  { value: 'Free', label: 'Shipping IDR500K+' },
]

export function StatisticsSection({ block }: { block: Block }) {
  const d       = block.data as Record<string, unknown>
  const eyebrow = String(d.eyebrow ?? '')
  const heading = String(d.heading ?? '')
  const rawItems= Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : []
  const stats   = rawItems.length ? rawItems : (DEFAULTS as Record<string, unknown>[])

  return (
    <section style={{ background: 'var(--bx-page-alt,#F3F0EB)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(56px,8vw,100px) clamp(24px,3vw,40px)' }}>
        {(eyebrow || heading) && (
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            {eyebrow && <span style={BODY({ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent-text,#8B5E3C)', display: 'block', marginBottom: 14 })}>{eyebrow}</span>}
            {heading && <h2 style={DISP({ fontSize: 'clamp(30px,4vw,52px)', fontWeight: 400, margin: 0, color: 'var(--bx-text,#2C2420)' })}>{heading}</h2>}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(stats.length, 4)},1fr)`, gap: 1, background: 'var(--bx-border,rgba(44,36,32,0.10))' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'var(--bx-page-alt,#F3F0EB)', padding: 'clamp(32px,4vw,48px) clamp(20px,3vw,36px)', textAlign: 'center' }}>
              <p style={DISP({ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 400, margin: 0, color: 'var(--bx-text,#2C2420)', lineHeight: 1 })}>
                {String(s.value ?? '')}
              </p>
              <p style={BODY({ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--bx-text-muted,#7A6E68)', margin: '12px 0 0' })}>
                {String(s.label ?? '')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
