import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'
import { useState } from 'react'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

const CATS = ['All', 'Routine', 'Ingredients', 'Studio', 'Wellness']

const POSTS = [
  { title: 'How to layer actives without irritation', cat: 'Routine',     img: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=700&h=470&fit=crop&q=80', date: 'Jun 2025' },
  { title: 'The case for low-pH cleansing',            cat: 'Ingredients', img: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=700&h=470&fit=crop&q=80', date: 'May 2025' },
  { title: 'Inside our Bandung formulation lab',       cat: 'Studio',      img: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=700&h=470&fit=crop&q=80', date: 'Apr 2025' },
  { title: 'Barrier repair: what it means and why',    cat: 'Ingredients', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=700&h=470&fit=crop&q=80', date: 'Mar 2025' },
  { title: 'Evening rituals worth keeping',            cat: 'Wellness',    img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=700&h=470&fit=crop&q=80', date: 'Feb 2025' },
  { title: 'Reading an ingredient list',               cat: 'Ingredients', img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=700&h=470&fit=crop&q=80', date: 'Jan 2025' },
]

export function JournalListingSection({ block }: { block: Block }) {
  const d       = block.data as Record<string, unknown>
  const heading = String(d.heading ?? 'The journal')
  const [cat, setCat] = useState('All')

  const visible = POSTS.filter((p) => cat === 'All' || p.cat === cat)

  return (
    <section style={{ background: 'var(--bx-bg,#FAF8F5)' }}>
      {/* Page hero */}
      <div style={{ padding: 'clamp(60px,8vw,100px) 0 clamp(32px,4vw,48px)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(24px,3vw,40px)' }}>
          <span style={BODY({ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent-text,#8B5E3C)', display: 'block', marginBottom: 16 })}>
            Journal
          </span>
          <h1 style={DISP({ fontSize: 'clamp(42px,7vw,100px)', fontWeight: 400, lineHeight: 0.92, margin: 0, color: 'var(--bx-text,#2C2420)' })}>
            {heading}
          </h1>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(24px,3vw,40px) 40px' }}>
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
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(24px,3vw,40px) clamp(56px,8vw,100px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(20px,2.5vw,36px)' }}>
          {visible.map((p, i) => (
            <div key={i} style={{ cursor: 'pointer' }}>
              <div style={{ aspectRatio: '3/2', overflow: 'hidden', background: 'var(--bx-surface-2,#EDE9E3)', borderRadius: 2, marginBottom: 16 }}>
                <AppImage src={p.img} alt={p.title} objectFit="cover"
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  style={{ width: '100%', height: '100%', transition: 'transform .4s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={BODY({ fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent-text,#8B5E3C)', margin: 0 })}>
                  {p.cat}
                </p>
                <p style={BODY({ fontSize: 11, color: 'var(--bx-text-muted,#7A6E68)', margin: 0 })}>
                  {p.date}
                </p>
              </div>
              <h3 style={DISP({ fontSize: 22, fontWeight: 400, color: 'var(--bx-text,#2C2420)', margin: 0, lineHeight: 1.2 })}>
                {p.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
