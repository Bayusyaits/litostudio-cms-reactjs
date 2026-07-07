import type { Block } from '@/types/editor.types'

export function ContactCTASection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>

  return (
    <section style={{ background: 'var(--lito-ink,#0A0A0A)', padding: 'clamp(4rem,8vw,7rem) 32px', textAlign: 'center' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {!!d.eyebrow && (
          <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(250,250,249,0.55)', margin: 0, marginBottom: 16 }}>
            {String(d.eyebrow)}
          </p>
        )}
        <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.025em', textTransform: 'uppercase', color: 'var(--lito-cream,#FAFAF9)', margin: 0, marginBottom: 20 }}>
          {String(d.title ?? "Let's Work Together")}
        </h2>
        {!!d.desc && (
          <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 14, color: 'rgba(250,250,249,0.7)', lineHeight: 1.7, margin: 0, marginBottom: 40 }}>
            {String(d.desc)}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!!d.whatsappUrl && (
            <a style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 36px', background: '#25D366', color: '#fff', fontFamily: 'var(--font-body,Inter)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
              {String(d.whatsappText ?? 'Chat on WhatsApp')}
            </a>
          )}
          <a style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 36px', background: 'var(--lito-cream,#FAFAF9)', color: 'var(--lito-ink,#0A0A0A)', fontFamily: 'var(--font-body,Inter)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {String(d.ctaText ?? 'Send an Email')}
          </a>
          {!!d.homeText && (
            <a style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 36px', background: 'transparent', color: 'var(--lito-cream,#FAFAF9)', border: '1px solid rgba(250,250,249,0.4)', fontFamily: 'var(--font-body,Inter)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
              {String(d.homeText)}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
