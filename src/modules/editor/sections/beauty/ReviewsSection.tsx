import type { Block } from '@/types/editor.types'
import { useState } from 'react'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

const REVIEWS = [
  { quote: '"My skin has never felt this hydrated. I\'ve tried everything and nothing compares."', name: 'Sari K.', role: 'Verified buyer' },
  { quote: '"The serum cleared my acne in 2 weeks. I genuinely can\'t live without it now."', name: 'Rina P.', role: 'Verified buyer' },
  { quote: '"Finally a cleanser that doesn\'t strip my barrier. Repurchasing forever."', name: 'Dewi A.', role: 'Verified buyer' },
]

export function ReviewsSection({ block }: { block: Block }) {
  const d       = block.data as Record<string, unknown>
  const eyebrow = String(d.eyebrow ?? '(06) Kind words')
  const heading = String(d.heading ?? 'What people say')
  const rawItems= Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : []
  const reviews = rawItems.length ? rawItems : (REVIEWS as Record<string, unknown>[])
  const [idx, setIdx] = useState(0)
  const go = (dir: number) => setIdx((c) => (c + dir + reviews.length) % reviews.length)
  const cur = reviews[idx]

  return (
    <section style={{ background: 'var(--bx-page-alt,#F3F0EB)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(56px,8vw,110px) clamp(24px,3vw,40px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 44, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={BODY({ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent-text,#8B5E3C)', display: 'flex', gap: 8 })}>
              <span style={{ fontWeight: 600 }}>{eyebrow.match(/\((\d+)\)/)?.[0] ?? '(06)'}</span>
              {eyebrow.replace(/^\(\d+\)\s*/, '')}
            </span>
            <h2 style={DISP({ fontSize: 'clamp(34px,5vw,60px)', fontWeight: 400, margin: '14px 0 0', color: 'var(--bx-text,#2C2420)' })}>
              {heading}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[[-1, '←'], [1, '→']].map(([dir, arrow]) => (
              <button key={String(dir)} onClick={() => go(dir as number)} style={{ width: 44, height: 44, borderRadius: 999, border: '1px solid var(--bx-text,#2C2420)', background: 'transparent', color: 'var(--bx-text,#2C2420)', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 16 }}>
                {arrow}
              </button>
            ))}
          </div>
        </div>
        {/* Quote */}
        <blockquote style={DISP({ fontWeight: 400, fontSize: 'clamp(24px,3.4vw,44px)', lineHeight: 1.22, color: 'var(--bx-text,#2C2420)', margin: 0, maxWidth: '22ch' })}>
          {String(cur.quote ?? '')}
        </blockquote>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 999, background: 'var(--bx-surface-2,#EDE9E3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={BODY({ fontSize: 16, color: 'var(--bx-text-muted,#7A6E68)' })}>
              {String(cur.name ?? 'A')[0]}
            </span>
          </div>
          <div>
            <p style={BODY({ fontSize: 13.5, fontWeight: 600, color: 'var(--bx-text,#2C2420)', margin: 0 })}>{String(cur.name ?? '')}</p>
            <p style={BODY({ fontSize: 12, color: 'var(--bx-text-muted,#7A6E68)', margin: '3px 0 0' })}>{String(cur.role ?? 'Verified buyer')}</p>
          </div>
          <span style={BODY({ marginLeft: 'auto', fontSize: 12.5, color: 'var(--bx-text-muted,#7A6E68)' })}>
            {String(idx + 1).padStart(2, '0')} / {String(reviews.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </section>
  )
}
