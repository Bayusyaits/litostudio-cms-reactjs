import type { Block } from '@/types/editor.types'

export function PromoBannersSection({ block }: { block: Block }) {
  const d     = block.data as Record<string, unknown>
  const items = Array.isArray(d.items)
    ? d.items as Array<{ image?: string; title?: string; link?: string; buttonText?: string }>
    : [{ title: 'Featured Story' }, { title: 'New Journal' }]

  return (
    <section style={{ background: 'var(--lito-cream,#FAFAF9)', padding: 'clamp(56px,8vw,100px) 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length},1fr)`, gap: 12 }}>
          {items.map((item, i) => (
            <div key={i} style={{ position: 'relative', minHeight: 320, background: item.image ? undefined : '#EDEDED', backgroundImage: item.image ? `url(${item.image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
              {!!item.image && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 50%)' }} />}
              <div style={{ position: 'relative', zIndex: 1, padding: 24 }}>
                <p style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 20, fontWeight: 400, color: item.image ? '#fff' : 'var(--lito-ink,#0A0A0A)', margin: 0, marginBottom: 12 }}>
                  {item.title ?? `Promo ${i + 1}`}
                </p>
                <a style={{ display: 'inline-block', fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: item.image ? '#fff' : 'var(--lito-ink,#0A0A0A)', textDecoration: 'none', borderBottom: `1px solid ${item.image ? '#fff' : 'var(--lito-ink,#0A0A0A)'}` }}>
                  {item.buttonText ?? 'Explore'}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
