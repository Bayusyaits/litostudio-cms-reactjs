/**
 * AboutSection — visual replica of website AboutSection.vue
 * 2-col: image left with floating "since" card, text right with stats.
 */

import type { Block } from '@/types/editor.types'
import type { TextBlockData } from '@/types/editor.types'

const MOCK_STATS = [
  { value: '200+', label: 'Sessions' },
  { value: '8+', label: 'Years' },
  { value: '15+', label: 'Cities' },
]

export function AboutSection({ block }: { block: Block }) {
  const d = block.data as TextBlockData & Record<string, unknown>

  const title    = (d.title    as string | undefined) ?? 'Tentang\nKami'
  const subtitle = (d.subtitle as string | undefined) ?? 'Kami percaya setiap momen berharga untuk diabadikan. Dengan pendekatan dokumenter yang hangat, kami hadir untuk merekam cerita Anda dengan jujur dan penuh rasa.'
  const since    = (d.since    as string | undefined) ?? '2017'
  const cities   = (d.cities  as string | undefined) ?? 'Jakarta · Yogyakarta · Jawa Tengah'
  const stats    = (d.stats   as typeof MOCK_STATS | undefined) ?? MOCK_STATS
  const image    = (d.image   as string | undefined) ?? 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80'

  const titleLines = title.split('\n')

  return (
    <section style={{ padding: '120px 0', background: 'var(--cms-card-bg, var(--lito-cream, #F7F4EE))', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

          {/* Left: image + floating card */}
          <div style={{ position: 'relative' }}>
            <div style={{ aspectRatio: '3/4', overflow: 'hidden', borderRadius: 2, maxWidth: 460 }}>
              <img src={image} alt="About Lito Studio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {/* Floating "since" card */}
            <div style={{
              position: 'absolute', bottom: -24, right: -32,
              background: 'var(--cms-card-bg, #F7F4EE)',
              border: '1px solid var(--lito-border, #D9D2C7)',
              padding: 20, width: 176, borderRadius: 2,
              boxShadow: '0 12px 40px rgba(17,17,17,0.12)',
            }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted, #9E9E9E)', marginBottom: 4 }}>Since</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 300, lineHeight: 1, color: 'var(--text-primary, #111)', marginBottom: 8 }}>{since}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted, #9E9E9E)', lineHeight: 1.5 }}>{cities}</p>
            </div>
          </div>

          {/* Right: text + stats */}
          <div>
            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)' }}>02</span>
              <span style={{ width: 32, height: 1, background: 'var(--lito-gold, #D4A853)', opacity: 0.5 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #9E9E9E)' }}>Our Story</span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,4vw,56px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary, #111111)', marginBottom: 32 }}>
              {titleLines[0]}
              {titleLines[1] && <><br /><em>{titleLines[1]}</em></>}
            </h2>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75, color: 'var(--text-muted, #6B6560)', marginBottom: 40 }}>
              {subtitle}
            </p>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 40, paddingBottom: 40, borderBottom: '1px solid var(--lito-border, #D9D2C7)' }}>
              {stats.map((s, i) => (
                <div key={i}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300, color: 'var(--text-primary, #111)', marginBottom: 4 }}>{s.value}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted, #9E9E9E)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a href="#" onClick={e => e.preventDefault()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-primary, #111)', textDecoration: 'none' }}>
              Kenali Kami Lebih →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
