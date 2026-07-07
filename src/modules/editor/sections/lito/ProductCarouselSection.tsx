import type { Block } from '@/types/editor.types'

export function ProductCarouselSection({ block }: { block: Block }) {
  const d     = block.data as Record<string, unknown>
  const limit = typeof d.limit === 'number' ? d.limit : 8

  return (
    <section style={{ background: 'var(--lito-cream,#FAFAF9)', padding: 'clamp(56px,8vw,100px) 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--lito-ink,#0A0A0A)', margin: 0 }}>
            {String(d.title ?? 'Related Stories')}
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ width: 32, height: 32, border: '1px solid var(--lito-border,rgba(0,0,0,.1))', background: 'none', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#666' }}>←</button>
            <button style={{ width: 32, height: 32, border: '1px solid var(--lito-border,rgba(0,0,0,.1))', background: 'none', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#666' }}>→</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'hidden' }}>
          {Array.from({ length: Math.min(limit, 5) }).map((_, i) => (
            <div key={i} style={{ flexShrink: 0, width: 200 }}>
              <div style={{ paddingBottom: '125%', position: 'relative', background: '#EDEDED', overflow: 'hidden', marginBottom: 10 }}>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body,Inter)', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {i + 1}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 12, color: 'var(--lito-ink,#0A0A0A)', margin: 0, marginBottom: 2 }}>Story Title</p>
              <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 12, color: '#666', margin: 0 }}>Category</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
