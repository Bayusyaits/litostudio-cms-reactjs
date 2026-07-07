import type { Block } from '@/types/editor.types'

const PLATFORMS: Array<{ name: string; handle: string; icon: JSX.Element }> = [
  { name: 'Instagram', handle: '@lito', icon: <svg key="ig" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
  { name: 'TikTok', handle: '@lito', icon: <svg key="tt" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg> },
  { name: 'Facebook', handle: 'Lito Studio', icon: <svg key="fb" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg> },
  { name: 'YouTube', handle: 'Lito TV', icon: <svg key="yt" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg> },
  { name: 'Pinterest', handle: '@lito', icon: <svg key="pi" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
]

export function SocialGridSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>

  return (
    <section style={{ background: 'var(--lito-cream,#FAFAF9)', padding: 'clamp(56px,8vw,100px) 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {!!d.eyebrow && (
            <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brand,#E84500)', margin: 0, marginBottom: 12 }}>
              {String(d.eyebrow)}
            </p>
          )}
          <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink,#0A0A0A)', margin: 0 }}>
            {String(d.title ?? 'Follow Our Journey')}
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }}>
          {PLATFORMS.map((p, i) => (
            <div key={i} style={{ background: '#F5F5F4', border: '1px solid var(--lito-border,rgba(0,0,0,.1))', borderRadius: 6, padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ color: 'var(--lito-ink,#0A0A0A)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                {p.icon}
              </div>
              <div style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 13, fontWeight: 600, color: 'var(--lito-ink,#0A0A0A)', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 12, color: '#666' }}>{p.handle}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
