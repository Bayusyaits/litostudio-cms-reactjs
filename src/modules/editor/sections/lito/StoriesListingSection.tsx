/**
 * StoriesListingSection — lito template CMS editor preview.
 *
 * Mirrors lito/components/StoriesPageContent.vue exactly:
 *   • EditorialHero: cream bg (#FAF8F5), py-20, section label (01 · Cerita),
 *     large serif title last line italic, border-bottom
 *   • Rounded-full category filter pills (ink active, transparent inactive)
 *   • 3-col portrait story card grid (cover image, gold category, serif title,
 *     excerpt, location + read-time meta)
 *   • Load More button (rounded-full, border-ink)
 */

import type { Block } from '@/types/editor.types'
import { AppImage }   from '@/components/atoms/AppImage'
import { MapPin }     from 'lucide-react'

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_STORIES = [
  { id: '1', category: 'Mountain', title: 'Ceremony at Dawn', excerpt: 'A ceremony timed to the golden hour — the sun as the third photographer.', cover: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80', location: 'Ubud, Bali', readTime: 5 },
  { id: '2', category: 'Coastal',  title: 'Heritage Collection Campaign', excerpt: 'Three days in Yogyakarta with a team of artisans and a brief that required patience.', cover: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80', location: 'Yogyakarta', readTime: 4 },
  { id: '3', category: 'Urban',    title: 'Natural Light Studio', excerpt: 'Nothing but a single north-facing window and two hours of silence.', cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80', location: 'Jakarta', readTime: 3 },
  { id: '4', category: 'Culture',  title: 'Medina at Blue Hour', excerpt: 'Four days in Marrakech — every alley a new frame, every shadow a story.', cover: 'https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=800&q=80', location: 'Marrakech', readTime: 7 },
  { id: '5', category: 'Island',   title: 'Cliffside Elopement', excerpt: 'Two people, the Italian coastline, and a sunset that needed no direction.', cover: 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=800&q=80', location: 'Cinque Terre', readTime: 5 },
  { id: '6', category: 'Mountain', title: 'Winter Light in Kyoto', excerpt: 'Soft overcast light, maple leaves underfoot, and a camera that refused to sleep.', cover: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80', location: 'Kyoto', readTime: 6 },
]

const MOCK_CATS = ['All', 'Mountain', 'Coastal', 'Urban', 'Culture', 'Island']

// ── Shared sub-components ─────────────────────────────────────────────────────

/** Matches SectionLabel.vue: "(01)   CERITA" — number in parens, no separator line */
function SectionLabel({ number, label }: { number?: string; label: string }) {
  return (
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A9189', margin: 0 }}>
      {number && <span style={{ opacity: 0.5 }}>({number})</span>}
      <span style={{ marginLeft: number ? 12 : 0 }}>{label}</span>
    </p>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StoriesListingSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const number  = String(d.sectionNumber ?? '01')
  const label   = String(d.sectionLabel  ?? 'Cerita')
  const title   = String(d.title ?? d.heading ?? 'Stories')

  return (
    <section style={{ background: '#FAF8F5', color: '#1A1A1A', minHeight: '100vh' }}>

      {/* ── EditorialHero ── */}
      <div style={{ borderBottom: '1px solid #E5E0D8', padding: '80px clamp(24px,5vw,80px)', maxWidth: 1440, margin: '0 auto' }}>
        <SectionLabel number={number} label={label} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,5.5vw,72px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em', color: '#1A1A1A', marginTop: 16, marginBottom: 0, maxWidth: '16ch' }}>
          <em>{title}</em>
        </h1>
      </div>

      {/* ── Filter pills ── */}
      <div style={{ padding: '40px clamp(24px,5vw,80px) 0', maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 48 }}>
          {MOCK_CATS.map((cat, i) => (
            <span key={cat} style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 20px', borderRadius: 9999, border: `1px solid ${i === 0 ? '#1A1A1A' : '#E5E0D8'}`, background: i === 0 ? '#1A1A1A' : 'transparent', color: i === 0 ? '#FAF8F5' : '#888', whiteSpace: 'nowrap' }}>
              {cat}
            </span>
          ))}
        </div>

        {/* ── 3-col story grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem 1.5rem', paddingBottom: 80 }}>
          {MOCK_STORIES.map(story => (
            <div key={story.id}>
              {/* cover — 3:4 portrait */}
              <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#EDE9E3', marginBottom: 14, borderRadius: 2 }}>
                <AppImage src={story.cover} alt={story.title} objectFit="cover" wrapperStyle={{ position: 'absolute', inset: 0 }} style={{ width: '100%', height: '100%' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%)' }} />
                <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={9} color="rgba(255,255,255,0.7)" />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)' }}>{story.location}</span>
                </div>
              </div>
              {/* gold category */}
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#D4A853', marginBottom: 8, marginTop: 0 }}>
                {story.category}
              </p>
              {/* serif title */}
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,1.8vw,22px)', fontWeight: 300, lineHeight: 1.15, letterSpacing: '-0.01em', color: '#1A1A1A', marginBottom: 10, marginTop: 0 }}>
                {story.title}
              </h3>
              {/* excerpt */}
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: '#888', lineHeight: 1.7, marginBottom: 10, marginTop: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {story.excerpt}
              </p>
              {/* meta */}
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#AAA', letterSpacing: '0.04em' }}>
                {story.readTime} menit baca
              </p>
            </div>
          ))}
        </div>

        {/* Load more (showing 6 of 24) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 100 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#AAA' }}>Showing 6 of 24 stories</p>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '12px 44px', borderRadius: 9999, border: '1px solid #1A1A1A', background: 'transparent', color: '#1A1A1A', cursor: 'pointer' }}>
            Load More
          </span>
        </div>
      </div>

    </section>
  )
}
