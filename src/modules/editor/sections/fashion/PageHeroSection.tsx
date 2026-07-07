import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})

export function PageHeroSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const image   = String(d.heroImage ?? d.image ?? 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&h=900&fit=crop&q=80')
  const eyebrow = String(d.eyebrow ?? '(01) — About Us')
  const heading = String(d.title ?? d.heading ?? 'About\nNONOX')
  const desc    = String(d.description ?? '')
  const breadcrumb = String(d.breadcrumb ?? 'About')
  const height  = String(d.height ?? '70vh')
  const [h1, h2 = ''] = heading.split('\n')

  return (
    <section style={{ position: 'relative', height, minHeight: 380, overflow: 'hidden', color: '#fff' }}>
      <AppImage src={image} alt=""
        objectFit="cover"
        wrapperStyle={{ position: 'absolute', inset: 0 }}
        style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.72))' }} />
      <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, padding: '0 clamp(24px,2.9vw,40px)' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <span style={BODY({ fontSize: 12, opacity: 0.6 })}>Home</span>
          <span style={BODY({ fontSize: 12, opacity: 0.35 })}>/</span>
          <span style={BODY({ fontSize: 12, opacity: 0.9 })}>{breadcrumb}</span>
        </nav>
        <p style={BODY({ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, margin: '0 0 12px' })}>{eyebrow}</p>
        <h1 style={DISP({ fontSize: 'clamp(44px,6vw,84px)', fontWeight: 800, lineHeight: 0.92, letterSpacing: '-0.025em', textTransform: 'uppercase', margin: '0 0 16px' })}>
          {h1}{h2 && <><br />{h2}</>}
        </h1>
        {desc && <p style={BODY({ fontSize: 15, maxWidth: 540, opacity: 0.75, lineHeight: 1.65, margin: 0 })}>{desc}</p>}
      </div>
    </section>
  )
}
