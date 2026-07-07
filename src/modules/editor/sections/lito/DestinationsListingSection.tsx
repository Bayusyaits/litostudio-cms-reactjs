/**
 * DestinationsListingSection — lito template CMS editor preview.
 *
 * Mirrors lito/components/DestinationsPageContent.vue exactly:
 *   • EditorialHero: cream bg (#FAF8F5), py-20, section label (03 · Destinasi),
 *     title "Places We Explored" fully italic, border-bottom
 *   • 3-col portrait card grid (3:4, gradient overlay from-black/80)
 *     Bottom overlay: MapPin + region (gold), name (white), storyCount (white/50)
 *     Optional featured badge (top-left, gold bg, ink text, rounded-full)
 *   • Load More: SQUARE border button (not rounded-full)
 */

import type { Block } from '@/types/editor.types'
import { AppImage }   from '@/components/atoms/AppImage'
import { MapPin }     from 'lucide-react'

// ── Mock data ─────────────────────────────────────────────────────────────────

interface DestItem { id: string; name: string; region: string; storyCount: number; cover: string; featured?: boolean }

const MOCK_DESTS: DestItem[] = [
  { id: '1', name: 'Ubud',       region: 'Bali, Indonesia',    storyCount: 12, cover: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80', featured: true },
  { id: '2', name: 'Kyoto',      region: 'Kansai, Japan',      storyCount: 8,  cover: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=700&q=80' },
  { id: '3', name: 'Marrakech',  region: 'Morocco',            storyCount: 6,  cover: 'https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=700&q=80' },
  { id: '4', name: 'Cinque Terre', region: 'Liguria, Italy',   storyCount: 5,  cover: 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=700&q=80' },
  { id: '5', name: 'Yogyakarta', region: 'Java, Indonesia',    storyCount: 9,  cover: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=700&q=80', featured: true },
  { id: '6', name: 'Seminyak',   region: 'Bali, Indonesia',    storyCount: 7,  cover: 'https://images.unsplash.com/photo-1524638431109-93d95c968f03?w=700&q=80' },
]

// ── Shared sub-components ─────────────────────────────────────────────────────

/** Matches SectionLabel.vue: "(03)   DESTINASI" — number in parens, no separator line */
function SectionLabel({ number, label }: { number?: string; label: string }) {
  return (
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A9189', margin: 0 }}>
      {number && <span style={{ opacity: 0.5 }}>({number})</span>}
      <span style={{ marginLeft: number ? 12 : 0 }}>{label}</span>
    </p>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DestinationsListingSection({ block }: { block: Block }) {
  const d        = block.data as Record<string, unknown>
  const number   = String(d.sectionNumber ?? '03')
  const label    = String(d.sectionLabel  ?? 'Destinasi')
  const rawTitle = String(d.title ?? d.heading ?? 'Tempat-Tempat\nYang Kami Jelajahi')
  const subtitle = d.subtitle ? String(d.subtitle) : 'Dari Jakarta hingga Gunungkidul — lokasi-lokasi yang telah kami dokumentasikan melalui lensa Lito Studio.'

  // Split on \n: last line italic, rest normal — matches EditorialHero.vue behaviour
  const titleLines = rawTitle.split('\n')

  return (
    <section style={{ background: '#FAF8F5', color: '#1A1A1A', minHeight: '100vh' }}>

      {/* ── EditorialHero ── */}
      <div style={{ borderBottom: '1px solid #E5E0D8', padding: '80px clamp(24px,5vw,80px) 100px', maxWidth: 1440, margin: '0 auto' }}>
        <SectionLabel number={number} label={label} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,5.5vw,72px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em', color: '#1A1A1A', marginTop: 16, marginBottom: 0, maxWidth: '16ch' }}>
          {titleLines.map((line, i) =>
            i === titleLines.length - 1
              ? <em key={i}>{line}</em>
              : <span key={i}>{line}<br /></span>
          )}
        </h1>
        {subtitle && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.65, color: '#888', marginTop: 20, marginBottom: 0, maxWidth: '52ch' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* ── 3-col destination grid ── */}
      <section style={{ padding: '64px clamp(24px,5vw,80px) 100px', background: '#FAF8F5' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {MOCK_DESTS.map(dest => (
              <div key={dest.id} style={{ position: 'relative', overflow: 'hidden', borderRadius: 2, cursor: 'pointer' }}>
                {/* 3:4 portrait image */}
                <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#EDE9E3' }}>
                  <AppImage src={dest.cover} alt={dest.name} objectFit="cover" wrapperStyle={{ position: 'absolute', inset: 0 }} style={{ width: '100%', height: '100%', transition: 'transform 0.5s ease' }} />
                  {/* gradient overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
                </div>

                {/* bottom text overlay */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 24px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <MapPin size={10} color="#D4A853" />
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4A853', margin: 0 }}>
                      {dest.region}
                    </p>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,2vw,24px)', fontWeight: 300, lineHeight: 1.15, color: '#fff', margin: '0 0 8px 0' }}>
                    {dest.name}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                    {dest.storyCount} stories
                  </p>
                </div>

                {/* featured badge (top-left) */}
                {dest.featured && (
                  <div style={{ position: 'absolute', top: 16, left: 16 }}>
                    <span style={{ display: 'inline-block', padding: '4px 12px', background: '#D4A853', color: '#1A1A1A', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 9999 }}>
                      Featured
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load More — square button */}
          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#AAA', marginBottom: 16 }}>
              Showing 6 of 18 destinations
            </p>
            <span style={{ display: 'inline-block', padding: '12px 40px', border: '1px solid #1A1A1A', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1A1A1A', background: 'transparent', cursor: 'pointer' }}>
              Load More
            </span>
          </div>
        </div>
      </section>

    </section>
  )
}
