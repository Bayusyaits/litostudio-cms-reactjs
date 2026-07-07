import type { Block } from '@/types/editor.types'

export function StoresSection({ block }: { block: Block }) {
  const d     = block.data as Record<string, unknown>
  const items = Array.isArray(d.items)
    ? d.items as Array<{ name?: string; address?: string; phone?: string; hours?: string; mapUrl?: string }>
    : []

  return (
    <section style={{ background: 'var(--lito-cream,#FAFAF9)', padding: 'clamp(56px,8vw,100px) 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {!!d.eyebrow && (
          <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brand,#E84500)', margin: 0, marginBottom: 12 }}>
            {String(d.eyebrow)}
          </p>
        )}
        <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink,#0A0A0A)', margin: 0, marginBottom: 40 }}>
          {String(d.heading ?? 'Find Us')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: '#F5F5F4', border: '1px solid var(--lito-border,rgba(0,0,0,.1))', borderRadius: 6, padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 18, fontWeight: 700, color: 'var(--lito-ink,#0A0A0A)', marginBottom: 4 }}>
                {item.name ?? `Location ${i + 1}`}
              </div>
              {!!item.address && (
                <div style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 13, color: '#666', marginBottom: 6, lineHeight: 1.5 }}>
                  {item.address}
                </div>
              )}
              {!!item.hours && (
                <div style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--brand,#E84500)', marginBottom: 12, whiteSpace: 'pre-line' }}>
                  {item.hours}
                </div>
              )}
              {!!item.mapUrl && (
                <a style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--lito-ink,#0A0A0A)', textDecoration: 'none', borderBottom: '1px solid rgba(0,0,0,.2)', paddingBottom: 2, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  Get Directions →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
