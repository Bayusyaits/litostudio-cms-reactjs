import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})

export function AboutCTASection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const image   = String(d.image ?? 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&h=500&fit=crop&q=80')
  const heading = String(d.title ?? d.heading ?? "Join Our Fashion\nCommunity")
  const cta1    = String(d.cta1Label ?? 'Shop Collection')
  const cta2    = String(d.cta2Label ?? 'Contact Us')
  const [h1, h2 = ''] = heading.split('\n')

  return (
    <section style={{ position: 'relative', minHeight: 380, overflow: 'hidden', color: '#fff' }}>
      <AppImage src={image} alt=""
        objectFit="cover"
        wrapperStyle={{ position: 'absolute', inset: 0 }}
        style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px clamp(24px,2.9vw,40px)', minHeight: 380 }}>
        <h2 style={DISP({ fontSize: 'clamp(40px,5vw,72px)', fontWeight: 800, lineHeight: 0.92, letterSpacing: '-0.025em', textTransform: 'uppercase', margin: '0 0 32px' })}>
          {h1}{h2 && <><br />{h2}</>}
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={BODY({ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 32px', background: '#fff', color: '#111', border: 'none', cursor: 'pointer' })}>{cta1}</button>
          <button style={BODY({ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 32px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.6)', cursor: 'pointer' })}>{cta2}</button>
        </div>
      </div>
    </section>
  )
}
