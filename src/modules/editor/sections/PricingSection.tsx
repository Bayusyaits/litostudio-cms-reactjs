/**
 * PricingSection — Lito photography pricing canvas renderer.
 *
 * Mirrors website OfferSection.vue / PricingSection.vue:
 *  - Section header: eyebrow + title + subtitle (Cormorant Garamond)
 *  - Package cards: cream bg, gold accent border on featured, ink text
 *  - Package includes: checkmark list with gold tick
 *  - CTA button row per card
 *  - Note text below grid
 *
 * Design tokens: --lito-cream, --lito-ink, --lito-gold
 * Typography: Cormorant Garamond (display), Inter (body)
 */

import type { Block, PricingBlockData } from '@/types/editor.types'
import { Check } from 'lucide-react'

const DEFAULT_PLANS = [
  {
    name: 'Sesi Dasar',
    price: 'Rp 2.5 Jt',
    period: '/ sesi',
    description: 'Cocok untuk portrait, pre-wedding, atau dokumentasi keluarga.',
    features: [
      '2 jam sesi foto',
      '1 lokasi',
      '30 foto terseleksi (retouched)',
      'Galeri online pribadi',
      'File resolusi tinggi',
    ],
    ctaText: 'Pesan Sekarang',
    ctaUrl: '/contact',
    featured: false,
  },
  {
    name: 'Paket Lengkap',
    price: 'Rp 5.5 Jt',
    period: '/ sesi',
    description: 'Ideal untuk pernikahan, event, atau personal branding profesional.',
    features: [
      '6 jam sesi foto & video',
      'Hingga 2 lokasi',
      '80 foto terseleksi (retouched)',
      '3 menit highlight video',
      'Galeri online pribadi',
      'File resolusi tinggi',
      '1 album cetak (softcover)',
    ],
    ctaText: 'Pesan Sekarang',
    ctaUrl: '/contact',
    featured: true,
  },
  {
    name: 'Paket Premium',
    price: 'Custom',
    period: '',
    description: 'Untuk proyek komersial, brand campaign, atau dokumentasi perjalanan.',
    features: [
      'Durasi & lokasi fleksibel',
      'Foto & video full coverage',
      'Retouching premium',
      'Highlight film sinematik',
      'Dedicated art director',
      'Konsultasi kreatif pra-produksi',
    ],
    ctaText: 'Diskusikan Proyek',
    ctaUrl: '/contact',
    featured: false,
  },
]

export function PricingSection({ block }: { block: Block }) {
  const d = block.data as PricingBlockData & Record<string, unknown>

  const eyebrow  = (d.eyebrow  as string | undefined) ?? 'Investasi'
  const heading  = d.heading ?? 'Paket & Harga'
  const subtitle = (d.subtitle as string | undefined) ?? 'Setiap sesi dirancang dengan penuh perhatian untuk mengabadikan cerita Anda secara otentik. Hubungi kami untuk paket khusus sesuai kebutuhan.'
  const plans    = (d.plans as typeof DEFAULT_PLANS | undefined)?.length
    ? d.plans as typeof DEFAULT_PLANS
    : DEFAULT_PLANS
  const note     = (d.note as string | undefined) ?? '* Harga belum termasuk biaya perjalanan di luar Jabodetabek dan Yogyakarta. Semua paket dapat dikustomisasi.'

  return (
    <section
      style={{
        padding: '100px 0',
        background: 'var(--cms-card-bg, var(--lito-cream, #F7F4EE))',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{
            display: 'block',
            fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--lito-gold, #D4A853)',
            marginBottom: 16,
          }}>
            {eyebrow}
          </span>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(36px, 4vw, 52px)',
            fontWeight: 300,
            lineHeight: 1.05,
            letterSpacing: '-0.01em',
            color: 'var(--lito-ink, #111111)',
            margin: '0 0 20px',
          }}>
            {heading}
          </h2>
          {subtitle && (
            <p style={{
              fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
              fontSize: 15,
              lineHeight: 1.65,
              color: 'rgba(17,17,17,0.55)',
              maxWidth: 560,
              margin: '0 auto',
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Package cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${plans.length <= 2 ? plans.length : 3}, 1fr)`,
          gap: 28,
          alignItems: 'stretch',
        }}>
          {plans.map((plan, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '36px 32px',
                background: plan.featured
                  ? 'var(--lito-ink, #111111)'
                  : 'rgba(255,255,255,0.7)',
                border: plan.featured
                  ? '1.5px solid var(--lito-gold, #D4A853)'
                  : '1px solid rgba(17,17,17,0.1)',
                borderRadius: 2,
                position: 'relative',
                boxShadow: plan.featured
                  ? '0 8px 40px rgba(17,17,17,0.12)'
                  : '0 2px 12px rgba(17,17,17,0.04)',
              }}
            >
              {/* Featured badge */}
              {plan.featured && (
                <div style={{
                  position: 'absolute',
                  top: -1, left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--lito-gold, #D4A853)',
                  padding: '4px 20px',
                  borderRadius: '0 0 8px 8px',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#111111',
                  }}>
                    Paling Populer
                  </span>
                </div>
              )}

              {/* Plan name */}
              <div style={{
                fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: plan.featured
                  ? 'var(--lito-gold, #D4A853)'
                  : 'rgba(17,17,17,0.45)',
                marginBottom: 12,
                marginTop: plan.featured ? 16 : 0,
              }}>
                {plan.name}
              </div>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
                <span style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 'clamp(28px, 3vw, 40px)',
                  fontWeight: 400,
                  lineHeight: 1,
                  color: plan.featured ? '#ffffff' : 'var(--lito-ink, #111111)',
                }}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span style={{
                    fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
                    fontSize: 13,
                    color: plan.featured ? 'rgba(255,255,255,0.5)' : 'rgba(17,17,17,0.4)',
                    paddingBottom: 4,
                  }}>
                    {plan.period}
                  </span>
                )}
              </div>

              {/* Description */}
              {'description' in plan && plan.description && (
                <p style={{
                  fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: plan.featured ? 'rgba(255,255,255,0.6)' : 'rgba(17,17,17,0.5)',
                  margin: '0 0 24px',
                }}>
                  {plan.description}
                </p>
              )}

              {/* Divider */}
              <div style={{
                height: 1,
                background: plan.featured
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(17,17,17,0.08)',
                marginBottom: 24,
              }} />

              {/* Features list */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plan.features.map((f, fi) => (
                  <li key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Check
                      size={14}
                      style={{
                        color: 'var(--lito-gold, #D4A853)',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                    <span style={{
                      fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: plan.featured ? 'rgba(255,255,255,0.75)' : 'rgba(17,17,17,0.65)',
                    }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div
                style={{
                  display: 'block',
                  padding: '12px 24px',
                  marginTop: 32,
                  textAlign: 'center',
                  fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  borderRadius: 2,
                  cursor: 'default',
                  userSelect: 'none',
                  ...(plan.featured
                    ? {
                        background: 'var(--lito-gold, #D4A853)',
                        color: '#111111',
                      }
                    : {
                        background: 'transparent',
                        border: '1px solid rgba(17,17,17,0.2)',
                        color: 'var(--lito-ink, #111111)',
                      }
                  ),
                }}
              >
                {plan.ctaText}
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        {note && (
          <p style={{
            marginTop: 40,
            textAlign: 'center',
            fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
            fontSize: 12,
            lineHeight: 1.6,
            color: 'rgba(17,17,17,0.4)',
          }}>
            {note}
          </p>
        )}
      </div>
    </section>
  )
}
