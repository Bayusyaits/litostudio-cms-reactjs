import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})

const SLIDES = [
  { id:'1', name:'Vario-250', price:'$200', sold:true,  img:'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=420&h=560&fit=crop&q=80' },
  { id:'2', name:'NMAX',      price:'$50',  sold:false, img:'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=420&h=560&fit=crop&q=80' },
  { id:'3', name:'Pulsar',    price:'$1,203',sold:false,img:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=420&h=560&fit=crop&q=80' },
  { id:'4', name:'Fiz-R200M', price:'$302', sold:true,  img:'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=420&h=560&fit=crop&q=80' },
  { id:'5', name:'Aerox',     price:'$175', sold:false, img:'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=420&h=560&fit=crop&q=80' },
  { id:'6', name:'R15 Series',price:'$89',  sold:false, img:'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=420&h=560&fit=crop&q=80' },
]

export function ProductCarouselSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const heading = String(d.title ?? 'Featured Products')

  return (
    <section style={{ background: 'var(--nx-bg,#fff)', padding: '72px 0' }}>
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 clamp(24px,2.9vw,40px)', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h2 style={DISP({ fontSize: 'clamp(28px,3vw,44px)', fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: 0 })}>{heading}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {['←','→'].map(a => (
              <button key={a} style={{ width: 36, height: 36, border: '1px solid var(--nx-border,#e8e8e8)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--nx-text,#111)' }}>{a}</button>
            ))}
          </div>
        </div>
      </div>
      {/* Static 4-visible row for CMS preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(200px, 1fr))', gap: 12, padding: '0 clamp(24px,2.9vw,40px)', overflowX: 'auto' }}>
        {SLIDES.map(s => (
          <div key={s.id} style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#f0f0f0' }}>
              <AppImage src={s.img} alt={s.name}
                objectFit="cover"
                wrapperStyle={{ position: 'absolute', inset: 0 }}
                style={{ width: '100%', height: '100%' }} />
              {s.sold && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 52, height: 52, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...BODY({ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: '#fff' }) }}>SOLD</div>
              )}
            </div>
            <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={BODY({ fontSize: 12, fontWeight: 600, color: 'var(--nx-text,#111)' })}>{s.name}</span>
              <span style={BODY({ fontSize: 12, color: 'var(--nx-text-muted,#777)' })}>{s.price}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
