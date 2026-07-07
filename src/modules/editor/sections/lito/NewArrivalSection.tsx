import type { Block } from '@/types/editor.types'

export function NewArrivalSection({ block }: { block: Block }) {
  const d     = block.data as Record<string, unknown>
  const count = typeof d.productCount === 'number' ? d.productCount : 8
  const items = Array.from({ length: count })

  return (
    <section style={{ background: 'var(--lito-cream,#FAFAF9)', padding: 'clamp(56px,8vw,100px) 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--lito-ink,#0A0A0A)', margin: 0 }}>
            {String(d.title ?? 'New Work')}
          </h2>
          <a style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', textDecoration: 'none' }}>
            {String(d.catalogueText ?? 'View All')} →
          </a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {items.map((_, i) => (
            <div key={i} style={{ background: '#F5F5F4' }}>
              <div style={{ paddingBottom: '125%', position: 'relative', background: '#EDEDED', overflow: 'hidden' }}>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body,Inter)', fontSize: 10, color: '#999', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Item {i + 1}
                </span>
              </div>
              <div style={{ padding: '12px 0' }}>
                <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 12, color: 'var(--lito-ink,#0A0A0A)', margin: 0, marginBottom: 4 }}>Item Name</p>
                <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 12, color: '#666', margin: 0 }}>—</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
