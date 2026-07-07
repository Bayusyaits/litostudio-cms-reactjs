import type { Block } from '@/types/editor.types'

export function MarqueeSection({ block }: { block: Block }) {
  const d     = block.data as Record<string, unknown>
  const items = Array.isArray(d.items)
    ? d.items as string[]
    : ['Photography', 'Stories', 'Destinations', 'Journal']
  const repeated = [...items, ...items, ...items]

  return (
    <section style={{ paddingTop: 20, paddingBottom: 20, background: 'var(--lito-ink,#0A0A0A)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 0, alignItems: 'center', whiteSpace: 'nowrap' }}>
        {repeated.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 24 }}>
            <span style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', padding: '0 32px' }}>
              {item}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8 }}>●</span>
          </span>
        ))}
      </div>
    </section>
  )
}
