/**
 * GalleryListingSection — CMS canvas preview for the gallery_listing block.
 *
 * Mirrors Fashion Gallery.html exactly:
 *   • page-hero: 70vh, breadcrumb, eyebrow, Barlow Condensed h1 "The\nGallery"
 *   • ed-intro: eyebrow + h2 + desc (Browse the Archive)
 *   • gal-toolbar: filter pills (All/Campaigns/Lookbooks/Editorial/Runway/Behind the Scenes/Product) + count
 *   • gal-masonry: 3-col variable-height cards
 *     Each gal-card: image + scrim overlay + gal-cat badge + gal-count (camera icon + N) +
 *     gal-body (season + title + meta) + gal-open arrow
 */

import { useState }   from 'react'
import type { Block } from '@/types/editor.types'
import { AppImage }   from '@/components/atoms/AppImage'

interface GalCard { id: string; cat: string; title: string; season: string; meta: string; cover: string; aspect: string; count: number }

const MOCK_GALLERIES: GalCard[] = [
  { id: '1',  cat: 'Campaign',         title: 'FIZ-R200 · Neon Streets',    season: 'Fall / Winter 2026', meta: 'Jakarta · 14 Jun 2026',    cover: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=680&h=900&fit=crop&q=80',  aspect: '3/4',  count: 24 },
  { id: '2',  cat: 'Lookbook',         title: 'Astrea Legend 500cc',         season: 'Fall / Winter 2026', meta: 'Yogyakarta · 11 Jun 2026', cover: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=680&h=760&fit=crop&q=80',  aspect: '9/10', count: 18 },
  { id: '3',  cat: 'Editorial',        title: 'Techwear Manifesto',          season: 'Editorial Series',   meta: 'Tokyo · 5 Jun 2026',      cover: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=680&h=820&fit=crop&q=80',  aspect: '4/5',  count: 12 },
  { id: '4',  cat: 'Runway',           title: 'SS27 Presentation',           season: 'Spring / Summer 2027',meta: 'Jakarta · 1 Jun 2026',    cover: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=680&h=1020&fit=crop&q=80', aspect: '2/3',  count: 31 },
  { id: '5',  cat: 'Behind the Scenes',title: 'Making of Astrea Legend',     season: 'BTS Series',         meta: 'Studio · 28 May 2026',    cover: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=680&h=750&fit=crop&q=80',  aspect: '9/10', count: 15 },
  { id: '6',  cat: 'Product',          title: 'MX-150 Detail Shots',         season: 'Product Campaign',   meta: 'Studio · 22 May 2026',    cover: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=680&h=850&fit=crop&q=80',  aspect: '4/5',  count: 9  },
  { id: '7',  cat: 'Campaign',         title: 'Revo-125 · Street Series',    season: 'Spring / Summer 2026',meta: 'Bandung · 18 May 2026',   cover: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=680&h=900&fit=crop&q=80',  aspect: '3/4',  count: 20 },
  { id: '8',  cat: 'Editorial',        title: 'Quiet Hardware Editorial',     season: 'Editorial Series',   meta: 'Jakarta · 12 May 2026',   cover: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=680&h=800&fit=crop&q=80',  aspect: '4/5',  count: 14 },
  { id: '9',  cat: 'Lookbook',         title: 'Utility Collection 2026',      season: 'Fall / Winter 2026', meta: 'Solo · 6 May 2026',       cover: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=680&h=1000&fit=crop&q=80', aspect: '2/3',  count: 22 },
]

const FILTERS = ['All', 'Campaigns', 'Lookbooks', 'Editorial', 'Runway', 'Behind the Scenes', 'Product']

const FILTER_MAP: Record<string, string> = {
  'Campaigns': 'Campaign', 'Lookbooks': 'Lookbook', 'Editorial': 'Editorial',
  'Runway': 'Runway', 'Behind the Scenes': 'Behind the Scenes', 'Product': 'Product',
}

const DISP = (extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display, 'Barlow Condensed', sans-serif)", ...extra,
})
const BODY = (extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body, 'Barlow', sans-serif)", ...extra,
})

function CameraIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

export function GalleryListingSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const heroImage   = String(d.heroImage   ?? 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&h=900&fit=crop&q=80')
  const eyebrow     = String(d.eyebrow     ?? '(05) — Campaign Archive')
  const heading     = String(d.title       ?? d.heading ?? 'The\nGallery')
  const description = String(d.description ?? 'Fifteen collections. One relentless point of view.')
  const [h1, h2 = ''] = heading.split('\n')
  const [activeFilter, setFilter] = useState('All')

  const visible = activeFilter === 'All'
    ? MOCK_GALLERIES
    : MOCK_GALLERIES.filter(g => g.cat === FILTER_MAP[activeFilter])

  // Split into 3 masonry columns
  const cols = [0, 1, 2].map(ci => visible.filter((_, i) => i % 3 === ci))

  return (
    <div style={{ background: 'var(--nx-bg, #ffffff)', color: 'var(--nx-text, #111111)' }}>
      {/* page-hero */}
      <section style={{ position: 'relative', height: '70vh', minHeight: 480, overflow: 'hidden' }}>
        <AppImage src={heroImage} alt="" objectFit="cover"
          wrapperStyle={{ position: 'absolute', inset: 0 }}
          style={{ width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.72))' }} />
        <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, padding: '0 clamp(24px,2.9vw,40px)', color: '#fff' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span style={BODY({ fontSize: 12, opacity: 0.6 })}>Home</span>
            <span style={BODY({ fontSize: 12, opacity: 0.35 })}>/</span>
            <span style={BODY({ fontSize: 12, opacity: 0.9 })}>Gallery</span>
          </nav>
          <p style={BODY({ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, margin: '0 0 12px' })}>{eyebrow}</p>
          <h1 style={DISP({ fontSize: 'clamp(44px,6vw,84px)', fontWeight: 800, lineHeight: 0.92, letterSpacing: '-0.025em', textTransform: 'uppercase', margin: '0 0 16px' })}>
            {h1}{h2 && <><br />{h2}</>}
          </h1>
          <p style={BODY({ fontSize: 15, maxWidth: 540, opacity: 0.75, lineHeight: 1.65, margin: 0 })}>{description}</p>
        </div>
      </section>

      {/* pg-section */}
      <div style={{ padding: '96px clamp(24px,2.9vw,40px)', maxWidth: 1380, margin: '0 auto' }}>
        {/* ed-intro */}
        <div style={{ marginBottom: 48 }}>
          <p style={BODY({ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-text-muted,#777)', margin: '0 0 10px' })}>Browse the Archive</p>
          <h2 style={DISP({ fontSize: 'clamp(28px,2.5vw,40px)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: '0 0 14px' })}>
            Fifteen collections.<br />One relentless point of view.
          </h2>
          <p style={BODY({ fontSize: 14, color: 'var(--nx-text-muted,#777)', maxWidth: 520, lineHeight: 1.65, margin: 0 })}>
            Filter by the kind of work you want to see, or open any gallery to view the full set of frames.
          </p>
        </div>

        {/* gal-toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16, marginBottom: 40 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {FILTERS.map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)} style={{
                ...BODY({ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }),
                padding: '7px 14px', borderRadius: 0,
                border: `1px solid ${f === activeFilter ? 'var(--nx-text,#111)' : 'var(--nx-border,#e8e8e8)'}`,
                background: f === activeFilter ? 'var(--nx-text,#111)' : 'transparent',
                color: f === activeFilter ? 'var(--nx-bg,#fff)' : 'var(--nx-text-muted,#777)',
                cursor: 'pointer', whiteSpace: 'nowrap' as const,
              }}>{f}</button>
            ))}
          </div>
          <span style={BODY({ fontSize: 12, color: 'var(--nx-text-muted,#777)' })}>{visible.length} Galleries</span>
        </div>

        {/* gal-masonry 3-col */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignItems: 'start' }}>
          {cols.map((col, ci) => (
            <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {col.map(item => (
                <div key={item.id} style={{ position: 'relative', aspectRatio: item.aspect, overflow: 'hidden', background: '#e8e8e8', cursor: 'pointer' }}>
                  <AppImage src={item.cover} alt={item.title} objectFit="cover"
                    wrapperStyle={{ position: 'absolute', inset: 0 }}
                    style={{ width: '100%', height: '100%' }} />
                  {/* gal-scrim */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)' }} />
                  {/* gal-cat badge */}
                  <span style={{ position: 'absolute', top: 12, left: 12, ...BODY({ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 8px' }) }}>
                    {item.cat}
                  </span>
                  {/* gal-count */}
                  <span style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4, ...BODY({ fontSize: 10, color: 'rgba(255,255,255,0.85)' }) }}>
                    <CameraIcon />{item.count}
                  </span>
                  {/* gal-body */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 14px 14px' }}>
                    <p style={BODY({ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: '0 0 4px' })}>
                      {item.season}
                    </p>
                    <h3 style={DISP({ fontSize: 'clamp(13px,1.1vw,16px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.01em', textTransform: 'uppercase', color: '#fff', margin: '0 0 4px' })}>
                      {item.title}
                    </h3>
                    <p style={BODY({ fontSize: 10, color: 'rgba(255,255,255,0.55)', margin: 0 })}>{item.meta}</p>
                  </div>
                  {/* gal-open arrow */}
                  <span style={{ position: 'absolute', bottom: 14, right: 14, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>↗</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
