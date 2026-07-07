/**
 * lito/GallerySection — CMS canvas preview for the lito "Selected Works" home section.
 *
 * Mirrors templates/lito/components/sections/GallerySection.vue exactly:
 *   • cream-alt bg (#E6DED1), py-30
 *   • SectionLabel format: (04)   SELECTED WORKS  (top-left)
 *   • h2: 2-line display heading (line 2 italic)
 *   • CategoryPill-style filter pills top-right
 *   • Masonry-style 3-col grid with variable aspect ratios
 *   • Hover overlay: black/50, gold category, white title, location
 */

import { useState } from 'react'
import type { Block } from '@/types/editor.types'
import { AppImage }   from '@/components/atoms/AppImage'
import { MapPin }     from 'lucide-react'

// ── Mock data ─────────────────────────────────────────────────────────────────

interface GalleryItem { id: string; category: string; title: string; location: string; cover: string; aspect: string }

const MOCK_ITEMS: GalleryItem[] = [
  { id: '1', category: 'Wedding',  title: 'Golden Hour',         location: 'Yogyakarta',  cover: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80', aspect: '3/4' },
  { id: '2', category: 'Portrait', title: 'Senja Pantai',        location: 'Bali',         cover: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80', aspect: '4/5' },
  { id: '3', category: 'Outdoor',  title: 'Forest Walk',         location: 'Bandung',      cover: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&q=80', aspect: '3/4' },
  { id: '4', category: 'Wedding',  title: 'City Lights',         location: 'Jakarta',      cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80', aspect: '4/3' },
  { id: '5', category: 'Portrait', title: 'Rooftop Shoot',       location: 'Jakarta',      cover: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80', aspect: '3/4' },
  { id: '6', category: 'Outdoor',  title: 'Garden Party',        location: 'Solo',         cover: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=80', aspect: '4/5' },
]

const FILTERS = ['All', 'Wedding', 'Portrait', 'Outdoor']

// ── Shared sub-component ──────────────────────────────────────────────────────

/** Matches SectionLabel.vue: "(04)   LABEL" */
function SectionLabel({ number, label }: { number?: string; label: string }) {
  return (
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A9189', margin: 0 }}>
      {number && <span style={{ opacity: 0.5 }}>({number})</span>}
      <span style={{ marginLeft: number ? 12 : 0 }}>{label}</span>
    </p>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LitoGallerySection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const number  = String(d.sectionNumber ?? '04')
  const label   = String(d.sectionLabel  ?? 'Selected Works')
  const rawHead = String(d.heading ?? d.sectionTitle ?? 'Dari Arsip\nTerbaik Kami')
  const [line1 = '', line2 = ''] = rawHead.split('\n')

  const [activeFilter, setFilter] = useState('All')
  const [hoveredId, setHovered]   = useState<string | null>(null)

  const visible = activeFilter === 'All' ? MOCK_ITEMS : MOCK_ITEMS.filter(i => i.category === activeFilter)

  // Split into 3 columns for masonry effect
  const cols = [0, 1, 2].map(ci => visible.filter((_, i) => i % 3 === ci))

  return (
    <section style={{ padding: '120px 0', background: 'var(--cms-surface-2, #E6DED1)', color: 'var(--text-primary, #111111)' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 clamp(24px,5.5vw,80px)' }}>

        {/* ── Header row ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 56, gap: 24, flexWrap: 'wrap' }}>
          <div>
            <SectionLabel number={number} label={label} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,4.5vw,56px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary, #111111)', margin: '16px 0 0' }}>
              {line1}
              {line2 && <><br /><em>{line2}</em></>}
            </h2>
          </div>

          {/* CategoryPill-style filter pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FILTERS.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '7px 20px',
                  borderRadius: 9999,
                  border: `1px solid ${f === activeFilter ? 'var(--text-primary, #111)' : '#D9D2C7'}`,
                  background: f === activeFilter ? 'var(--text-primary, #111)' : 'transparent',
                  color: f === activeFilter ? 'var(--cms-card-bg, #F7F4EE)' : '#9A9189',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap' as const,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Masonry 3-col grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignItems: 'start' }}>
          {cols.map((col, ci) => (
            <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {col.map(item => (
                <div
                  key={item.id}
                  style={{ position: 'relative', aspectRatio: item.aspect, overflow: 'hidden', borderRadius: 2, background: '#D9D2C7', cursor: 'pointer' }}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <AppImage
                    src={item.cover}
                    alt={item.title}
                    objectFit="cover"
                    wrapperStyle={{ position: 'absolute', inset: 0 }}
                    style={{ width: '100%', height: '100%', transition: 'transform 0.5s ease', transform: hoveredId === item.id ? 'scale(1.04)' : 'scale(1)' }}
                  />
                  {/* Hover overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    opacity: hoveredId === item.id ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 16,
                  }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)', margin: '0 0 4px' }}>
                      {item.category}
                    </p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 300, color: '#fff', lineHeight: 1.2, margin: '0 0 6px' }}>
                      {item.title}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                      <MapPin size={9} /> {item.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
