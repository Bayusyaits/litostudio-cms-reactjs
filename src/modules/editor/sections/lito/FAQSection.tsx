import type { Block } from '@/types/editor.types'
import { useState } from 'react'

const DEFAULTS = [
  { question: 'What types of photography do you offer?', answer: 'We specialise in travel documentary, portrait, commercial, and editorial photography across Indonesia and Southeast Asia.' },
  { question: 'How do I book a session?', answer: 'Use the contact form on our website or reach out via WhatsApp. We will respond within 24 hours to discuss your project.' },
  { question: 'Do you travel internationally?', answer: 'Yes — we have worked in over 48 destinations globally. Travel costs are quoted separately based on location.' },
]

export function FAQSection({ block }: { block: Block }) {
  const d        = block.data as Record<string, unknown>
  const rawItems = Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : []
  const items    = rawItems.length ? rawItems : (DEFAULTS as Record<string, unknown>[])
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section style={{ background: 'var(--lito-cream,#FAFAF9)', padding: 'clamp(56px,8vw,100px) 32px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        {!!d.heading && (
          <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: '-0.025em', textTransform: 'uppercase', color: 'var(--lito-ink,#0A0A0A)', margin: 0, marginBottom: 48 }}>
            {String(d.heading)}
          </h2>
        )}
        <div>
          {items.map((item, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--lito-border,rgba(0,0,0,.1))' }}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}
              >
                <span style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 15, fontWeight: 500, color: 'var(--lito-ink,#0A0A0A)', lineHeight: 1.4 }}>
                  {String(item.question ?? '')}
                </span>
                <span style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 22, color: 'var(--lito-ink,#0A0A0A)', flexShrink: 0, lineHeight: 1 }}>
                  {open === i ? '−' : '+'}
                </span>
              </button>
              {open === i && (
                <div style={{ paddingBottom: 24 }}>
                  <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 14, lineHeight: 1.7, color: '#555', margin: 0 }}>
                    {String(item.answer ?? '')}
                  </p>
                </div>
              )}
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--lito-border,rgba(0,0,0,.1))' }} />
        </div>
      </div>
    </section>
  )
}
