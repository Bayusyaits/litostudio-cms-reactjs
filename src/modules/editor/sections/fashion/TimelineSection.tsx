import type { Block } from '@/types/editor.types'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})

const DEFAULT_ITEMS = [
  { year:'2020', title:'Brand Launch',   body:'Founded in Jakarta. First collection sold out in 48 hours from Instagram DM orders alone.', active: true },
  { year:'2021', title:'FIZ-R200 Series',body:'Our signature series launches. 500 units. Waitlist of 2,400. The brand goes viral across Indonesian social media.', active: false },
  { year:'2022', title:'Expansion',      body:'Flagship stores open in Jakarta and Yogyakarta. Online store launches with same-day delivery in Java.', active: false },
  { year:'2023', title:'Collaboration',  body:'International creative collaboration with Tokyo-based studio. Limited Revo-125 series released globally.', active: false },
  { year:'2024', title:'Astrea Legend',  body:'Our most ambitious collection yet. 12 pieces. Each named after a legendary machine. Zero fast fashion.', active: false },
]

export function TimelineSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const label = String(d.label ?? 'Our Journey')
  const items = (d.items as typeof DEFAULT_ITEMS) ?? DEFAULT_ITEMS

  return (
    <section style={{ background: 'var(--nx-surface-alt,var(--nx-bg,#f5f5f4))', padding: '96px 0' }}>
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 clamp(24px,2.9vw,40px)' }}>
        <p style={BODY({ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-text-muted,#777)', margin: '0 0 48px', textAlign: 'center' })}>{label}</p>
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--nx-border,#e8e8e8)' }}>
          {items.map((item, i) => (
            <div key={i} style={{ flex: 1, padding: '32px 24px 0 0', borderRight: i < items.length - 1 ? '1px solid var(--nx-border,#e8e8e8)' : 'none', paddingRight: i < items.length - 1 ? 24 : 0 }}>
              <div style={DISP({ fontSize: 'clamp(32px,2.5vw,48px)', fontWeight: 800, color: item.active ? 'var(--nx-text,#111)' : 'var(--nx-border,#ccc)', margin: '0 0 8px' })}>{item.year}</div>
              <h3 style={DISP({ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 10px', color: 'var(--nx-text,#111)' })}>{item.title}</h3>
              <p style={BODY({ fontSize: 12, lineHeight: 1.65, color: 'var(--nx-text-muted,#666)', margin: 0 })}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
