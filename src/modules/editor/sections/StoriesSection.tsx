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
    <section style={{ padding: '120px 0', background: 'var(--cms-card-bg, var(--lito-cream, #F7F4EE))' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 56 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)' }}>05</span>
              <span style={{ width: 32, height: 1, background: 'var(--lito-gold, #D4A853)', opacity: 0.5 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #9E9E9E)' }}>Featured Stories</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,5vw,60px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary, #111111)', margin: 0 }}>
              {headingLines[0]}
              {headingLines[1] && <><br /><em>{headingLines[1]}</em></>}
            </h2>
          </div>
          <a href="#" onClick={e => e.preventDefault()} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted, #9E9E9E)', textDecoration: 'none' }}>
            Lihat Semua Cerita →
          </a>
        </div>

        {/* 3-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {stories.map(s => (
            <a key={s.id} href="#" onClick={e => e.preventDefault()} style={{ textDecoration: 'none', display: 'block', position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
              <div style={{ aspectRatio: '3/4' }}>
                <img src={s.image} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              {/* Gradient overlay — always visible at bottom */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)' }} />
              {/* Content */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)', marginBottom: 8 }}>{s.category}</p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>📍 {s.location} · {s.date}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
