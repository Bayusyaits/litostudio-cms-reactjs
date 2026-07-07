import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})

const DEFAULT_PROMOS = [
  { id:'1', name:'MX-150', sub:'New Collection', img:'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=500&fit=crop&q=80' },
  { id:'2', name:'Revo-125', sub:'Limited Drop', img:'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=500&fit=crop&q=80' },
]

export function PromoBannersSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const promos = (d.promos as typeof DEFAULT_PROMOS) ?? DEFAULT_PROMOS

  return (
    <section style={{ background: 'var(--nx-bg,#fff)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>
        {promos.map(p => (
          <div key={p.id} style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', cursor: 'pointer' }}>
            <AppImage src={p.img} alt={p.name}
              objectFit="cover"
              wrapperStyle={{ position: 'absolute', inset: 0 }}
              style={{ width: '100%', height: '100%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
            {/* promo-text */}
            <div style={{ position: 'absolute', bottom: 32, left: 32 }}>
              <div style={DISP({ fontSize: 'clamp(28px,3vw,44px)', fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', color: '#fff', lineHeight: 0.95 })}>{p.name}</div>
              <div style={BODY({ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginTop: 8 })}>{p.sub}</div>
            </div>
            {/* arrow */}
            <div style={{ position: 'absolute', bottom: 32, right: 32, width: 32, height: 32, border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>→</div>
          </div>
        ))}
      </div>
    </section>
  )
}
