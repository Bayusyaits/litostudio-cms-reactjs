import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

export function CollaborationsSection({ block }: { block: Block }) {
  const d     = block.data as Record<string, unknown>
  const items: Array<{ name?: string; logo?: string }> =
    Array.isArray(d.items) && d.items.length > 0
      ? d.items as Array<{ name?: string; logo?: string }>
      : Array.from({ length: 6 }, (_, i) => ({ name: `Partner ${i + 1}`, logo: undefined }))

  return (
    <section style={{ background: 'var(--lito-cream,#FAFAF9)', padding: 'clamp(56px,8vw,100px) 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {!!d.eyebrow && (
          <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', margin: 0, marginBottom: 12 }}>
            {String(d.eyebrow)}
          </p>
        )}
        <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink,#0A0A0A)', margin: 0, marginBottom: 40 }}>
          {String(d.heading ?? 'Our Collaborations')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, border: '1px solid var(--lito-border,rgba(0,0,0,.1))' }}>
          {items.map((item, i) => (
            <div key={i} style={{ aspectRatio: '3/2', background: '#F5F5F4', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--lito-border,rgba(0,0,0,.1))', borderBottom: '1px solid var(--lito-border,rgba(0,0,0,.1))' }}>
              {item.logo
                ? <AppImage src={item.logo} alt={item.name ?? ''} objectFit="contain" style={{ maxHeight: 48, maxWidth: 120, opacity: 0.6 }} wrapperStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                : <p style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 13, color: '#666', margin: 0 }}>{item.name}</p>
              }
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
