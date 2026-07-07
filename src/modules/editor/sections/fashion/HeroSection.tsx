import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})

export function HeroSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const image   = String(d.heroImage ?? d.image ?? 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1920&h=1080&fit=crop&q=80')
  const label   = String(d.label   ?? '*New Arrival*')
  const heading = String(d.title   ?? d.heading ?? 'FIZ-R200\nSeries')
  const desc    = String(d.description ?? 'Step into a realm where fashion meets function with our newest techwear arrivals.')
  const cta1    = String(d.cta1Label ?? 'Shop Now')
  const cta2    = String(d.cta2Label ?? 'Explore Collection')
  const [h1, h2 = ''] = heading.split('\n')

  return (
    <section style={{ position: 'relative', height: '100vh', minHeight: 600, overflow: 'hidden', color: '#fff' }}>
      <AppImage src={image} alt=""
        objectFit="cover"
        wrapperStyle={{ position: 'absolute', inset: 0 }}
        style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)' }} />
      <div style={{ position: 'absolute', bottom: '12%', left: 'clamp(24px,4vw,80px)', maxWidth: 680 }}>
        <p style={BODY({ fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20, opacity: 0.8 })}>{label}</p>
        <h1 style={DISP({ fontSize: 'clamp(64px,9vw,140px)', fontWeight: 800, lineHeight: 0.88, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: '0 0 24px' })}>
          {h1}{h2 && <><br />{h2}</>}
        </h1>
        <p style={BODY({ fontSize: 15, lineHeight: 1.65, maxWidth: 520, opacity: 0.8, margin: '0 0 32px' })}>{desc}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={BODY({ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 32px', background: '#fff', color: '#111', border: 'none', cursor: 'pointer' })}>{cta1}</button>
          <button style={BODY({ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 32px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.6)', cursor: 'pointer' })}>{cta2}</button>
        </div>
      </div>
    </section>
  )
}
