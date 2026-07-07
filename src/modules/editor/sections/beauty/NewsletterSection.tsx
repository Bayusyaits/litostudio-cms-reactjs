import type { Block } from '@/types/editor.types'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

export function NewsletterSection({ block }: { block: Block }) {
  const d          = block.data as Record<string, unknown>
  const heading    = String(d.heading     ?? 'Join the Glow Club')
  const desc       = String(d.description ?? 'Skincare tips, exclusive offers, and new launches — straight to your inbox.')
  const placeholder= String(d.placeholder ?? 'your@email.com')
  const buttonText = String(d.buttonText  ?? 'Subscribe')

  return (
    <section style={{ background: 'var(--bx-text,#2C2420)', color: 'var(--bx-bg,#FAF8F5)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(64px,9vw,100px) clamp(24px,3vw,40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h2 style={DISP({ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 400, margin: 0, color: 'var(--bx-bg,#FAF8F5)' })}>
          {heading}
        </h2>
        <p style={BODY({ fontSize: 15, lineHeight: 1.7, color: 'rgba(250,248,245,0.65)', maxWidth: '44ch', margin: '16px 0 0' })}>
          {desc}
        </p>
        <div style={{ display: 'flex', gap: 0, marginTop: 36, maxWidth: 440, width: '100%', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(250,248,245,0.25)' }}>
          <input
            type="email"
            placeholder={placeholder}
            readOnly
            style={BODY({ flex: 1, padding: '14px 20px', background: 'rgba(255,255,255,0.06)', border: 0, color: 'var(--bx-bg,#FAF8F5)', fontSize: 13, outline: 'none' })} />
          <button style={BODY({ padding: '14px 22px', background: 'var(--bx-accent,#C4956A)', border: 0, color: '#fff', fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' })}>
            {buttonText}
          </button>
        </div>
      </div>
    </section>
  )
}
