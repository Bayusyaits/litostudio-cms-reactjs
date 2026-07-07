/**
 * JournalListingSection — lito template CMS editor preview.
 *
 * Mirrors lito/components/JournalPageContent.vue exactly:
 *   • EditorialHero: cream bg (#FAF8F5), py-20, section label (03 · Jurnal),
 *     large serif title last line italic, border-bottom
 *   • Rounded-full category filter pills + entry count
 *   • 3-col journal card grid (4:3 landscape image, gold category, serif title,
 *     excerpt, date + read-time meta)
 *   • Load More button (rounded-full, border-ink)
 */

import type { Block } from '@/types/editor.types'
import { AppImage }   from '@/components/atoms/AppImage'

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_POSTS = [
  { id: '1', category: 'Mountain', title: 'A Golden Hour Session in Ubud', excerpt: 'Soft light filtering through temple doors — every frame a painting.', cover: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80', date: '12 Jan 2025', readTime: 5 },
  { id: '2', category: 'Coastal',  title: 'Chasing the Blue Hour', excerpt: 'Working with the coast at dusk — patience rewarded with light that lasts seconds.', cover: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80', date: '3 Jan 2025', readTime: 4 },
  { id: '3', category: 'Travel',   title: 'Favourite Gear of the Season', excerpt: 'The cameras, lenses, and little tools that define every session.', cover: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80', date: '28 Des 2024', readTime: 6 },
  { id: '4', category: 'Urban',    title: 'Finding Light in Minimalism', excerpt: 'Studio shoots that breathe — negative space as composition.', cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80', date: '15 Des 2024', readTime: 3 },
  { id: '5', category: 'Island',   title: 'Rainy Day Elopement in Bali', excerpt: 'Sometimes rain is the most romantic light.', cover: 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=800&q=80', date: '2 Des 2024', readTime: 5 },
  { id: '6', category: 'Culture',  title: 'Temples and Time', excerpt: 'Four days in Yogyakarta searching for the perfect blue hour.', cover: 'https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=800&q=80', date: '18 Nov 2024', readTime: 7 },
]

const MOCK_CATS = ['All', 'Mountain', 'Coastal', 'Urban', 'Culture', 'Island', 'Travel']

// ── Shared sub-components ─────────────────────────────────────────────────────

/** Matches SectionLabel.vue: "(03)   JURNAL" — number in parens, no separator line */
function SectionLabel({ number, label }: { number?: string; label: string }) {
  return (
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A9189', margin: 0 }}>
      {number && <span style={{ opacity: 0.5 }}>({number})</span>}
      <span style={{ marginLeft: number ? 12 : 0 }}>{label}</span>
    </p>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JournalListingSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const number = String(d.sectionNumber ?? '03')
  const label  = String(d.sectionLabel  ?? 'Jurnal')
  const title  = String(d.title ?? d.heading ?? 'Journal')

  return (
    <section style={{ background: '#FAF8F5', color: '#1A1A1A', minHeight: '100vh' }}>

      {/* ── EditorialHero ── */}
      <div style={{ borderBottom: '1px solid #E5E0D8', padding: '80px clamp(24px,5vw,80px)', maxWidth: 1440, margin: '0 auto' }}>
        <SectionLabel number={number} label={label} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,5.5vw,72px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em', color: '#1A1A1A', marginTop: 16, marginBottom: 0, maxWidth: '16ch' }}>
          <em>{title}</em>
        </h1>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ padding: '40px clamp(24px,5vw,80px) 0', maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MOCK_CATS.map((cat, i) => (
              <span key={cat} style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 20px', borderRadius: 9999, border: `1px solid ${i === 0 ? '#1A1A1A' : '#E5E0D8'}`, background: i === 0 ? '#1A1A1A' : 'transparent', color: i === 0 ? '#FAF8F5' : '#888', whiteSpace: 'nowrap' }}>
                {cat}
              </span>
            ))}
          </div>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, letterSpacing: '0.06em', color: '#AAA', whiteSpace: 'nowrap' }}>
            Showing 6 of 24
          </span>
        </div>

        {/* ── 3-col journal grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3rem 1.5rem', paddingBottom: 80 }}>
          {MOCK_POSTS.map(post => (
            <div key={post.id}>
              {/* image — 4:3 landscape */}
              <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#EDE9E3', marginBottom: 16, borderRadius: 2 }}>
                <AppImage src={post.cover} alt={post.title} objectFit="cover" wrapperStyle={{ position: 'absolute', inset: 0 }} style={{ width: '100%', height: '100%' }} />
              </div>
              {/* gold category */}
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#D4A853', marginBottom: 8, marginTop: 0 }}>
                {post.category}
              </p>
              {/* serif title */}
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,1.8vw,22px)', fontWeight: 300, lineHeight: 1.15, letterSpacing: '-0.01em', color: '#1A1A1A', marginBottom: 10, marginTop: 0 }}>
                {post.title}
              </h3>
              {/* excerpt */}
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: '#888', lineHeight: 1.7, marginBottom: 14, marginTop: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {post.excerpt}
              </p>
              {/* meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#AAA', letterSpacing: '0.04em' }}>{post.date}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#CCC', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#AAA', letterSpacing: '0.04em' }}>{post.readTime} menit baca</span>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 100 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '12px 44px', borderRadius: 9999, border: '1px solid #1A1A1A', background: 'transparent', color: '#1A1A1A', cursor: 'pointer' }}>
            Load More
          </span>
        </div>
      </div>

    </section>
  )
}
