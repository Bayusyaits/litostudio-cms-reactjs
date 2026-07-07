import type { Block } from '@/types/editor.types'

export function NewsletterSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>

  return (
    <section style={{ background: 'var(--lito-ink,#0A0A0A)', padding: 'clamp(56px,8vw,100px) 32px', textAlign: 'center' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {!!d.heading && (
          <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: '-0.025em', textTransform: 'uppercase', color: 'var(--lito-cream,#FAFAF9)', margin: 0, marginBottom: 12 }}>
            {String(d.heading)}
          </h2>
        )}
        {!!d.description && (
          <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 14, color: 'rgba(250,250,249,0.65)', lineHeight: 1.7, margin: 0, marginBottom: 32 }}>
            {String(d.description)}
          </p>
        )}
        <div style={{ display: 'flex', gap: 0, maxWidth: 440, margin: '0 auto' }}>
          <input
            type="email"
            disabled
            placeholder={String(d.placeholder ?? 'Your email address')}
            style={{ flex: 1, padding: '14px 18px', border: '1px solid rgba(255,255,255,0.2)', borderRight: 'none', background: 'rgba(255,255,255,0.06)', fontFamily: 'var(--font-body,Inter)', fontSize: 13, color: '#fff', outline: 'none' }}
          />
          <button
            disabled
            style={{ padding: '14px 24px', background: 'var(--lito-cream,#FAFAF9)', color: 'var(--lito-ink,#0A0A0A)', fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', cursor: 'default', whiteSpace: 'nowrap' }}
          >
            {String(d.buttonText ?? 'Subscribe')}
          </button>
        </div>
      </div>
    </section>
  )
}
