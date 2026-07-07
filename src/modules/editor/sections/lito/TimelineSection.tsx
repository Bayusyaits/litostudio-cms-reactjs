import type { Block } from '@/types/editor.types'

export function TimelineSection({ block }: { block: Block }) {
  const d       = block.data as Record<string, unknown>
  const entries = Array.isArray(d.entries)
    ? d.entries as Array<{ year: string; title: string; description: string }>
    : []

  return (
    <section style={{ background: 'var(--lito-ink,#0A0A0A)', padding: 'clamp(56px,8vw,100px) 32px', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', margin: 0, marginBottom: 48 }}>
          {String(d.heading ?? 'Our Journey')}
        </p>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 8 }}>
          {entries.map((e, i) => (
            <div key={i} style={{ flex: '0 0 220px', borderLeft: `2px solid ${i === 0 ? 'var(--brand,#E84500)' : 'rgba(255,255,255,0.15)'}`, padding: '0 0 32px 24px', position: 'relative', color: '#fff' }}>
              <div style={{ position: 'absolute', top: 0, left: -5, width: 8, height: 8, background: 'var(--brand,#E84500)', borderRadius: '50%' }} />
              <div style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 36, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 10, color: i === 0 ? 'var(--brand,#E84500)' : 'rgba(255,255,255,0.3)' }}>
                {e.year}
              </div>
              <div style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                {e.title}
              </div>
              <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
                {e.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
