import type { Block } from '@/types/editor.types'
import { useState } from 'react'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

const DEFAULTS = [
  { question: 'What skin types are your products suitable for?', answer: 'All of our formulas are designed for sensitive skin and are suitable for all skin types, including oily, dry, and combination.' },
  { question: 'Are your products fragrance-free?',               answer: 'Yes. We never add synthetic fragrance to any formula. Some products carry a faint natural scent from botanical ingredients.' },
  { question: 'How long does shipping take?',                    answer: 'Domestic (Java): 1–3 days. Outside Java: 3–7 days. Free shipping on orders IDR 500.000+.' },
  { question: 'What is your return policy?',                     answer: 'We accept returns within 30 days of delivery for unopened items with original packaging.' },
]

export function FaqSection({ block }: { block: Block }) {
  const d       = block.data as Record<string, unknown>
  const heading = String(d.heading ?? 'Frequently asked questions')
  const rawItems= Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : []
  const faqs    = rawItems.length ? rawItems : (DEFAULTS as Record<string, unknown>[])
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section style={{ background: 'var(--bx-bg,#FAF8F5)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(56px,8vw,100px) clamp(24px,3vw,40px)' }}>
        <h2 style={DISP({ fontSize: 'clamp(34px,5vw,60px)', fontWeight: 400, margin: '0 0 52px', color: 'var(--bx-text,#2C2420)' })}>
          {heading}
        </h2>
        <div style={{ maxWidth: 760 }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--bx-border,rgba(44,36,32,0.12))' }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left', gap: 16 }}>
                <span style={BODY({ fontSize: 15, fontWeight: 500, color: 'var(--bx-text,#2C2420)' })}>
                  {String(f.question ?? '')}
                </span>
                <span style={{ fontSize: 20, color: 'var(--bx-text-muted,#7A6E68)', flexShrink: 0, lineHeight: 1 }}>
                  {open === i ? '−' : '+'}
                </span>
              </button>
              {open === i && (
                <p style={BODY({ fontSize: 14, lineHeight: 1.75, color: 'var(--bx-text-muted,#7A6E68)', margin: '0 0 20px' })}>
                  {String(f.answer ?? '')}
                </p>
              )}
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--bx-border,rgba(44,36,32,0.12))' }} />
        </div>
      </div>
    </section>
  )
}
