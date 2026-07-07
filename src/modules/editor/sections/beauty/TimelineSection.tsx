import type { Block } from '@/types/editor.types'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

const DEFAULTS = [
  { year: '2019', title: 'Founded',      description: 'Our brand was born in Bandung. First batch sold out in a weekend.' },
  { year: '2020', title: 'First Series', description: 'Debut collection of 4 SKUs. Goes viral on Indonesian social media.' },
  { year: '2021', title: 'Expansion',    description: 'Online store launches. Ships to all 34 provinces.' },
  { year: '2022', title: 'Reformulation', description: 'All formulas upgraded to meet EU Cosmetics Regulation standards.' },
  { year: '2023', title: 'Refill line',  description: 'Glass-first packaging and refill pouches cut plastic by 70%.' },
]

export function TimelineSection({ block }: { block: Block }) {
  const d       = block.data as Record<string, unknown>
  const heading = String(d.heading ?? 'Our journey')
  const eyebrow = String(d.eyebrow ?? 'History')
  const rawItems= Array.isArray(d.entries) ? (d.entries as Record<string, unknown>[]) : Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : []
  const entries = rawItems.length ? rawItems : (DEFAULTS as Record<string, unknown>[])

  return (
    <section style={{ background: 'var(--bx-bg,#FAF8F5)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(56px,8vw,100px) clamp(24px,3vw,40px)' }}>
        {eyebrow && (
          <span style={BODY({ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent-text,#8B5E3C)', display: 'block', marginBottom: 16 })}>
            {eyebrow}
          </span>
        )}
        <h2 style={DISP({ fontSize: 'clamp(34px,5vw,60px)', fontWeight: 400, margin: '0 0 52px', color: 'var(--bx-text,#2C2420)' })}>
          {heading}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(entries.length, 5)},1fr)` }}>
          {entries.map((e, i) => {
            const isLast = i === entries.length - 1
            return (
              <div key={i} style={{ paddingTop: 28, paddingRight: isLast ? 0 : 32, borderTop: '2px solid var(--bx-text,#2C2420)', borderRight: isLast ? 'none' : '1px solid var(--bx-border,rgba(44,36,32,0.12))' }}>
                <p style={DISP({ fontSize: 'clamp(26px,3vw,40px)', fontWeight: 400, color: 'var(--bx-text-muted,#7A6E68)', margin: '0 0 12px' })}>
                  {String(e.year ?? '')}
                </p>
                <p style={BODY({ fontSize: 13, fontWeight: 600, color: 'var(--bx-text,#2C2420)', margin: '0 0 8px' })}>
                  {String(e.title ?? '')}
                </p>
                <p style={BODY({ fontSize: 13, lineHeight: 1.65, color: 'var(--bx-text-muted,#7A6E68)', margin: 0 })}>
                  {String(e.description ?? '')}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
