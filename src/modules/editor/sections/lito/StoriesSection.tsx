/**
 * lito/StoriesSection — CMS canvas preview for the lito "Featured Stories" home section.
 *
 * Mirrors templates/lito/components/sections/StoriesSection.vue exactly:
 *   • cream bg (#F7F4EE), py-30
 *   • SectionLabel format: (01)   FEATURED STORIES
 *   • h2: 2-line display heading (line 2 italic)
 *   • "Semua Cerita →" link top-right
 *   • Desktop 5-col grid: col-span-3 main card (full height) + col-span-2 two stacked medium cards
 *   • StoryCard: full-image with gradient overlay, gold category text, white serif title, location meta
 */

import type { Block } from '@/types/editor.types'
import { AppImage }   from '@/components/atoms/AppImage'
import { MapPin }     from 'lucide-react'

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_STORIES = [
  { id: '1', category: 'Wedding',    title: 'Pernikahan di Tepi Danau', location: 'Yogyakarta',  image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80' },
  { id: '2', category: 'Pre-Wedding',title: 'Intimate Pre-Wed Bali',   location: 'Bali',         image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80' },
  { id: '3', category: 'Family',     title: 'Family Portrait Bandung', location: 'Bandung',      image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80' },
]

// ── Shared sub-component ──────────────────────────────────────────────────────

/** Matches SectionLabel.vue: "(01)   LABEL" — number in parens, letter-spacing gap */
function SectionLabel({ number, label }: { number?: string; label: string }) {
  return (
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A9189', margin: 0 }}>
      {number && <span style={{ opacity: 0.5 }}>({number})</span>}
      <span style={{ marginLeft: number ? 12 : 0 }}>{label}</span>
    </p>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LitoStoriesSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const number  = String(d.sectionNumber ?? '01')
  const label   = String(d.sectionLabel  ?? 'Featured Stories')
  const rawHead = String(d.heading ?? d.sectionTitle ?? 'Cerita yang Layak\nDiceritakan Ulang')
  const [line1 = '', line2 = ''] = rawHead.split('\n')

  return (
    <section style={{ padding: '120px 0', background: 'var(--cms-card-bg, #F7F4EE)', color: 'var(--text-primary, #111111)' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 clamp(24px,5.5vw,80px)' }}>

        {/* ── Header row ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 64 }}>
          <div>
            <SectionLabel number={number} label={label} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,4.5vw,56px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary, #111111)', margin: '16px 0 0', maxWidth: '14ch' }}>
              {line1}
              {line2 && <><br /><em>{line2}</em></>}
            </h2>
          </div>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#9A9189', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
            Semua Cerita <span>→</span>
          </span>
        </div>

        {/* ── 5-col asymmetric grid (col-span-3 + col-span-2) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, height: 560 }}>

          {/* Main card — full height left */}
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 2, background: '#E8E3DB' }}>
            <AppImage
              src={MOCK_STORIES[0].image}
              alt={MOCK_STORIES[0].title}
              objectFit="cover"
              wrapperStyle={{ position: 'absolute', inset: 0 }}
              style={{ width: '100%', height: '100%' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 28px 32px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)', margin: '0 0 8px' }}>
                {MOCK_STORIES[0].category}
              </p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: '#fff', lineHeight: 1.15, margin: '0 0 10px' }}>
                {MOCK_STORIES[0].title}
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                <MapPin size={10} /> {MOCK_STORIES[0].location}
              </p>
            </div>
          </div>

          {/* Right column: 2 stacked medium cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {MOCK_STORIES.slice(1, 3).map(story => (
              <div key={story.id} style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 2, background: '#E8E3DB' }}>
                <AppImage
                  src={story.image}
                  alt={story.title}
                  objectFit="cover"
                  wrapperStyle={{ position: 'absolute', inset: 0 }}
                  style={{ width: '100%', height: '100%' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 20px 22px' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)', margin: '0 0 6px' }}>
                    {story.category}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 300, color: '#fff', lineHeight: 1.2, margin: '0 0 6px' }}>
                    {story.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                    <MapPin size={9} /> {story.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
