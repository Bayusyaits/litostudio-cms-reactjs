import type { Block } from '@/types/editor.types'
import React from 'react'

const ICONS: React.ReactNode[] = [
  <svg key="a" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  <svg key="b" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  <svg key="c" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  <svg key="d" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
]

export function PhilosophySection({ block }: { block: Block }) {
  const d     = block.data as Record<string, unknown>
  const items = Array.isArray(d.items)
    ? d.items as Array<{ icon?: string; title: string; description: string }>
    : []

  return (
    <section style={{ background: 'var(--lito-cream,#FAFAF9)', padding: 'clamp(56px,8vw,100px) 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brand,#E84500)', margin: 0, marginBottom: 12 }}>
            {String(d.eyebrow ?? 'Values')}
          </p>
          <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink,#0A0A0A)', margin: 0 }}>
            {String(d.heading ?? 'Our Philosophy')}
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: '#F5F5F4', borderRadius: 6, padding: '36px 28px', border: '1px solid var(--lito-border,rgba(0,0,0,.1))' }}>
              <div style={{ width: 48, height: 48, background: 'rgba(232,69,0,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: 'var(--brand,#E84500)' }}>
                {ICONS[i % ICONS.length]}
              </div>
              <h3 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--lito-ink,#0A0A0A)', margin: 0, marginBottom: 10 }}>
                {item.title}
              </h3>
              <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 13.5, lineHeight: 1.65, color: '#666', margin: 0 }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
