import { useState } from 'react'
import type { Block } from '@/types/editor.types'
import { AppImage } from '@/components/atoms/AppImage'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})

const FILTERS = ['All', 'Southeast Asia', 'East Asia', 'Europe', 'Middle East']

const DESTINATIONS = [
  { id:'1', region:'Southeast Asia', name:'Jakarta, Indonesia',    desc:'Flagship store and creative hub at Sudirman Central Business District.',    img:'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&h=480&fit=crop&q=80' },
  { id:'2', region:'Southeast Asia', name:'Yogyakarta, Indonesia', desc:'Boutique concept store fusing techwear with local batik craft heritage.',     img:'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=640&h=480&fit=crop&q=80' },
  { id:'3', region:'East Asia',      name:'Tokyo, Japan',          desc:'Collaborative pop-up with Studio TOKY. Curated limited-edition drops.',       img:'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=640&h=480&fit=crop&q=80' },
  { id:'4', region:'Southeast Asia', name:'Singapore',             desc:'Seasonal trunk show at ION Orchard with exclusive regional pieces.',           img:'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=640&h=480&fit=crop&q=80' },
  { id:'5', region:'Europe',         name:'Paris, France',         desc:'Paris Fashion Week showroom — by invitation only.',                            img:'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=640&h=480&fit=crop&q=80' },
  { id:'6', region:'Middle East',    name:'Dubai, UAE',            desc:'Exclusive stockist at Level Shoes, Dubai Mall.',                               img:'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=640&h=480&fit=crop&q=80' },
]

export function DestinationsListingSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const heroImage   = String(d.heroImage ?? 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&h=900&fit=crop&q=80')
  const eyebrow     = String(d.eyebrow ?? '(06) — Global Presence')
  const heading     = String(d.title ?? d.heading ?? 'Where We\nAre')
  const description = String(d.description ?? 'From Jakarta to Tokyo, find NONOX WEAR at flagship stores, concept shops, and exclusive stockists worldwide.')
  const [h1, h2 = ''] = heading.split('\n')
  const [activeFilter, setFilter] = useState('All')

  const visible = activeFilter === 'All'
    ? DESTINATIONS
    : DESTINATIONS.filter(dest => dest.region === activeFilter)

  return (
    <div style={{ background: 'var(--nx-bg,#fff)', color: 'var(--nx-text,#111)' }}>
      {/* page-hero */}
      <section style={{ position: 'relative', height: '70vh', minHeight: 480, overflow: 'hidden' }}>
        <AppImage src={heroImage} alt=""
          objectFit="cover"
          wrapperStyle={{ position: 'absolute', inset: 0 }}
          style={{ width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.72))' }} />
        <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, padding: '0 clamp(24px,2.9vw,40px)', color: '#fff' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span style={BODY({ fontSize: 12, opacity: 0.6 })}>Home</span>
            <span style={BODY({ fontSize: 12, opacity: 0.35 })}>/</span>
            <span style={BODY({ fontSize: 12, opacity: 0.9 })}>Destinations</span>
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
        {/* filter row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 48 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {FILTERS.map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)} style={{
                ...BODY({ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }),
                padding: '7px 16px', borderRadius: 0,
                border: `1px solid ${f === activeFilter ? 'var(--nx-text,#111)' : 'var(--nx-border,#e8e8e8)'}`,
                background: f === activeFilter ? 'var(--nx-text,#111)' : 'transparent',
                color: f === activeFilter ? 'var(--nx-bg,#fff)' : 'var(--nx-text-muted,#777)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{f}</button>
            ))}
          </div>
          <span style={BODY({ fontSize: 12, color: 'var(--nx-text-muted,#777)' })}>{visible.length} Locations</span>
        </div>

        {/* 3-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {visible.map(dest => (
            <div key={dest.id} style={{ cursor: 'pointer' }}>
              <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#e8e8e8', marginBottom: 16 }}>
                <AppImage src={dest.img} alt={dest.name}
                  objectFit="cover"
                  wrapperStyle={{ position: 'absolute', inset: 0 }}
                  style={{ width: '100%', height: '100%' }} />
              </div>
              <p style={BODY({ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-text-muted,#777)', margin: '0 0 6px' })}>{dest.region}</p>
              <h3 style={DISP({ fontSize: 'clamp(16px,1.4vw,20px)', fontWeight: 700, letterSpacing: '-0.01em', textTransform: 'uppercase', margin: '0 0 8px' })}>{dest.name}</h3>
              <p style={BODY({ fontSize: 13, lineHeight: 1.6, color: 'var(--nx-text-muted,#666)', margin: 0 })}>{dest.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
