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
    <section className="pt-[80px] pb-[128px] bg-[#0f0f0f]">
      <div className="max-w-[1440px] mx-auto px-[80px]">

        {/* Header */}
        <div className="mb-12">
          <p className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--lito-gold,#D4A853)] mb-3">
            {d.sectionNumber ?? '06'} — {d.sectionLabel ?? 'Client Reviews'}
          </p>
          <h2 className="font-display text-[clamp(40px,5vw,60px)] font-light leading-none tracking-[-0.02em] text-white m-0">
            {headingLines[0]}
            {headingLines[1] && <><br /><em>{headingLines[1]}</em></>}
          </h2>
        </div>

        {/* Desktop: 2-col */}
        <div className="grid [grid-template-columns:1fr_3fr] gap-[40px]">

          {/* Left: client list */}
          <div className="flex flex-col gap-1">
            {reviews.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`text-left py-3 px-4 rounded-[2px] cursor-pointer transition-all duration-200 border ${
                  activeIndex === i
                    ? 'border-[rgba(212,168,83,0.5)] bg-[rgba(255,255,255,0.05)]'
                    : 'border-[rgba(255,255,255,0.05)] bg-transparent'
                }`}
              >
                <p className={`font-body text-[13px] font-medium m-0 ${activeIndex === i ? 'text-white' : 'text-[rgba(255,255,255,0.5)]'}`}>{r.name}</p>
                <p className={`font-body text-[10px] tracking-[0.12em] uppercase mt-[3px] mb-0 ${activeIndex === i ? 'text-[var(--lito-gold,#D4A853)]' : 'text-[rgba(255,255,255,0.25)]'}`}>{r.project}</p>
              </button>
            ))}
          </div>

          {/* Right: featured quote */}
          <div className="flex flex-col justify-between min-h-[280px]">
            <div>
              {/* Large quote SVG */}
              <svg className="text-[rgba(212,168,83,0.2)] mb-6" width="48" height="36" viewBox="0 0 48 36" fill="currentColor">
                <path d="M0 36V20.571C0 9.143 6.4 2.571 19.2 0l2.4 4.571C13.6 6.286 9.6 10.857 8.8 17.143H16V36H0zm26.667 0V20.571C26.667 9.143 33.067 2.571 45.867 0l2.133 4.571C40 6.286 36 10.857 35.2 17.143H42.667V36H26.667z" />
              </svg>
              <p className="font-display text-[clamp(18px,2vw,24px)] font-light italic leading-[1.6] text-[rgba(255,255,255,0.9)] max-w-[680px] m-0">
                &ldquo;{activeReview?.quote}&rdquo;
              </p>
            </div>

            {/* Attribution */}
            <div className="mt-8 flex items-center gap-4 border-t border-[rgba(255,255,255,0.1)] pt-6">
              <div className="w-11 h-11 rounded-full bg-[rgba(212,168,83,0.2)] flex items-center justify-center shrink-0">
                <span className="font-display text-[15px] text-[var(--lito-gold,#D4A853)] font-medium">{initials(activeReview?.name ?? 'A')}</span>
              </div>
              <div>
                <p className="font-body text-[13px] font-medium text-white m-0">{activeReview?.name}</p>
                <p className="font-body text-[11px] text-[rgba(255,255,255,0.45)] mt-[2px] mb-0">{activeReview?.project}</p>
              </div>

              {/* dot nav — width is dynamic (20 vs 6), must stay inline */}
              <div className="ml-auto flex gap-2">
                {reviews.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActive(i)}
                    style={{ width: i === activeIndex ? 20 : 6 }}
                    className={`h-[6px] rounded-full border-none cursor-pointer p-0 transition-[width] duration-300 ${
                      i === activeIndex ? 'bg-[rgba(212,168,83,0.9)]' : 'bg-[rgba(255,255,255,0.2)]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
