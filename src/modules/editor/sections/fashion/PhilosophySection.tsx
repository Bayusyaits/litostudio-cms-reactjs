import type { Block } from '@/types/editor.types'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})

const ICONS: Record<string, string> = {
  Innovation:     '◇',
  Craftsmanship:  '△',
  Sustainability: '○',
  Community:      '□',
}

const CARDS = [
  { title: 'Innovation',     desc: 'We push the boundaries of what fashion can be — integrating smart textiles, parametric construction, and unconventional materials into every collection.' },
  { title: 'Craftsmanship',  desc: 'Every garment is meticulously constructed with attention to every stitch, seam, and material choice. We source only from ethical, certified workshops.' },
  { title: 'Sustainability', desc: "We're committed to reducing our environmental footprint. From recycled packaging to low-waste cutting techniques — sustainability is built into our process." },
  { title: 'Community',      desc: "Fashion is more than clothing — it's how we connect, express, and belong. We nurture a community of creators, explorers, and risk-takers." },
]

export function PhilosophySection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const eyebrow = String(d.eyebrow ?? 'Our Philosophy')
  const heading = String(d.title ?? d.heading ?? "What Drives\nEverything We Do")
  const cards = (d.cards as typeof CARDS) ?? CARDS
  const [h1, h2 = ''] = heading.split('\n')

  return (
    <section style={{ background: 'var(--nx-bg,#fff)', padding: '96px 0' }}>
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 clamp(24px,2.9vw,40px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={BODY({ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-text-muted,#777)', margin: '0 0 12px' })}>{eyebrow}</p>
          <h2 style={DISP({ fontSize: 'clamp(28px,3vw,44px)', fontWeight: 800, lineHeight: 0.92, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: 0 })}>
            {h1}{h2 && <><br />{h2}</>}
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--nx-border,#e8e8e8)', paddingTop: 24 }}>
              <div style={DISP({ fontSize: 28, marginBottom: 16, color: 'var(--nx-text,#111)' })}>{ICONS[c.title] ?? '◇'}</div>
              <h3 style={DISP({ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', textTransform: 'uppercase', margin: '0 0 12px' })}>{c.title}</h3>
              <p style={BODY({ fontSize: 13, lineHeight: 1.7, color: 'var(--nx-text-muted,#666)', margin: 0 })}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
