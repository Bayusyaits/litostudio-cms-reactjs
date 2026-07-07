import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})

const PLATFORMS = [
  { name:'Instagram', handle:'@nonoxwear',   followers:'48.2K', img:'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=400&h=400&fit=crop&q=80' },
  { name:'TikTok',    handle:'@nonoxwear',   followers:'31.7K', img:'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=400&fit=crop&q=80' },
  { name:'Shopee',    handle:'nonoxwear.id', followers:'12.4K', img:'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=400&fit=crop&q=80' },
  { name:'Tokopedia', handle:'nonoxwear',    followers:'9.8K',  img:'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&q=80' },
]

export function SocialGridSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const eyebrow   = String(d.eyebrow ?? 'Follow Us')
  const heading   = String(d.title ?? 'Stay Connected')
  const platforms = (d.platforms as typeof PLATFORMS) ?? PLATFORMS

  return (
    <section style={{ background: 'var(--nx-bg,#fff)', padding: '96px 0' }}>
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 clamp(24px,2.9vw,40px)' }}>
        <div style={{ marginBottom: 40 }}>
          <p style={BODY({ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-text-muted,#777)', margin: '0 0 10px' })}>{eyebrow}</p>
          <h2 style={DISP({ fontSize: 'clamp(28px,3vw,44px)', fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: 0 })}>{heading}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {platforms.map((p, i) => (
            <div key={i} style={{ cursor: 'pointer' }}>
              <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#e8e8e8', marginBottom: 12 }}>
                <AppImage src={p.img} alt={p.name}
                  objectFit="cover"
                  wrapperStyle={{ position: 'absolute', inset: 0 }}
                  style={{ width: '100%', height: '100%' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)' }} />
              </div>
              <div style={DISP({ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', color: 'var(--nx-text,#111)' })}>{p.name}</div>
              <div style={BODY({ fontSize: 12, color: 'var(--nx-text-muted,#777)' })}>{p.handle}</div>
              <div style={BODY({ fontSize: 11, fontWeight: 600, color: 'var(--nx-text-muted,#999)', marginTop: 2 })}>{p.followers} followers</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
