import type { Block } from '@/types/editor.types'

export function LookbookSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>

  return (
    <section style={{ background: 'var(--lito-cream,#FAFAF9)', padding: 'clamp(56px,8vw,100px) 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', margin: 0, marginBottom: 8 }}>
            {String(d.eyebrow ?? 'Featured Work')}
          </p>
          <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink,#0A0A0A)', margin: 0 }}>
            {String(d.title ?? 'Portfolio')}
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: '280px 280px', gap: 8 }}>
          <div style={{ gridColumn: '1', gridRow: '1 / 3', background: '#EDEDED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Image 1</span>
          </div>
          {[2, 3, 4, 5].map(n => (
            <div key={n} style={{ background: '#EDEDED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Image {n}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
