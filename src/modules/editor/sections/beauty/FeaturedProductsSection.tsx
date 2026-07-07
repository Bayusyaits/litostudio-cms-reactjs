import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'
import { useState } from 'react'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

const FILTERS = [
  { k: 'all', l: 'All' },
  { k: 'face', l: 'Face' },
  { k: 'skin', l: 'Skin' },
  { k: 'body', l: 'Body' },
]

const PRODUCTS = [
  { id: '1', name: 'Rosehip Facial Oil', price: 'IDR 285.000', cat: 'face', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=500&fit=crop&q=80' },
  { id: '2', name: 'Centella Serum', price: 'IDR 320.000', cat: 'skin', img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=500&fit=crop&q=80' },
  { id: '3', name: 'Barrier Cleanser', price: 'IDR 195.000', cat: 'face', img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=500&fit=crop&q=80' },
  { id: '4', name: 'Body Butter', price: 'IDR 210.000', cat: 'body', img: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=500&fit=crop&q=80' },
]

export function FeaturedProductsSection({ block }: { block: Block }) {
  const d       = block.data as Record<string, unknown>
  const eyebrow = String(d.eyebrow ?? '(03) The shelf')
  const heading = String(d.heading ?? 'Best sellers')
  const [cat, setCat] = useState('all')

  const visible = PRODUCTS.filter((p) => cat === 'all' || p.cat === cat)

  return (
    <section style={{ background: 'var(--bx-bg,#FAF8F5)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(56px,8vw,110px) clamp(24px,3vw,40px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
          <div>
            <span style={BODY({ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent-text,#8B5E3C)', display: 'flex', gap: 8 })}>
              <span style={{ fontWeight: 600 }}>{eyebrow.match(/\((\d+)\)/)?.[0] ?? '(03)'}</span>
              {eyebrow.replace(/^\(\d+\)\s*/, '')}
            </span>
            <h2 style={DISP({ fontSize: 'clamp(34px,5vw,60px)', fontWeight: 400, margin: '14px 0 0', color: 'var(--bx-text,#2C2420)' })}>
              {heading}
            </h2>
          </div>
        </div>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}>
          {FILTERS.map((f) => {
            const on = cat === f.k
            return (
              <button key={f.k} onClick={() => setCat(f.k)} style={BODY({ fontSize: 12, fontWeight: 500, letterSpacing: '.04em', padding: '8px 18px', borderRadius: 999, cursor: 'pointer', border: '1px solid ' + (on ? 'var(--bx-text,#2C2420)' : 'var(--bx-border,rgba(44,36,32,0.15))'), background: on ? 'var(--bx-text,#2C2420)' : 'transparent', color: on ? 'var(--bx-bg,#FAF8F5)' : 'var(--bx-text,#2C2420)', transition: 'all .2s' })}>
                {f.l}
              </button>
            )
          })}
        </div>
        {/* Product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'clamp(20px,2.5vw,32px) clamp(16px,2vw,24px)' }}>
          {visible.map((p) => (
            <div key={p.id} style={{ cursor: 'pointer' }}>
              <div style={{ aspectRatio: '4/5', overflow: 'hidden', background: 'var(--bx-surface-2,#EDE9E3)', borderRadius: 2 }}>
                <AppImage src={p.img} alt={p.name} objectFit="cover"
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  style={{ width: '100%', height: '100%', transition: 'transform .4s' }} />
              </div>
              <div style={{ marginTop: 14 }}>
                <p style={BODY({ fontSize: 13.5, fontWeight: 500, color: 'var(--bx-text,#2C2420)', margin: 0 })}>{p.name}</p>
                <p style={BODY({ fontSize: 12.5, color: 'var(--bx-text-muted,#7A6E68)', margin: '4px 0 0' })}>{p.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
