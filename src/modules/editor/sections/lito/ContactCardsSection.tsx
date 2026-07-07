import type { Block } from '@/types/editor.types'
import { MapPin, Mail, Phone, Clock } from 'lucide-react'
import React from 'react'

const ICON_MAP: Record<string, React.ReactNode> = {
  MapPin: <MapPin size={18} />,
  Mail:   <Mail size={18} />,
  Phone:  <Phone size={18} />,
  Clock:  <Clock size={18} />,
}

export function ContactCardsSection({ block }: { block: Block }) {
  const d     = block.data as Record<string, unknown>
  const items = Array.isArray(d.items)
    ? d.items as Array<{ icon?: string; label?: string; value?: string }>
    : []

  return (
    <section style={{ background: 'var(--lito-cream,#FAFAF9)', padding: 'clamp(56px,8vw,100px) 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {!!d.heading && (
          <h2 style={{ fontFamily: 'var(--font-display,Inter)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink,#0A0A0A)', margin: 0, marginBottom: 40 }}>
            {String(d.heading)}
          </h2>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {items.map((item, i) => (
            <div key={i} style={{ padding: '28px 32px', border: '1px solid var(--lito-border,rgba(0,0,0,.1))', background: '#F5F5F4', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {!!item.icon && ICON_MAP[item.icon] && (
                <div style={{ width: 40, height: 40, background: 'var(--lito-ink,#0A0A0A)', color: 'var(--lito-cream,#FAFAF9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {ICON_MAP[item.icon]}
                </div>
              )}
              <div>
                <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', margin: 0, marginBottom: 6 }}>
                  {item.label ?? `Info ${i + 1}`}
                </p>
                <p style={{ fontFamily: 'var(--font-body,Inter)', fontSize: 15, color: 'var(--lito-ink,#0A0A0A)', margin: 0, whiteSpace: 'pre-line' }}>
                  {item.value ?? '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
