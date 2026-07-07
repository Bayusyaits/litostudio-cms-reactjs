import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})

const DEFAULT_SLIDES = [
  { id:'1', label:'FIZ-R200 Campaign', img:'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=640&h=840&fit=crop&q=80' },
  { id:'2', label:'MX-150 Series',     img:'https://images.unsplash.com/photo-1445205170230-053b83016050?w=640&h=840&fit=crop&q=80' },
  { id:'3', label:'Revo-125 Drop',     img:'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=640&h=840&fit=crop&q=80' },
  { id:'4', label:'Astrea Legend',     img:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=640&h=840&fit=crop&q=80' },
  { id:'5', label:'Pulsar Collection', img:'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=640&h=840&fit=crop&q=80' },
]

export function LookbookSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const eyebrow = String(d.eyebrow ?? 'Lookbook')
  const heading = String(d.title ?? 'Campaign Highlights')
  const slides  = (d.slides as typeof DEFAULT_SLIDES) ?? DEFAULT_SLIDES

  return (
    <section style={{ background: 'var(--nx-bg,#fff)', paddingBottom: 80 }}>
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 clamp(24px,2.9vw,40px)', paddingBottom: 24 }}>
        <p style={BODY({ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-text-muted,#777)', margin: '0 0 10px' })}>{eyebrow}</p>
        <h2 style={DISP({ fontSize: 'clamp(28px,3vw,44px)', fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: 0 })}>{heading}</h2>
      </div>
      {/* Scrollable row of lb-cards */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 clamp(24px,2.9vw,40px)' }}>
        {slides.map(s => (
          <div key={s.id} style={{ position: 'relative', flexShrink: 0, width: 300, aspectRatio: '4/5', overflow: 'hidden', background: '#e8e8e8', cursor: 'pointer' }}>
            <AppImage src={s.img} alt={s.label}
              objectFit="cover"
              wrapperStyle={{ position: 'absolute', inset: 0 }}
              style={{ width: '100%', height: '100%' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 16px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
              <span style={BODY({ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff' })}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
