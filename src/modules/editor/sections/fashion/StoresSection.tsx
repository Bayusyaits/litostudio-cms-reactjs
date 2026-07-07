import type { Block } from '@/types/editor.types'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})

const DEFAULT_STORES = [
  { name:'Jakarta Flagship', address:'Jl. Sudirman No. 88, Jakarta Pusat 10220', hours:'Mon–Sat 10:00–21:00, Sun 11:00–20:00', phone:'+62 21 5555 0123' },
  { name:'Yogyakarta Store',  address:'Jl. Malioboro No. 52, Yogyakarta 55271',  hours:'Mon–Sat 10:00–21:00, Sun 11:00–20:00', phone:'+62 274 555 0456' },
  { name:'Bandung Store',     address:'Jl. Braga No. 18, Bandung 40111',         hours:'Mon–Sat 10:00–21:00, Sun 11:00–19:00', phone:'+62 22 555 0789' },
]

export function StoresSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const heading = String(d.title ?? 'Our Stores')
  const stores  = (d.stores as typeof DEFAULT_STORES) ?? DEFAULT_STORES

  return (
    <section style={{ background: 'var(--nx-bg,#fff)', padding: '72px 0' }}>
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 clamp(24px,2.9vw,40px)' }}>
        <h2 style={DISP({ fontSize: 'clamp(28px,3vw,44px)', fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: '0 0 40px' })}>{heading}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {stores.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: 24, padding: '24px 0', borderBottom: '1px solid var(--nx-border,#e8e8e8)', alignItems: 'start' }}>
              <div style={DISP({ fontSize: 16, fontWeight: 700, textTransform: 'uppercase', color: 'var(--nx-text,#111)' })}>{s.name}</div>
              <div style={BODY({ fontSize: 13, lineHeight: 1.6, color: 'var(--nx-text-muted,#555)' })}>{s.address}</div>
              <div style={BODY({ fontSize: 12, color: 'var(--nx-text-muted,#777)', lineHeight: 1.5 })}>{s.hours}</div>
              <div style={BODY({ fontSize: 12, color: 'var(--nx-text-muted,#777)' })}>{s.phone}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
