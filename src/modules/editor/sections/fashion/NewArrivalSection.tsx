import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})

const PRODUCTS = [
  { id:'1', large:true, badge:'new', name:'Fiz-R200G', price:'$1,234', img:'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&h=950&fit=crop&q=80' },
  { id:'2', large:false, badge:'sold', name:'Fiz-R200O', price:'$200', img:'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=420&h=500&fit=crop&q=80' },
  { id:'3', large:false, badge:'', name:'Fiz-R200J', price:'$70', img:'https://images.unsplash.com/photo-1445205170230-053b83016050?w=420&h=500&fit=crop&q=80' },
  { id:'4', large:false, badge:'', name:'Fiz-R200R', price:'$123', img:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=420&h=500&fit=crop&q=80' },
  { id:'5', large:false, badge:'', name:'Fiz-R200M', price:'$140', img:'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=420&h=500&fit=crop&q=80' },
]

export function NewArrivalSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const heading = String(d.title ?? 'New Arrival')
  const link    = String(d.linkLabel ?? 'Catalogue')

  return (
    <section style={{ background: 'var(--nx-bg,#fff)', padding: '72px 0' }}>
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 clamp(24px,2.9vw,40px)' }}>
        {/* section-hdr */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
          <h2 style={DISP({ fontSize: 'clamp(28px,3vw,44px)', fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: 0 })}>{heading}</h2>
          <span style={BODY({ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nx-text,#111)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 })}>
            {link} ↗
          </span>
        </div>
        {/* arrival-grid: 1 large + 4 small */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 12 }}>
          {PRODUCTS.map((p) => (
            <div key={p.id}
              style={{
                position: 'relative', overflow: 'hidden', background: '#f0f0f0', cursor: 'pointer',
                gridRow: p.large ? '1 / 3' : undefined,
                aspectRatio: p.large ? '3/4' : '4/5',
              }}>
              <AppImage src={p.img} alt={p.name}
                objectFit="cover"
                wrapperStyle={{ position: 'absolute', inset: 0 }}
                style={{ width: '100%', height: '100%' }} />
              {p.badge === 'new' && (
                <span style={BODY({ position: 'absolute', top: 12, left: 12, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'var(--nx-text,#111)', color: 'var(--nx-bg,#fff)', padding: '4px 8px' })}>NEW</span>
              )}
              {p.badge === 'sold' && (
                <span style={BODY({ position: 'absolute', top: 12, left: 12, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' })}>SOLD</span>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px', background: 'var(--nx-bg,#fff)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={BODY({ fontSize: 12, fontWeight: 600, color: 'var(--nx-text,#111)' })}>{p.name}</span>
                <span style={BODY({ fontSize: 12, color: 'var(--nx-text-muted,#777)' })}>{p.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
