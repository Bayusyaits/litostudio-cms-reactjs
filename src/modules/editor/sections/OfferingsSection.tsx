/**
 * OfferingsSection — visual replica of website OfferingSection.vue
 * 4-column card grid with 4:5 aspect images, gradient overlay, badge, content.
 * Design tokens from canvas-website-tokens.css (already imported by EditorCanvas).
 */

import type { Block } from '@/types/editor.types'
import type { ServicesBlockData } from '@/types/editor.types'

const MOCK_OFFERS = [
  { title: 'Wedding Photography', category: 'Wedding', description: 'Timeless documentation of your most important day.', image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=480&q=80', badge: 'Popular' },
  { title: 'Portrait Session',    category: 'Portrait', description: 'Intimate sessions that reveal authentic character.',   image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=480&q=80', badge: '' },
  { title: 'Documentary Film',    category: 'Film',    description: 'Cinematic storytelling from beginning to end.',        image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=480&q=80', badge: 'New' },
  { title: 'Commercial Shoot',    category: 'Commercial', description: 'Brand imagery that speaks to your audience.',      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=480&q=80', badge: '' },
]

export function OfferingsSection({ block }: { block: Block }) {
  const d = block.data as ServicesBlockData
  const offers = d.items?.length ? d.items.map((it, i) => ({
    title: it.title,
    category: (it as unknown as Record<string,string>).category ?? '',
    description: it.description,
    image: (it as unknown as Record<string,string>).image ?? MOCK_OFFERS[i % MOCK_OFFERS.length].image,
    badge: (it as unknown as Record<string,string>).badge ?? '',
  })) : MOCK_OFFERS

  const headingLines = (d.heading ?? 'Layanan\nTerpilih').split('\n')

  return (
    <section style={{ padding: '96px 0', background: 'var(--cms-card-bg, var(--lito-cream, #F7F4EE))' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 80px' }}>

        {/* Section header */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)' }}>
              {d.sectionNumber ?? '03'}
            </span>
            <span style={{ width: 32, height: 1, background: 'var(--lito-gold, #D4A853)', opacity: 0.5 }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #9E9E9E)' }}>
              {d.sectionLabel ?? 'Our Services'}
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,5vw,60px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary, #111111)', margin: 0 }}>
            {headingLines[0]}
            {headingLines[1] && <><br /><em>{headingLines[1]}</em></>}
          </h2>
        </div>

        {/* 4-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {offers.map((offer, i) => (
            <article key={i} style={{ display: 'flex', flexDirection: 'column', background: 'var(--cms-surface-3, #FFFFFF)', overflow: 'hidden', borderRadius: 2, transition: 'transform 0.3s' }}>

              {/* Image 4:5 */}
              <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', flexShrink: 0 }}>
                <img
                  src={offer.image}
                  alt={offer.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)' }} />
                {/* badge */}
                {offer.badge && (
                  <span style={{ position: 'absolute', top: 12, left: 12, background: 'var(--lito-gold, #D4A853)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 2 }}>
                    {offer.badge}
                  </span>
                )}
                {/* category (bottom of image) */}
                <span style={{ position: 'absolute', bottom: 12, left: 16, fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                  {offer.category}
                </span>
              </div>

              {/* Content */}
              <div style={{ padding: '20px 20px 24px', flex: 1 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--text-primary, #111111)', margin: '0 0 8px', lineHeight: 1.2 }}>
                  {offer.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted, #9E9E9E)', margin: 0 }}>
                  {offer.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
