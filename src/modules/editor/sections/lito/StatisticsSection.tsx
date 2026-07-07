import type { Block } from '@/types/editor.types'

const DEFAULTS = [
  { value: '500+', label: 'Stories Captured' },
  { value: '12+', label: 'Years of Experience' },
  { value: '48', label: 'Destinations' },
  { value: '100%', label: 'Client Satisfaction' },
]

export function StatisticsSection({ block }: { block: Block }) {
  const d        = block.data as Record<string, unknown>
  const rawItems = Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : []
  const stats    = rawItems.length ? rawItems : (DEFAULTS as Record<string, unknown>[])

  return (
    <section style={{ background: 'var(--lito-ink,#0A0A0A)', padding: 'clamp(56px,8vw,100px) 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {(!!d.eyebrow || !!d.heading) && (
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            {!!d.eyebrow && (
              <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', margin: 0, marginBottom: 14 }}>
                {String(d.eyebrow)}
              </p>
            )}
            {!!d.heading && (
              <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 'clamp(30px,4vw,52px)', fontWeight: 900, letterSpacing: '-0.025em', textTransform: 'uppercase', margin: 0, color: 'var(--lito-cream,#FAFAF9)' }}>
                {String(d.heading)}
              </h2>
            )}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(stats.length, 4)},1fr)`, gap: 1, background: 'rgba(255,255,255,0.08)' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'var(--lito-ink,#0A0A0A)', padding: 'clamp(32px,4vw,48px) clamp(20px,3vw,36px)', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 'clamp(40px,6vw,72px)', fontWeight: 900, margin: 0, color: 'var(--lito-cream,#FAFAF9)', lineHeight: 1 }}>
                {String(s.value ?? s.prefix ?? '')}{String(s.suffix ?? '')}
              </p>
              <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '12px 0 0' }}>
                {String(s.label ?? '')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
