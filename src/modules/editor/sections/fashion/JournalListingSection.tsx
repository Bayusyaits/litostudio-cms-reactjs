/**
 * JournalListingSection — CMS canvas preview for the journal_listing block.
 *
 * Mirrors Fashion Journal.html exactly:
 *   • page-hero: 70vh, breadcrumb, "(03) — Style & Care Notes" eyebrow, Barlow Condensed h1
 *   • filter-row grid 3fr 1fr: pills (All/Style Guides/Care & Repair/Gear Reviews/Trend Reports) + count right
 *   • ed-grid 3-col landscape (3:2) story-card: category + title + excerpt + meta
 */

import { useState }   from 'react'
import type { Block } from '@/types/editor.types'
import { AppImage }   from '@/components/atoms/AppImage'

const MOCK_POSTS = [
  { id: '1', cat: 'Style Guides',  title: 'How to Build a Techwear Capsule in 8 Pieces',     excerpt: 'The eight versatile staples that mix into a month of outfits — without the clutter.',         cover: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=720&h=480&fit=crop&q=80', date: '13 June 2026', readTime: '6' },
  { id: '2', cat: 'Care & Repair', title: 'Washing Technical Fabrics Without Ruining Them',   excerpt: 'Membranes, coatings, and DWR — a plain-language guide to keeping performance intact.',      cover: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=720&h=480&fit=crop&q=80', date: '10 June 2026', readTime: '5' },
  { id: '3', cat: 'Gear Reviews',  title: 'FIZ-R200G, One Year In: An Honest Review',         excerpt: '365 days of daily wear. What held up, what softened, and what we\'d change.',                cover: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=720&h=480&fit=crop&q=80', date: '7 June 2026',  readTime: '8' },
  { id: '4', cat: 'Trend Reports', title: 'A/W 26 Trend Report: Quiet Hardware',              excerpt: 'Why this season\'s strongest pieces whisper instead of shout — and what to buy.',           cover: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=720&h=480&fit=crop&q=80', date: '4 June 2026',  readTime: '7' },
  { id: '5', cat: 'Style Guides',  title: 'The Art of Layering for Tropical Cities',          excerpt: 'How to look layered without overheating — built for Jakarta\'s climate.',                    cover: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=720&h=480&fit=crop&q=80', date: '1 June 2026',  readTime: '5' },
  { id: '6', cat: 'Care & Repair', title: "Repair, Don't Replace: Our Free Mending Service",  excerpt: "A broken zip isn't the end. How our atelier brings pieces back to life.",                  cover: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=720&h=480&fit=crop&q=80', date: '28 May 2026',  readTime: '4' },
  { id: '7', cat: 'Gear Reviews',  title: 'MX-150 vs Revo-125: Which Jacket Is for You?',    excerpt: 'Two flagships, two philosophies. A side-by-side to settle the question.',                    cover: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=720&h=480&fit=crop&q=80', date: '24 May 2026',  readTime: '9' },
  { id: '8', cat: 'Trend Reports', title: 'The Colour of the Season Is Not a Colour',        excerpt: 'Charcoal, graphite, slate — why the new neutrals are doing all the work.',                   cover: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=720&h=480&fit=crop&q=80', date: '20 May 2026',  readTime: '5' },
  { id: '9', cat: 'Style Guides',  title: 'Five Ways to Style the Astrea Cargo Pant',        excerpt: 'One pant, five complete looks — from morning commute to late-night event.',                   cover: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=720&h=480&fit=crop&q=80', date: '17 May 2026',  readTime: '4' },
]

const FILTERS = ['All', 'Style Guides', 'Care & Repair', 'Gear Reviews', 'Trend Reports']

const DISP = (extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display, 'Barlow Condensed', sans-serif)", ...extra,
})
const BODY = (extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body, 'Barlow', sans-serif)", ...extra,
})

export function JournalListingSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const heroImage   = String(d.heroImage   ?? 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1920&h=900&fit=crop&q=80')
  const eyebrow     = String(d.eyebrow     ?? '(03) — Style & Care Notes')
  const heading     = String(d.title       ?? d.heading ?? 'The\nJournal')
  const description = String(d.description ?? 'Practical guides on styling, caring for, and choosing pieces that last — written by the people who design and wear them.')
  const [h1, h2 = ''] = heading.split('\n')
  const [activeFilter, setFilter] = useState('All')
  const visible = activeFilter === 'All' ? MOCK_POSTS : MOCK_POSTS.filter(p => p.cat === activeFilter)

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
            <span style={BODY({ fontSize: 12, opacity: 0.9 })}>Journal</span>
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
        {/* filter-row */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', alignItems: 'center', gap: 24, marginBottom: 44 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {FILTERS.map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)} style={{
                ...BODY({ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }),
                padding: '7px 16px', borderRadius: 0,
                border: `1px solid ${f === activeFilter ? 'var(--nx-text,#111)' : 'var(--nx-border,#e8e8e8)'}`,
                background: f === activeFilter ? 'var(--nx-text,#111)' : 'transparent',
                color: f === activeFilter ? 'var(--nx-bg,#fff)' : 'var(--nx-text-muted,#777)',
                cursor: 'pointer', whiteSpace: 'nowrap' as const,
              }}>{f}</button>
            ))}
          </div>
          <span style={BODY({ fontSize: 12, color: 'var(--nx-text-muted,#777)', textAlign: 'right' })}>{visible.length} Articles</span>
        </div>

        {/* ed-grid 3-col landscape cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {visible.map(post => (
            <div key={post.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}>
              <div style={{ position: 'relative', aspectRatio: '3/2', overflow: 'hidden', background: '#e8e8e8' }}>
                <AppImage src={post.cover} alt={post.title} objectFit="cover"
                  wrapperStyle={{ position: 'absolute', inset: 0 }}
                  style={{ width: '100%', height: '100%' }} />
              </div>
              <p style={BODY({ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-text-muted,#777)', margin: 0 })}>{post.cat}</p>
              <h3 style={DISP({ fontSize: 'clamp(15px,1.3vw,19px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: 0 })}>{post.title}</h3>
              <p style={BODY({ fontSize: 13, color: 'var(--nx-text-muted,#777)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties)}>{post.excerpt}</p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', ...BODY({ fontSize: 11, color: 'var(--nx-text-muted,#999)' }) }}>
                <span>{post.date}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                <span>{post.readTime} min read</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
