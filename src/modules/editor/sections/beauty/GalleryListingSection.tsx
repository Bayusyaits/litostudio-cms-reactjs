import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'
import { useState } from 'react'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

const CATS = ['All', 'Products', 'Studio', 'Events', 'Editorial']

const ITEMS = [
  { title: 'Rosehip Oil Campaign',   cat: 'Products',  aspect: '3/4', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=800&fit=crop&q=80' },
  { title: 'Studio Shoot',           cat: 'Studio',    aspect: '4/3', img: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=700&h=525&fit=crop&q=80' },
  { title: 'Editorial — Calm Skin',  cat: 'Editorial', aspect: '3/4', img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=800&fit=crop&q=80' },
  { title: 'Jakarta Pop-up',         cat: 'Events',    aspect: '4/3', img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=700&h=525&fit=crop&q=80' },
  { title: 'Bandung Lab',            cat: 'Studio',    aspect: '1/1', img: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=600&fit=crop&q=80' },
  { title: 'Centella Serum Launch',  cat: 'Products',  aspect: '3/4', img: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=800&fit=crop&q=80' },
]

export function GalleryListingSection({ block }: { block: Block }) {
  const d       = block.data as Record<string, unknown>
  const heading = String(d.heading ?? 'Gallery')
  const [cat, setCat] = useState('All')

  const visible = ITEMS.filter((item) => cat === 'All' || item.cat === cat)
  // 3-col masonry split
  const cols = [0, 1, 2].map((ci) => visible.filter((_, i) => i % 3 === ci))

  return (
    <section style={{ background: 'var(--bx-bg,#FAF8F5)' }}>
      {/* Page hero */}
      <div style={{ padding: 'clamp(60px,8vw,100px) 0 clamp(32px,4vw,48px)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(24px,3vw,40px)' }}>
          <span style={BODY({ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent-text,#8B5E3C)', display: 'block', marginBottom: 16 })}>
            Gallery
          </span>
          <h1 style={DISP({ fontSize: 'clamp(42px,7vw,100px)', fontWeight: 400, lineHeight: 0.92, margin: 0, color: 'var(--bx-text,#2C2420)' })}>
            {heading}
          </h1>
        </div>
      </div>

      {/* Filter + count */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(24px,3vw,40px) 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATS.map((c) => {
            const on = cat === c
            return (
              <button key={c} onClick={() => setCat(c)} style={BODY({ fontSize: 12, padding: '8px 18px', borderRadius: 999, cursor: 'pointer', border: '1px solid ' + (on ? 'var(--bx-text,#2C2420)' : 'var(--bx-border,rgba(44,36,32,0.15))'), background: on ? 'var(--bx-text,#2C2420)' : 'transparent', color: on ? 'var(--bx-bg,#FAF8F5)' : 'var(--bx-text,#2C2420)', transition: 'all .2s' })}>
                {c}
              </button>
            )
          })}
        </div>
        <span style={BODY({ fontSize: 12, color: 'var(--bx-text-muted,#7A6E68)' })}>
          {visible.length} items
        </span>
      </div>

      {/* Masonry */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(24px,3vw,40px) clamp(56px,8vw,100px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, alignItems: 'start' }}>
          {cols.map((col, ci) => (
            <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {col.map((item, ii) => (
                <div key={ii} style={{ position: 'relative', overflow: 'hidden', background: 'var(--bx-surface-2,#EDE9E3)', borderRadius: 2, cursor: 'pointer', aspectRatio: item.aspect }}>
                  <AppImage src={item.img} alt={item.title} objectFit="cover"
                    wrapperStyle={{ position: 'absolute', inset: 0 }}
                    style={{ width: '100%', height: '100%', transition: 'transform .4s' }} />
                  {/* Overlay on hover */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(44,36,32,0)', transition: 'background .3s' }} />
                  {/* Caption */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 16px 16px', background: 'linear-gradient(transparent,rgba(44,36,32,0.6))' }}>
                    <p style={BODY({ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--bx-accent,#C4956A)', margin: '0 0 4px' })}>
                      {item.cat}
                    </p>
                    <p style={DISP({ fontSize: 16, color: 'var(--bx-bg,#FAF8F5)', margin: 0, fontWeight: 400 })}>
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
