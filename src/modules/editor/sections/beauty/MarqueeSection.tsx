import type { Block } from '@/types/editor.types'

const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

const DEFAULT_ITEMS = [
  'Cruelty-free', 'Made in Indonesia', 'Dermatologist tested',
  'Refillable', 'Vegan formulas', 'No synthetic fragrance', 'Reef safe',
]

export function MarqueeSection({ block }: { block: Block }) {
  const d     = block.data as Record<string, unknown>
  const items = Array.isArray(d.items) && d.items.length
    ? (d.items as string[])
    : DEFAULT_ITEMS
  const row   = [...items, ...items]

  return (
    <section style={{ borderBlock: '1px solid var(--bx-border,rgba(44,36,32,0.10))', overflow: 'hidden', background: 'var(--bx-surface-2,#EDE9E3)' }}>
      <style>{`
        @keyframes beautyMarquee { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .bx-marquee-row { animation: none !important; } }
      `}</style>
      <div className="bx-marquee-row" style={{ display: 'flex', gap: 0, whiteSpace: 'nowrap', animation: 'beautyMarquee 32s linear infinite', width: 'max-content' }}>
        {row.map((t, i) => (
          <span key={i} style={BODY({ display: 'inline-flex', alignItems: 'center', gap: 40, padding: '16px 0', fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--bx-text-muted,#7A6E68)' })}>
            {t}<span style={{ color: 'var(--bx-accent,#C4956A)', padding: '0 40px' }}>✦</span>
          </span>
        ))}
      </div>
    </section>
  )
}
