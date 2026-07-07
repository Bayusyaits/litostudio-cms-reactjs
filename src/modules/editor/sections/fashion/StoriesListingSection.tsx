/**
 * StoriesListingSection — CMS canvas preview for the stories_listing block.
 *
 * Mirrors Fashion Stories.html exactly:
 *   • page-hero: 70vh dark full-bleed, gradient overlay (top-light → bottom-heavy),
 *     breadcrumb nav, page-eyebrow "(02) — The Journal of NONOX",
 *     page-title (Barlow Condensed 800 clamp 44-84px uppercase), page-desc
 *   • Listing (pg-section): featured story horizontal card (img left 4:3 + text right)
 *   • Filter row: pills (All / Campaign / Behind the Scenes / Styling / Collections / Trends)
 *     + count right-aligned "N Stories"
 *   • ed-grid 3-col: story-card portrait 4:5 (tag overlay + category + title + excerpt + meta)
 */

import { useState }   from 'react'
import type { Block } from '@/types/editor.types'
import { AppImage }   from '@/components/atoms/AppImage'

// ── Mock data ─────────────────────────────────────────────────────────────────

const FEATURED = {
  category: 'Campaign',
  title: 'Inside the FIZ-R200 Campaign: Shooting Streetwear in Motion',
  excerpt: 'Three days, two cities, and a single grey morning of light. Photographer Karin Wijaya takes us behind the lens of our most ambitious campaign yet — and explains why movement, not the garment, was the real subject.',
  cover: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1100&h=820&fit=crop&q=80',
  date: '14 June 2026', readTime: '9',
}

const MOCK_STORIES = [
  { id: '1', cat: 'Behind the Scenes', title: 'The Making of Astrea Legend 500cc',      excerpt: 'Twelve pieces, each named for a legendary machine. A look at the year-long build.',     cover: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=640&h=800&fit=crop&q=80', date: '11 June 2026', readTime: '7' },
  { id: '2', cat: 'Trends',            title: 'Why Techwear Refuses to Die',             excerpt: 'Function became fashion a decade ago. Here is why it has only sharpened since.',         cover: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=640&h=800&fit=crop&q=80', date: '8 June 2026',  readTime: '6' },
  { id: '3', cat: 'Styling',           title: 'Styling the MX-150: Five Ways to Wear One Jacket', excerpt: 'From SCBD to the night market — one silhouette, five complete looks.',          cover: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=640&h=800&fit=crop&q=80', date: '5 June 2026',  readTime: '5' },
  { id: '4', cat: 'Campaign',          title: 'Karin Wijaya on Shooting Neon Streets',   excerpt: 'Our photographer on finding the frame where industrial light meets quiet streets.',     cover: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=640&h=800&fit=crop&q=80', date: '2 June 2026',  readTime: '8' },
  { id: '5', cat: 'Collections',       title: 'Revo-125: A Study in Restraint',          excerpt: 'The limited drop that proved less hardware can say a great deal more.',                 cover: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=640&h=800&fit=crop&q=80', date: '29 May 2026',  readTime: '6' },
  { id: '6', cat: 'Trends',            title: 'The Return of the Utility Vest',          excerpt: 'Pockets are political again. Tracing the vest from workwear to runway.',               cover: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=640&h=800&fit=crop&q=80', date: '24 May 2026',  readTime: '4' },
]

const FILTERS = ['All', 'Campaign', 'Behind the Scenes', 'Styling', 'Collections', 'Trends']

// ── Font helpers ───────────────────────────────────────────────────────────────
const DISP = (extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display, 'Barlow Condensed', sans-serif)", ...extra,
})
const BODY = (extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body, 'Barlow', sans-serif)", ...extra,
})

// ── Component ─────────────────────────────────────────────────────────────────

export function StoriesListingSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>

  const heroImage   = String(d.heroImage   ?? FEATURED.cover)
  const eyebrow     = String(d.eyebrow     ?? '(02) — The Journal of NONOX')
  const heading     = String(d.title       ?? d.heading ?? 'Fashion\nStories')
  const description = String(d.description ?? 'Campaign films, atelier notes, and the stories behind every drop — from the streets of Jakarta to the studios of Tokyo.')

  const [h1, h2 = ''] = heading.split('\n')

  const [activeFilter, setFilter] = useState('All')
  const visible = activeFilter === 'All'
    ? MOCK_STORIES
    : MOCK_STORIES.filter(s => s.cat === activeFilter)

  return (
    <div style={{ background: 'var(--nx-bg, #ffffff)', color: 'var(--nx-text, #111111)' }}>

      {/* ── page-hero ─────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', height: '70vh', minHeight: 480, overflow: 'hidden' }}>
        <AppImage
          src={heroImage} alt=""
          objectFit="cover"
          wrapperStyle={{ position: 'absolute', inset: 0 }}
          style={{ width: '100%', height: '100%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.72))' }} />

        <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, padding: '0 clamp(24px,2.9vw,40px)', color: '#fff' }}>
          {/* breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span style={BODY({ fontSize: 12, opacity: 0.6 })}>Home</span>
            <span style={BODY({ fontSize: 12, opacity: 0.35 })}>/</span>
            <span style={BODY({ fontSize: 12, opacity: 0.9 })}>Stories</span>
          </nav>
          {/* eyebrow */}
          <p style={BODY({ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, margin: '0 0 12px' })}>
            {eyebrow}
          </p>
          {/* page-title */}
          <h1 style={DISP({ fontSize: 'clamp(44px,6vw,84px)', fontWeight: 800, lineHeight: 0.92, letterSpacing: '-0.025em', textTransform: 'uppercase', margin: '0 0 16px' })}>
            {h1}{h2 && <><br />{h2}</>}
          </h1>
          {/* page-desc */}
          <p style={BODY({ fontSize: 15, maxWidth: 540, opacity: 0.75, lineHeight: 1.65, margin: 0 })}>
            {description}
          </p>
        </div>
      </section>

      {/* ── pg-section ────────────────────────────────────────────────────── */}
      <div style={{ padding: '96px clamp(24px,2.9vw,40px)', maxWidth: 1380, margin: '0 auto' }}>

        {/* Featured story — story-card featured-story */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 72 }}>
          {/* image */}
          <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#e8e8e8' }}>
            <AppImage
              src={FEATURED.cover} alt={FEATURED.title}
              objectFit="cover"
              wrapperStyle={{ position: 'absolute', inset: 0 }}
              style={{ width: '100%', height: '100%' }}
            />
            <span style={{ position: 'absolute', top: 14, left: 14, ...BODY({ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '5px 10px' }) }}>
              {FEATURED.category}
            </span>
          </div>
          {/* text */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
            <span style={BODY({ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-text-muted, #777)' })}>
              Featured Story
            </span>
            <h2 style={DISP({ fontSize: 'clamp(20px,2vw,30px)', fontWeight: 700, lineHeight: 1.0, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: 0 })}>
              {FEATURED.title}
            </h2>
            <p style={BODY({ fontSize: 14, color: 'var(--nx-text-muted, #777)', lineHeight: 1.65, margin: 0 })}>
              {FEATURED.excerpt}
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', ...BODY({ fontSize: 12, color: 'var(--nx-text-muted, #777)' }) }}>
              <span>{FEATURED.date}</span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              <span>{FEATURED.readTime} min read</span>
            </div>
          </div>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16, marginBottom: 40 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {FILTERS.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  ...BODY({ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }),
                  padding: '7px 16px',
                  border: `1px solid ${f === activeFilter ? 'var(--nx-text, #111)' : 'var(--nx-border, #e8e8e8)'}`,
                  background: f === activeFilter ? 'var(--nx-text, #111)' : 'transparent',
                  color: f === activeFilter ? 'var(--nx-bg, #fff)' : 'var(--nx-text-muted, #777)',
                  cursor: 'pointer',
                  borderRadius: 0,
                  whiteSpace: 'nowrap' as const,
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <span style={BODY({ fontSize: 12, color: 'var(--nx-text-muted, #777)' })}>
            {visible.length} Stories
          </span>
        </div>

        {/* ed-grid — 3-col story cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {visible.map(story => (
            <div key={story.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}>
              {/* portrait 4:5 image */}
              <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', background: '#e8e8e8' }}>
                <AppImage
                  src={story.cover} alt={story.title}
                  objectFit="cover"
                  wrapperStyle={{ position: 'absolute', inset: 0 }}
                  style={{ width: '100%', height: '100%' }}
                />
                <span style={{ position: 'absolute', top: 12, left: 12, ...BODY({ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 8px' }) }}>
                  {story.cat}
                </span>
              </div>
              {/* story-card-cat */}
              <p style={BODY({ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-text-muted, #777)', margin: 0 })}>
                {story.cat}
              </p>
              {/* story-card-title */}
              <h3 style={DISP({ fontSize: 'clamp(15px,1.3vw,19px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: 0 })}>
                {story.title}
              </h3>
              {/* story-card-excerpt */}
              <p style={BODY({ fontSize: 13, color: 'var(--nx-text-muted, #777)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties)}>
                {story.excerpt}
              </p>
              {/* story-card-meta */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', ...BODY({ fontSize: 11, color: 'var(--nx-text-muted, #999)', marginTop: 'auto' }) }}>
                <span>{story.date}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                <span>{story.readTime} min read</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
