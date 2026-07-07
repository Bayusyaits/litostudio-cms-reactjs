import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})

export function BrandStorySection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const image   = String(d.image ?? 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&h=1000&fit=crop&q=80')
  const eyebrow = String(d.eyebrow ?? 'Our Story')
  const heading = String(d.title ?? d.heading ?? "We Don't Follow\nTrends. We Set Them.")
  const body1   = String(d.body1 ?? 'NONOX WEAR was founded in 2020 with a single mission: create clothing for people who move differently. We started with a small studio in Kemang, Jakarta — three designers, a shared laptop, and an obsession with the intersection of utility and aesthetics.')
  const body2   = String(d.body2 ?? 'Today we operate across Jakarta, Yogyakarta, and Central Java, with a growing presence across Southeast Asia. Every collection is designed in-house, tested on real streets, and built to last beyond the season.')
  const statNum = String(d.statNum ?? '04')
  const statLabel = String(d.statLabel ?? 'Years Strong')
  const [h1, h2 = ''] = heading.split('\n')

  return (
    <section style={{ background: 'var(--nx-bg,#fff)', padding: '96px 0' }}>
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 clamp(24px,2.9vw,40px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          {/* image */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', background: '#e8e8e8' }}>
              <AppImage src={image} alt={eyebrow}
                objectFit="cover"
                wrapperStyle={{ position: 'absolute', inset: 0 }}
                style={{ width: '100%', height: '100%' }} />
            </div>
            {/* caption badge */}
            <div style={{ position: 'absolute', bottom: -1, right: -1, background: 'var(--nx-text,#111)', color: 'var(--nx-bg,#fff)', padding: '20px 24px' }}>
              <div style={DISP({ fontSize: 40, fontWeight: 800, lineHeight: 1 })}>{statNum}</div>
              <div style={BODY({ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, marginTop: 4 })}>{statLabel}</div>
            </div>
          </div>
          {/* text */}
          <div>
            <p style={BODY({ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-text-muted,#777)', margin: '0 0 16px' })}>{eyebrow}</p>
            <h2 style={DISP({ fontSize: 'clamp(32px,3.5vw,52px)', fontWeight: 800, lineHeight: 0.92, letterSpacing: '-0.025em', textTransform: 'uppercase', margin: '0 0 28px' })}>
              {h1}{h2 && <><br />{h2}</>}
            </h2>
            <p style={BODY({ fontSize: 15, lineHeight: 1.75, color: 'var(--nx-text-muted,#555)', margin: '0 0 18px' })}>{body1}</p>
            <p style={BODY({ fontSize: 15, lineHeight: 1.75, color: 'var(--nx-text-muted,#555)', margin: 0 })}>{body2}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
