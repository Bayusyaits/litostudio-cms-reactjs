/**
 * TestimonialsSection — visual replica of website TestimonialsSection.vue
 * Dark background, client list left + featured quote right.
 * Gold accent, Cormorant display, Inter body.
 */

import { useState } from 'react'
import type { Block } from '@/types/editor.types'
import type { TestimonialsBlockData } from '@/types/editor.types'

const MOCK_REVIEWS = [
  { name: 'Anindita Ramadhani', project: 'Wedding · Jakarta', quote: 'Lito Studio captured every emotion perfectly. The photos tell our story in a way we never imagined possible. Absolutely breathtaking work.' },
  { name: 'Bram & Sekar',       project: 'Pre-Wedding · Yogyakarta', quote: 'From the first consultation to the final album, the experience was seamless. The team understood our vision immediately.' },
  { name: 'Mega Putri',         project: 'Portrait · Bali', quote: 'I was nervous about a portrait session but they made me feel so comfortable. The results are incredible — I cry every time I see them.' },
  { name: 'Rizal Firmansyah',   project: 'Commercial · Jakarta', quote: 'Professional, creative, and delivered on time. The brand images elevated our campaign significantly.' },
]

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('')
}

export function TestimonialsSection({ block }: { block: Block }) {
  const d = block.data as TestimonialsBlockData
  const reviews = d.items?.length ? d.items.map(it => ({
    name: it.name,
    project: it.title ?? '',
    quote: it.quote,
  })) : MOCK_REVIEWS

  const [activeIndex, setActive] = useState(0)
  const activeReview = reviews[activeIndex]
  const headingLines = (d.heading ?? 'Kata Mereka\nTentang Kami').split('\n')

  return (
    <section style={{ padding: '80px 0 128px', background: '#0f0f0f' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)', marginBottom: 12 }}>
            {d.sectionNumber ?? '06'} — {d.sectionLabel ?? 'Client Reviews'}
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,5vw,60px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: '#FFFFFF', margin: 0 }}>
            {headingLines[0]}
            {headingLines[1] && <><br /><em>{headingLines[1]}</em></>}
          </h2>
        </div>

        {/* Desktop: 2-col */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 40 }}>

          {/* Left: client list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {reviews.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  borderRadius: 2,
                  border: `1px solid ${activeIndex === i ? 'rgba(212,168,83,0.5)' : 'rgba(255,255,255,0.05)'}`,
                  background: activeIndex === i ? 'rgba(255,255,255,0.05)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: activeIndex === i ? '#FFFFFF' : 'rgba(255,255,255,0.5)', margin: 0 }}>{r.name}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: activeIndex === i ? 'var(--lito-gold, #D4A853)' : 'rgba(255,255,255,0.25)', margin: '3px 0 0' }}>{r.project}</p>
              </button>
            ))}
          </div>

          {/* Right: featured quote */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 280 }}>
            <div>
              {/* Large quote SVG */}
              <svg style={{ color: 'rgba(212,168,83,0.2)', marginBottom: 24 }} width="48" height="36" viewBox="0 0 48 36" fill="currentColor">
                <path d="M0 36V20.571C0 9.143 6.4 2.571 19.2 0l2.4 4.571C13.6 6.286 9.6 10.857 8.8 17.143H16V36H0zm26.667 0V20.571C26.667 9.143 33.067 2.571 45.867 0l2.133 4.571C40 6.286 36 10.857 35.2 17.143H42.667V36H26.667z" />
              </svg>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2vw,24px)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', maxWidth: 680, margin: 0 }}>
                &ldquo;{activeReview?.quote}&rdquo;
              </p>
            </div>

            {/* Attribution */}
            <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 16, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(212,168,83,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--lito-gold, #D4A853)', fontWeight: 500 }}>{initials(activeReview?.name ?? 'A')}</span>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: '#FFFFFF', margin: 0 }}>{activeReview?.name}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>{activeReview?.project}</p>
              </div>

              {/* dot nav */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {reviews.map((_, i) => (
                  <button key={i} type="button" onClick={() => setActive(i)} style={{ width: i === activeIndex ? 20 : 6, height: 6, borderRadius: 999, background: i === activeIndex ? 'rgba(212,168,83,0.9)' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.3s' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
