/**
 * GalleryListingSection — lito template CMS editor preview.
 *
 * Mirrors lito/components/GalleryPageContent.vue exactly:
 *   • EditorialHero: cream-alt bg (#F4F1EA), py-20, section label (02 · Arsip Visual),
 *     large serif title last line italic, border-bottom
 *   • Sticky filter pills bar: cream-alt/95 bg, backdrop-blur, border-bottom
 *   • 4-col masonry grid (variable aspect ratios, hover overlay with category + title + location)
 *   • Load More button (rounded-full, border-ink)
 */

import type { Block } from '@/types/editor.types'
import { AppImage }   from '@/components/atoms/AppImage'
import { MapPin }     from 'lucide-react'

// ── Mock data ─────────────────────────────────────────────────────────────────

interface GalleryItem { id: string; category: string; title: string; location: string; cover: string; aspectRatio: string }

const MOCK_ITEMS: GalleryItem[] = [
  { id: '1', category: 'Mountain', title: 'Ceremony at Dawn',        location: 'Ubud, Bali',   cover: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80', aspectRatio: '3/4' },
  { id: '2', category: 'Coastal',  title: 'Natural Light Studio',    location: 'Jakarta',      cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80', aspectRatio: '4/5' },
  { id: '3', category: 'Urban',    title: 'Heritage Collection',     location: 'Yogyakarta',   cover: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80', aspectRatio: '3/4' },
  { id: '4', category: 'Travel',   title: 'Dawn in the Medina',      location: 'Marrakech',    cover: 'https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=600&q=80', aspectRatio: '2/3' },
  { id: '5', category: 'Island',   title: 'Cliffside Elopement',     location: 'Cinque Terre', cover: 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=600&q=80', aspectRatio: '4/5' },
  { id: '6', category: 'Culture',  title: 'Gear of the Season',      location: 'Studio',       cover: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=80', aspectRatio: '1/1' },
  { id: '7', category: 'Coastal',  title: 'Golden Hour Sessions',    location: 'Seminyak',     cover: 'https://images.unsplash.com/photo-1524638431109-93d95c968f03?w=600&q=80', aspectRatio: '3/4' },
  { id: '8', category: 'Mountain', title: 'Winter Temples',          location: 'Kyoto',        cover: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80', aspectRatio: '4/5' },
]

const MOCK_CATS = ['All', 'Mountain', 'Coastal', 'Urban', 'Culture', 'Island', 'Travel']

// ── Shared sub-components ─────────────────────────────────────────────────────

/** Matches SectionLabel.vue: "(02)   ARSIP VISUAL" — number in parens, no separator line */
function SectionLabel({ number, label }: { number?: string; label: string }) {
  return (
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A9189', margin: 0 }}>
      {number && <span style={{ opacity: 0.5 }}>({number})</span>}
      <span style={{ marginLeft: number ? 12 : 0 }}>{label}</span>
    </p>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GalleryListingSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const number = String(d.sectionNumber ?? '02')
  const label  = String(d.sectionLabel  ?? 'Arsip Visual')
  const title  = String(d.title ?? d.heading ?? 'Gallery')

  // Split into 4 masonry columns
  const cols = [0, 1, 2, 3].map(ci => MOCK_ITEMS.filter((_, i) => i % 4 === ci))

  return (
    <section style={{ background: '#F4F1EA', color: '#1A1A1A', minHeight: '100vh' }}>

      {/* ── EditorialHero ── */}
      <div style={{ borderBottom: '1px solid #E5E0D8', padding: '80px clamp(24px,5vw,80px)', maxWidth: 1440, margin: '0 auto' }}>
        <SectionLabel number={number} label={label} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,5.5vw,72px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em', color: '#1A1A1A', marginTop: 16, marginBottom: 0, maxWidth: '16ch' }}>
          <em>{title}</em>
        </h1>
      </div>

      {/* ── Sticky filter pills bar ── */}
      <div style={{ background: 'rgba(244,241,234,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #E5E0D8', padding: '16px clamp(24px,5vw,80px)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 1440, margin: '0 auto' }}>
          {MOCK_CATS.map((cat, i) => (
            <span key={cat} style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 18px', borderRadius: 9999, border: `1px solid ${i === 0 ? '#1A1A1A' : '#E5E0D8'}`, background: i === 0 ? '#1A1A1A' : 'transparent', color: i === 0 ? '#F4F1EA' : '#888', whiteSpace: 'nowrap' }}>
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* ── 4-col masonry grid ── */}
      <div style={{ padding: '56px clamp(24px,5vw,80px) 0', maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, alignItems: 'start' }}>
          {cols.map((col, ci) => (
            <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {col.map(item => (
                <div key={item.id} style={{ position: 'relative', overflow: 'hidden', aspectRatio: item.aspectRatio, background: '#EDE9E3', borderRadius: 2, cursor: 'pointer' }}>
                  <AppImage src={item.cover} alt={`${item.title} — ${item.location}`} objectFit="cover" wrapperStyle={{ position: 'absolute', inset: 0 }} style={{ width: '100%', height: '100%' }} />
                  {/* hover overlay — semi-visible in editor */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '14px 16px' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#D4A853', marginBottom: 3, marginTop: 0 }}>{item.category}</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,1.4vw,18px)', fontWeight: 300, lineHeight: 1.15, color: '#fff', marginBottom: 4, marginTop: 0 }}>{item.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={9} color="rgba(255,255,255,0.6)" />
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em' }}>{item.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Load More */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '56px 0 100px' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '12px 44px', borderRadius: 9999, border: '1px solid #1A1A1A', background: 'transparent', color: '#1A1A1A', cursor: 'pointer' }}>
            Load More
            <span style={{ opacity: 0.4, marginLeft: 8 }}>(16)</span>
          </span>
        </div>
      </div>

    </section>
  )
}
