/**
 * GallerySection — visual replica of website GallerySection.vue (selected_works)
 * Masonry-like grid with hover overlay showing category, title, location.
 * cream-alt background, filter pills header.
 */

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import type { Block } from '@/types/editor.types'
import type { GalleryBlockData } from '@/types/editor.types'

const MOCK_ITEMS = [
  { id: '1', title: 'Golden Hour',   category: 'Wedding',   location: 'Yogyakarta', image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80', aspect: '3/4' },
  { id: '2', title: 'Senja Pantai',  category: 'Pre-Wed',   location: 'Bali',        image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80', aspect: '4/3' },
  { id: '3', title: 'City Lights',   category: 'Portrait',  location: 'Jakarta',     image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80', aspect: '3/4' },
  { id: '4', title: 'Forest Walk',   category: 'Outdoor',   location: 'Bandung',     image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&q=80', aspect: '4/3' },
  { id: '5', title: 'Rooftop Shoot', category: 'Commercial',location: 'Jakarta',     image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80', aspect: '3/4' },
  { id: '6', title: 'Garden Party',  category: 'Wedding',   location: 'Solo',        image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=80', aspect: '4/3' },
]

const FILTERS = ['All', 'Wedding', 'Portrait', 'Pre-Wed', 'Commercial', 'Outdoor']

export function GallerySection({ block }: { block: Block }) {
  const d = block.data as GalleryBlockData
  const [activeFilter, setFilter] = useState('All')
  const [hoveredId, setHovered] = useState<string | null>(null)

  const items = d.images?.length
    ? d.images.map((img, i) => ({ id: String(i), title: img.caption ?? `Photo ${i+1}`, category: 'Gallery', location: '', image: img.src, aspect: '4/3' }))
    : MOCK_ITEMS

  const visible = activeFilter === 'All' ? items : items.filter(it => it.category === activeFilter)
  const headingLines = 'Dari Arsip\nTerbaik Kami'.split('\n')

  return (
    <section style={{ padding: '120px 0', background: 'var(--cms-surface-2, var(--lito-cream-alt, #E6DED1))' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 80px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 56, gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)' }}>04</span>
              <span style={{ width: 32, height: 1, background: 'var(--lito-gold, #D4A853)', opacity: 0.5 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #9E9E9E)' }}>Selected Works</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,5vw,60px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary, #111111)', margin: 0 }}>
              {headingLines[0]}<br /><em>{headingLines[1]}</em>
            </h2>
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FILTERS.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: `1px solid ${activeFilter === f ? 'var(--lito-ink, #111)' : 'var(--lito-border, #D9D2C7)'}`,
                  background: activeFilter === f ? 'var(--lito-ink, #111)' : 'transparent',
                  color: activeFilter === f ? 'var(--cms-card-bg, #F7F4EE)' : 'var(--text-muted, #9E9E9E)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Masonry grid — 3 cols */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {visible.map(item => (
            <div
              key={item.id}
              style={{ position: 'relative', overflow: 'hidden', borderRadius: 2, cursor: 'pointer' }}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <img
                src={item.image}
                alt={item.title}
                style={{ width: '100%', aspectRatio: item.aspect, objectFit: 'cover', display: 'block', transition: 'transform 0.5s', transform: hoveredId === item.id ? 'scale(1.04)' : 'scale(1)' }}
              />
              {/* Hover overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.5)',
                opacity: hoveredId === item.id ? 1 : 0,
                transition: 'opacity 0.3s',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                padding: 16,
              }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)', marginBottom: 4 }}>{item.category}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#FFFFFF', margin: 0 }}>{item.title}</p>
                {item.location && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={11} /> {item.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
