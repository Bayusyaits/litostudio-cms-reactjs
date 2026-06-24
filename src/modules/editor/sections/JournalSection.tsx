/**
 * JournalSection — visual replica of website JournalSection.vue
 * 1 large featured post (left) + 2 small posts (right column).
 * Cream background, gold category labels, Cormorant display headings.
 */

import type { Block } from '@/types/editor.types'
import type { JournalBlockData } from '@/types/editor.types'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

const MOCK_POSTS = [
  {
    id: '1', category: 'Wedding', title: 'Cerita Cinta di Tepi Danau Toba',
    excerpt: 'Sebuah pernikahan yang menyatu dengan keindahan alam Sumatera Utara — langit keemasan, air yang tenang, dan dua hati yang bersatu.',
    cover: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80',
    date: '12 Jan 2025', readTime: '5',
  },
  {
    id: '2', category: 'Portrait', title: 'Menemukan Ketenangan dalam Potret',
    excerpt: 'Sesi portrait di antara sawah menjelang senja.',
    cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80',
    date: '5 Jan 2025', readTime: '3',
  },
  {
    id: '3', category: 'Behind the Lens', title: 'Perlengkapan Favorit 2025',
    excerpt: 'Kamera dan lensa andalan untuk setiap jenis sesi.',
    cover: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80',
    date: '28 Des 2024', readTime: '4',
  },
]

export function JournalSection({ block }: { block: Block }) {
  const d = block.data as JournalBlockData
  const headingLines = (d.heading ?? 'Jurnal &\nCerita Kami').split('\n')
  const posts = MOCK_POSTS.slice(0, Math.max(d.limit ?? 3, 1))

  const featured = posts[0]
  const sidePosts = posts.slice(1, 3)

  return (
    <section style={{ padding: '120px 0', background: 'var(--cms-card-bg, var(--lito-cream, #F7F4EE))' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 80px' }}>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 56 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)' }}>
                {d.sectionNumber ?? '07'}
              </span>
              <span style={{ width: 32, height: 1, background: 'var(--lito-gold, #D4A853)', opacity: 0.5 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #9E9E9E)' }}>
                {d.sectionLabel ?? 'From the Journal'}
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,5vw,60px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary, #111111)', margin: 0 }}>
              {headingLines[0]}
              {headingLines[1] && <><br /><em dangerouslySetInnerHTML={{ __html: sanitizeHtml(headingLines[1]) }} /></>}
            </h2>
          </div>
          <a href="#" onClick={e => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted, #9E9E9E)', textDecoration: 'none' }}>
            Lihat Semua →
          </a>
        </div>

        {/* Grid: 1 large + 2 small */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

          {/* Featured large post */}
          {featured && (
            <a href="#" onClick={e => e.preventDefault()} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ aspectRatio: '16/10', overflow: 'hidden', borderRadius: 2, marginBottom: 20 }}>
                <img src={featured.cover} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)', marginBottom: 8 }}>
                {featured.category}
              </p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text-primary, #111111)', lineHeight: 1.2, marginBottom: 12 }}>
                {featured.title}
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7, color: 'var(--text-muted, #9E9E9E)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {featured.excerpt}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-faint, #9E9E9E)' }}>
                {featured.date} · {featured.readTime} min read
              </p>
            </a>
          )}

          {/* Side: 2 small posts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {sidePosts.map(post => (
              <a key={post.id} href="#" onClick={e => e.preventDefault()} style={{ textDecoration: 'none', display: 'flex', gap: 20 }}>
                <div style={{ width: 112, height: 112, flexShrink: 0, overflow: 'hidden', borderRadius: 2 }}>
                  <img src={post.cover} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, padding: '4px 0' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)', marginBottom: 8 }}>
                    {post.category}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--text-primary, #111111)', lineHeight: 1.25, marginBottom: 8 }}>
                    {post.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-faint, #9E9E9E)' }}>
                    {post.date} · {post.readTime} min read
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
