import type { Block } from '@/types/editor.types'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

export function ContactCTASection({ block }: { block: Block }) {
  const d        = block.data as Record<string, unknown>
  const eyebrow  = String(d.eyebrow     ?? 'Talk with our team')
  const title    = String(d.title       ?? 'Need help choosing?')
  const desc     = String(d.desc        ?? "Talk with our skincare team — we'll find the perfect routine for your skin.")
  const ctaText  = String(d.ctaText     ?? 'Send an Email')
  const wa       = String(d.whatsappText ?? 'Chat on WhatsApp')

  return (
    <section style={{ background: 'var(--bx-text,#2C2420)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(64px,9vw,100px) clamp(24px,3vw,40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <span style={BODY({ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent,#C4956A)', marginBottom: 20 })}>
          {eyebrow}
        </span>
        <h2 style={DISP({ fontSize: 'clamp(40px,7vw,88px)', fontWeight: 400, lineHeight: 0.92, margin: 0, color: 'var(--bx-bg,#FAF8F5)', whiteSpace: 'pre-line' })}>
          {title}
        </h2>
        <p style={BODY({ fontSize: 15, lineHeight: 1.7, color: 'rgba(250,248,245,0.6)', maxWidth: '42ch', margin: '20px 0 0' })}>
          {desc}
        </p>
        <div style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button style={BODY({ padding: '13px 28px', background: 'var(--bx-accent,#C4956A)', color: '#fff', border: 0, borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer' })}>
            {ctaText}
          </button>
          {wa && (
            <button style={BODY({ padding: '13px 28px', background: 'transparent', color: 'var(--bx-bg,#FAF8F5)', border: '1px solid rgba(250,248,245,0.3)', borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer' })}>
              {wa}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
