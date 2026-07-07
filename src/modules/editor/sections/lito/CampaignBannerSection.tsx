import type { Block } from '@/types/editor.types'

export function CampaignBannerSection({ block }: { block: Block }) {
  const d     = block.data as Record<string, unknown>
  const hasBg = !!d.backgroundImage

  return (
    <section style={{ position: 'relative', minHeight: 500, background: hasBg ? undefined : 'var(--lito-ink,#0A0A0A)', backgroundImage: hasBg ? `url(${d.backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.1) 60%)' }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '0 48px 52px', maxWidth: 720 }}>
        <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: 0, marginBottom: 12 }}>
          {String(d.eyebrow ?? 'Featured Work')}
        </p>
        <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 42, fontWeight: 300, letterSpacing: '-0.025em', lineHeight: 1.1, color: '#fff', margin: 0, marginBottom: 24 }}>
          {String(d.title ?? 'A Story Worth Telling')}
        </h2>
        {!!d.description && (
          <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 14, color: 'rgba(255,255,255,0.72)', margin: 0, marginBottom: 24 }}>
            {String(d.description)}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <a style={{ display: 'inline-block', padding: '11px 28px', background: '#fff', color: 'var(--lito-ink,#0A0A0A)', fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {String(d.buttonText ?? 'View Story')}
          </a>
          {!!d.ctaSecondaryText && (
            <a style={{ display: 'inline-block', padding: '11px 28px', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
              {String(d.ctaSecondaryText)}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
