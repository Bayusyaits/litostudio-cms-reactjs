import type { Block } from '@/types/editor.types'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

const DEFAULTS = [
  { title: 'Barrier first',       desc: 'Low-pH, fragrance-free formulas that protect rather than strip — kind to reactive skin.' },
  { title: 'Traceable botanicals', desc: 'Rosehip, centella and sea-daffodil sourced from named growers across the archipelago.' },
  { title: 'Refill, don\'t rebuy', desc: 'Glass-first packaging with refill pouches that cut plastic by 70%.' },
  { title: 'Proven, not promised', desc: 'Every claim backed by third-party testing. No miracle language, ever.' },
]

export function ProductBenefitsSection({ block }: { block: Block }) {
  const d       = block.data as Record<string, unknown>
  const eyebrow = String(d.eyebrow ?? '(05) Why Seroja')
  const heading = String(d.heading ?? 'A quieter standard for clean skincare')
  const rawItems= Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : []
  const items   = rawItems.length ? rawItems : (DEFAULTS as Record<string, unknown>[])

  return (
    <section style={{ background: 'var(--bx-bg,#FAF8F5)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(56px,8vw,110px) clamp(24px,3vw,40px)' }}>
        <div style={{ maxWidth: '52ch', marginBottom: 52 }}>
          <span style={BODY({ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent-text,#8B5E3C)', display: 'flex', gap: 8 })}>
            <span style={{ fontWeight: 600 }}>{eyebrow.match(/\((\d+)\)/)?.[0] ?? '(05)'}</span>
            {eyebrow.replace(/^\(\d+\)\s*/, '')}
          </span>
          <h2 style={DISP({ fontSize: 'clamp(34px,5vw,60px)', fontWeight: 400, margin: '14px 0 0', color: 'var(--bx-text,#2C2420)' })}>
            {heading}
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 'clamp(24px,3vw,48px)' }}>
          {items.map((item, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--bx-text,#2C2420)', paddingTop: 22 }}>
              <span style={BODY({ fontSize: 11, color: 'var(--bx-accent-text,#8B5E3C)', letterSpacing: '.1em' })}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 style={DISP({ fontSize: 24, color: 'var(--bx-text,#2C2420)', margin: '12px 0 10px', fontWeight: 400 })}>
                {String(item.title ?? 'Benefit')}
              </h3>
              <p style={BODY({ fontSize: 13.5, lineHeight: 1.65, color: 'var(--bx-text-muted,#7A6E68)', margin: 0 })}>
                {String(item.desc ?? item.description ?? '')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
