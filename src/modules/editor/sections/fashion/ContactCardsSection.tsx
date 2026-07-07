import type { Block } from '@/types/editor.types'

const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})
const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})

const CARDS = [
  { label:'Head Office',       value:'Jl. Sudirman No. 88',   sub:'Jakarta Pusat, 10220',     icon:'🏠' },
  { label:'Email',             value:'hello@nonoxwear.id',     sub:'Reply within 24 hours',    icon:'✉' },
  { label:'Phone',             value:'+62 21 5555 0123',       sub:'Mon–Sat, 10:00–20:00 WIB', icon:'📞' },
  { label:'WhatsApp',          value:'+62 812 3456 7890',      sub:'Quick response guaranteed',icon:'💬' },
  { label:'Store Hours',       value:'Mon – Sat',              sub:'10:00 – 21:00 WIB',        icon:'🕙' },
  { label:'Customer Support',  value:'support@nonoxwear.id',   sub:'Orders, returns & exchanges',icon:'❓' },
  { label:'Wholesale Inquiry', value:'wholesale@nonoxwear.id', sub:'Minimum order 50 units',   icon:'📦' },
  { label:'Press Inquiry',     value:'press@nonoxwear.id',     sub:'Media kit available on request',icon:'📄' },
]

export function ContactCardsSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const cards = (d.cards as typeof CARDS) ?? CARDS

  return (
    <section style={{ background: 'var(--nx-bg,#fff)', padding: '72px 0' }}>
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 clamp(24px,2.9vw,40px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ border: '1px solid var(--nx-border,#e8e8e8)', padding: '28px 24px' }}>
              <div style={{ fontSize: 20, marginBottom: 14 }}>{c.icon}</div>
              <div style={BODY({ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-text-muted,#777)', marginBottom: 6 })}>{c.label}</div>
              <div style={DISP({ fontSize: 15, fontWeight: 700, textTransform: 'uppercase', color: 'var(--nx-text,#111)', marginBottom: 4 })}>{c.value}</div>
              <div style={BODY({ fontSize: 11, color: 'var(--nx-text-muted,#999)' })}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
