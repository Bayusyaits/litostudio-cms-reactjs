/**
 * StoriesSection — visual replica of website StoriesSection.vue
 * 3-col card grid with tall image + overlay content (category, title, location).
 */

import type { Block } from '@/types/editor.types'
import type { StoryBlockData } from '@/types/editor.types'

const MOCK_STORIES = [
  { id: '1', title: 'Pernikahan di Tepi Danau',   category: 'Wedding',    location: 'Yogyakarta', date: '12 Jan 2025', image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80' },
  { id: '2', title: 'Intimate Pre-Wedding Bali',  category: 'Pre-Wedding',location: 'Bali',        date: '5 Jan 2025',  image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80' },
  { id: '3', title: 'Family Portrait di Bandung', category: 'Family',     location: 'Bandung',     date: '28 Des 2024', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80' },
]

export function StoriesSection({ block }: { block: Block }) {
  const d = block.data as StoryBlockData
  const headingLines = (d.heading ?? 'Cerita\nBersama Kami').split('\n')
  const limit = d.limit ?? 3
  const stories = MOCK_STORIES.slice(0, limit)

  return (
    <section className="py-[120px] bg-[var(--cms-card-bg,var(--lito-cream,#F7F4EE))]">
      <div className="max-w-[1440px] mx-auto px-[80px]">

        {/* Header */}
        <div className="flex items-end justify-between mb-[56px]">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--lito-gold,#D4A853)]">05</span>
              <span className="w-8 h-px bg-[var(--lito-gold,#D4A853)] opacity-50" />
              <span className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--text-muted,#9E9E9E)]">Featured Stories</span>
            </div>
            <h2 className="font-display text-[clamp(40px,5vw,60px)] font-light leading-none tracking-[-0.02em] text-[var(--text-primary,#111111)] m-0">
              {headingLines[0]}
              {headingLines[1] && <><br /><em>{headingLines[1]}</em></>}
            </h2>
          </div>
          <a href="#" onClick={e => e.preventDefault()} className="font-body text-[13px] text-[var(--text-muted,#9E9E9E)] no-underline">
            Lihat Semua Cerita →
          </a>
        </div>

        {/* 3-col grid */}
        <div className="grid grid-cols-3 gap-4">
          {stories.map(s => (
            <a key={s.id} href="#" onClick={e => e.preventDefault()} className="no-underline block relative overflow-hidden rounded-[2px]">
              <div className="aspect-[3/4]">
                <img src={s.image} alt={s.title} className="w-full h-full object-cover block" />
              </div>
              {/* Gradient overlay — always visible at bottom */}
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.75)_0%,transparent_50%)]" />
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 py-6 px-5">
                <p className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--lito-gold,#D4A853)] mb-2">{s.category}</p>
                <h3 className="font-display text-[20px] font-normal text-white leading-[1.2] mb-2">{s.title}</h3>
                <p className="font-body text-[11px] text-[rgba(255,255,255,0.6)]">📍 {s.location} · {s.date}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
