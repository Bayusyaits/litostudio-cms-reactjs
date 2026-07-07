/**
 * lito/JournalSection — CMS canvas preview for the lito "From the Journal" home section.
 *
 * Mirrors templates/lito/components/sections/JournalSection.vue exactly:
 *   • cream bg (#F7F4EE), py-30
 *   • SectionLabel format: (07)   JOURNAL
 *   • h2: 2-line display heading (line 2 italic)
 *   • "Read More →" link top-right
 *   • 3-col equal grid: 4:3 landscape image + gold category label + serif title + readTime
 *   NOTE: NOT the 1-large+2-side layout the general JournalSection uses.
 */

import type { Block } from '@/types/editor.types'
import { AppImage }   from '@/components/atoms/AppImage'

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_POSTS = [
  { id: '1', category: 'Wedding',          title: 'Cerita Cinta di Tepi Danau Toba', cover: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=700&q=80', readTime: 5 },
  { id: '2', category: 'Portrait',         title: 'Menemukan Ketenangan dalam Potret', cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=700&q=80', readTime: 3 },
  { id: '3', category: 'Behind the Lens',  title: 'Perlengkapan Favorit 2025',        cover: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=700&q=80', readTime: 4 },
]

// ── Shared sub-component ──────────────────────────────────────────────────────

/** Matches SectionLabel.vue: "(07)   LABEL" */
function SectionLabel({ number, label }: { number?: string; label: string }) {
  return (
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A9189', margin: 0 }}>
      {number && <span style={{ opacity: 0.5 }}>({number})</span>}
      <span style={{ marginLeft: number ? 12 : 0 }}>{label}</span>
    </p>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LitoJournalSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const number  = String(d.sectionNumber ?? '07')
  const label   = String(d.sectionLabel  ?? 'Journal')
  const rawHead = String(d.heading ?? d.sectionTitle ?? 'Dari\nJurnal Kami')
  const [line1 = '', line2 = ''] = rawHead.split('\n')

  return (
    <section style={{ padding: '120px 0', background: 'var(--cms-card-bg, #F7F4EE)', color: 'var(--text-primary, #111111)' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 clamp(24px,5.5vw,80px)' }}>

        {/* ── Header row ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 56 }}>
          <div>
            <SectionLabel number={number} label={label} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,4.5vw,56px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary, #111111)', margin: '16px 0 0' }}>
              {line1}
              {line2 && <><br /><em>{line2}</em></>}
            </h2>
          </div>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#9A9189', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
            Read More <span>→</span>
          </span>
        </div>

        {/* ── 3-col equal grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {MOCK_POSTS.map(post => (
            <div key={post.id} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* 4:3 landscape image */}
              <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', borderRadius: 2, background: '#E8E3DB', marginBottom: 20 }}>
                <AppImage
                  src={post.cover}
                  alt={post.title}
                  objectFit="cover"
                  wrapperStyle={{ position: 'absolute', inset: 0 }}
                  style={{ width: '100%', height: '100%', transition: 'transform 0.35s ease' }}
                />
              </div>
              {/* Gold category */}
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)', margin: '0 0 8px' }}>
                {post.category}
              </p>
              {/* Serif title */}
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,1.6vw,22px)', fontWeight: 400, lineHeight: 1.25, letterSpacing: '-0.01em', color: 'var(--text-primary, #111111)', margin: '0 0 12px' }}>
                {post.title}
              </h3>
              {/* Read time */}
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#AAA', margin: 0 }}>
                {post.readTime} min read
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
