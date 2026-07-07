/**
 * lito/OfferingSection — CMS canvas preview for the lito "Offerings/Services" section.
 *
 * Mirrors templates/lito/components/sections/OfferingSection.vue exactly:
 *   • cream bg (#F7F4EE), py-24 lg:py-32
 *   • SectionLabel format: (03)   OUR SERVICES
 *   • h2: 2-line display heading (line 2 italic)
 *   • 4-col grid: 4:5 aspect images with gradient overlay
 *   • Gold badge (Popular/New), category chip at bottom of image
 *   • Card content: serif title, gold italic subtitle, description, price + CTA
 */

import type { Block } from '@/types/editor.types'
import type { ServicesBlockData } from '@/types/editor.types'
import { AppImage }   from '@/components/atoms/AppImage'

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_OFFERS = [
  { title: 'Wedding Photography', category: 'Wedding',    subtitle: 'Timeless documentation',   description: 'Timeless, emotional coverage of your wedding day from preparation to reception.', image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=480&q=80', badge: 'Popular', price: 'IDR 6.500.000' },
  { title: 'Portrait Session',    category: 'Portrait',   subtitle: 'Authentic character',       description: 'Intimate sessions in natural environments that reveal who you truly are.',          image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=480&q=80', badge: '',        price: 'IDR 3.500.000' },
  { title: 'Documentary Film',    category: 'Film',       subtitle: 'Cinematic storytelling',    description: 'Full-day cinematic storytelling from beginning to end.',                           image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=480&q=80', badge: 'New',     price: 'IDR 12.000.000' },
  { title: 'Commercial Shoot',    category: 'Commercial', subtitle: 'Brand imagery',             description: 'Professional brand imagery that connects with your audience.',                      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=480&q=80', badge: '',        price: 'IDR 8.000.000' },
]

// ── Shared sub-component ──────────────────────────────────────────────────────

/** Matches SectionLabel.vue: "(03)   LABEL" */
function SectionLabel({ number, label }: { number?: string; label: string }) {
  return (
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A9189', margin: 0 }}>
      {number && <span style={{ opacity: 0.5 }}>({number})</span>}
      <span style={{ marginLeft: number ? 12 : 0 }}>{label}</span>
    </p>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LitoOfferingSection({ block }: { block: Block }) {
  const d = block.data as ServicesBlockData
  const number  = String((d as unknown as Record<string,unknown>).sectionNumber ?? '03')
  const label   = String((d as unknown as Record<string,unknown>).sectionLabel  ?? 'Our Services')
  const rawHead = String(d.heading ?? 'Layanan\nTerpilih')
  const [line1 = '', line2 = ''] = rawHead.split('\n')

  const offers = d.items?.length
    ? d.items.map((it, i) => ({
        title:       it.title,
        category:    (it as unknown as Record<string,string>).category ?? '',
        subtitle:    (it as unknown as Record<string,string>).subtitle ?? '',
        description: it.description,
        image:       (it as unknown as Record<string,string>).image ?? MOCK_OFFERS[i % MOCK_OFFERS.length].image,
        badge:       (it as unknown as Record<string,string>).badge ?? '',
        price:       (it as unknown as Record<string,string>).price ?? '',
      }))
    : MOCK_OFFERS

  return (
    <section style={{ padding: '96px 0', background: 'var(--cms-card-bg, #F7F4EE)', color: 'var(--text-primary, #111111)' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 clamp(24px,5.5vw,80px)' }}>

        {/* ── Section header ── */}
        <div style={{ marginBottom: 64 }}>
          <SectionLabel number={number} label={label} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,4.5vw,56px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary, #111111)', margin: '16px 0 0' }}>
            {line1}
            {line2 && <><br /><em>{line2}</em></>}
          </h2>
        </div>

        {/* ── 4-col grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {offers.map((offer, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', background: 'var(--cms-surface-3, #FFFFFF)', borderRadius: 2, overflow: 'hidden' }}>
              {/* 4:5 image */}
              <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', background: '#E8E3DB', flexShrink: 0 }}>
                <AppImage
                  src={offer.image}
                  alt={offer.title}
                  objectFit="cover"
                  wrapperStyle={{ position: 'absolute', inset: 0 }}
                  style={{ width: '100%', height: '100%', transition: 'transform 0.5s ease' }}
                />
                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)' }} />
                {/* Gold badge */}
                {offer.badge && (
                  <span style={{ position: 'absolute', top: 12, left: 12, background: 'var(--lito-gold, #D4A853)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 2 }}>
                    {offer.badge}
                  </span>
                )}
                {/* Category chip */}
                {offer.category && (
                  <span style={{ position: 'absolute', bottom: 12, left: 12, fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
                    {offer.category}
                  </span>
                )}
              </div>

              {/* Card content */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px 20px 24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, lineHeight: 1.2, color: 'var(--text-primary, #111)', margin: '0 0 4px' }}>
                  {offer.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontStyle: 'italic', color: 'var(--lito-gold, #D4A853)', margin: '0 0 8px' }}>
                  {offer.subtitle}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: '#6B6560', lineHeight: 1.65, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '0 0 16px' }}>
                  {offer.description}
                </p>
                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 14, borderTop: '1px solid var(--lito-border, #D9D2C7)' }}>
                  {offer.price && (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--text-primary, #111)' }}>
                      {offer.price}
                    </span>
                  )}
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-primary, #111)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Book →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
