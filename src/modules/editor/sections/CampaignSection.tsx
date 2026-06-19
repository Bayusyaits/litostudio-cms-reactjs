/**
 * CampaignSection — visual replica of website CampaignSection.vue
 * Full-width dark banner with background image, gradient overlay, display text + CTA.
 */

import type { Block } from '@/types/editor.types'
import type { CTABlockData } from '@/types/editor.types'

export function CampaignSection({ block }: { block: Block }) {
  const d = block.data as CTABlockData & Record<string, unknown>

  const bg    = (d.backgroundImage as string | undefined) ?? 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1400&q=80'
  const label = (d.eyebrow        as string | undefined) ?? 'Special Campaign'
  const title = d.title ?? 'Abadikan Momen\nSpesial Anda'
  const desc  = d.description ?? 'Dapatkan sesi foto eksklusif dengan harga terbaik. Hubungi kami sekarang dan buat kenangan yang tidak terlupakan.'
  const cta   = d.buttonText ?? 'Pesan Sekarang'

  const titleLines = title.split('\n')

  return (
    <section style={{ position: 'relative', minHeight: 480, overflow: 'hidden' }}>
      {/* BG image */}
      <img src={bg} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      {/* Gradient overlay — darker at bottom */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.2) 100%)' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1440, margin: '0 auto', padding: '96px 80px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
        {/* Eyebrow label */}
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)', marginBottom: 20 }}>
          {label}
        </p>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,5vw,68px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: '#FFFFFF', margin: '0 0 24px', maxWidth: 640 }}>
          {titleLines[0]}
          {titleLines[1] && <><br /><em>{titleLines[1]}</em></>}
        </h2>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.72)', maxWidth: 480, marginBottom: 40 }}>
          {desc}
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <a href="#" onClick={e => e.preventDefault()} style={{ display: 'inline-block', padding: '14px 32px', background: 'var(--lito-gold, #D4A853)', color: '#111', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 2, textDecoration: 'none' }}>
            {cta}
          </a>
          <a href="#" onClick={e => e.preventDefault()} style={{ display: 'inline-block', padding: '14px 32px', border: '1px solid rgba(255,255,255,0.4)', color: '#FFF', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 2, textDecoration: 'none' }}>
            Lihat Portfolio
          </a>
        </div>
      </div>
    </section>
  )
}
