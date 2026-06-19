/**
 * CategoriesSection — visual replica of website CategoriesSection.vue (story_categories)
 * Horizontal scroll cards or 3-col grid with bg image + category name overlay.
 */

import type { Block } from '@/types/editor.types'

const MOCK_CATS = [
  { id: '1', name: 'Wedding',       count: 48, image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80' },
  { id: '2', name: 'Pre-Wedding',   count: 32, image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80' },
  { id: '3', name: 'Portrait',      count: 27, image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80' },
  { id: '4', name: 'Family',        count: 18, image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&q=80' },
]

export function CategoriesSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const headingLines = ((d.heading as string | undefined) ?? 'Jelajahi\nKategori').split('\n')

  return (
    <section style={{ padding: '96px 0', background: 'var(--cms-surface-2, var(--lito-cream-alt, #E6DED1))' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)' }}>03</span>
          <span style={{ width: 32, height: 1, background: 'var(--lito-gold, #D4A853)', opacity: 0.5 }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #9E9E9E)' }}>Story Categories</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,5vw,60px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary, #111111)', margin: '0 0 48px' }}>
          {headingLines[0]}
          {headingLines[1] && <><br /><em>{headingLines[1]}</em></>}
        </h2>

        {/* 4-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {MOCK_CATS.map(cat => (
            <a key={cat.id} href="#" onClick={e => e.preventDefault()} style={{ textDecoration: 'none', display: 'block', position: 'relative', overflow: 'hidden', borderRadius: 2, aspectRatio: '3/4' }}>
              <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%)' }} />
              <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{cat.count} stories</p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: '#FFFFFF', margin: 0 }}>{cat.name}</h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
