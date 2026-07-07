import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

const POSTS = [
  { title: 'How to layer actives without irritation', cat: 'Routine',     img: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=700&h=470&fit=crop&q=80' },
  { title: 'The case for low-pH cleansing',            cat: 'Ingredients', img: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=700&h=470&fit=crop&q=80' },
  { title: 'Inside our Bandung formulation lab',       cat: 'Studio',      img: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=700&h=470&fit=crop&q=80' },
]

export function BlogHighlightSection({ block }: { block: Block }) {
  const d       = block.data as Record<string, unknown>
  const eyebrow = String(d.eyebrow ?? '(07) The journal')
  const heading = String(d.heading ?? 'Notes on skin & ritual')
  const linkText= String(d.linkText ?? 'Read the journal')
  const rawItems= Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : []
  const posts   = rawItems.length ? rawItems : (POSTS as Record<string, unknown>[])

  return (
    <section style={{ background: 'var(--bx-bg,#FAF8F5)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(56px,8vw,110px) clamp(24px,3vw,40px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 44, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={BODY({ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent-text,#8B5E3C)', display: 'flex', gap: 8 })}>
              <span style={{ fontWeight: 600 }}>{eyebrow.match(/\((\d+)\)/)?.[0] ?? '(07)'}</span>
              {eyebrow.replace(/^\(\d+\)\s*/, '')}
            </span>
            <h2 style={DISP({ fontSize: 'clamp(34px,5vw,60px)', fontWeight: 400, margin: '14px 0 0', color: 'var(--bx-text,#2C2420)' })}>
              {heading}
            </h2>
          </div>
          <span style={BODY({ fontSize: 12, color: 'var(--bx-text,#2C2420)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--bx-text,#2C2420)', paddingBottom: 2 })}>
            {linkText} →
          </span>
        </div>
        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 'clamp(20px,2.5vw,34px)' }}>
          {posts.map((p, i) => (
            <div key={i} style={{ cursor: 'pointer' }}>
              <div style={{ aspectRatio: '3/2', overflow: 'hidden', background: 'var(--bx-surface-2,#EDE9E3)', borderRadius: 2 }}>
                {(p.img) ? (
                  <AppImage src={String(p.img)} alt={String(p.title ?? '')} objectFit="cover"
                    wrapperStyle={{ width: '100%', height: '100%' }}
                    style={{ width: '100%', height: '100%', transition: 'transform .4s' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%' }} />
                )}
              </div>
              <p style={BODY({ fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent-text,#8B5E3C)', margin: '16px 0 8px' })}>
                {String(p.cat ?? '')}
              </p>
              <h3 style={DISP({ fontSize: 23, color: 'var(--bx-text,#2C2420)', margin: 0, lineHeight: 1.2, fontWeight: 400 })}>
                {String(p.title ?? '')}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
