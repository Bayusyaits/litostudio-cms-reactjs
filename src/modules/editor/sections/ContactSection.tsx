/**
 * ContactSection — visual replica of website ContactSection.vue
 * Split layout: info left (address, phone, email, socials) + form right.
 */

import type { Block } from '@/types/editor.types'
import type { ContactFormBlockData } from '@/types/editor.types'

export function ContactSection({ block }: { block: Block }) {
  const d = block.data as ContactFormBlockData & Record<string, unknown>

  const heading   = d.heading     ?? 'Hubungi\nKami'
  const desc      = d.description ?? 'Kami siap membantu Anda merencanakan sesi foto yang sempurna. Ceritakan momen yang ingin Anda abadikan.'
  const address   = (d.address    as string | undefined) ?? 'Jl. Malioboro No.1, Yogyakarta'
  const phone     = (d.phone      as string | undefined) ?? '+62 812 3456 7890'
  const email     = (d.email      as string | undefined) ?? 'hello@litostudio.id'
  const headingLines = heading.split('\n')

  return (
    <section style={{ padding: '120px 0', background: 'var(--cms-card-bg, var(--lito-cream, #F7F4EE))' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 80 }}>

          {/* Left: info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)' }}>08</span>
              <span style={{ width: 32, height: 1, background: 'var(--lito-gold, #D4A853)', opacity: 0.5 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #9E9E9E)' }}>Get In Touch</span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,4vw,56px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary, #111)', marginBottom: 24 }}>
              {headingLines[0]}
              {headingLines[1] && <><br /><em>{headingLines[1]}</em></>}
            </h2>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75, color: 'var(--text-muted, #6B6560)', marginBottom: 48 }}>
              {desc}
            </p>

            {/* Contact details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[
                { label: 'Address', value: address },
                { label: 'Phone',   value: phone },
                { label: 'Email',   value: email },
              ].map(item => (
                <div key={item.label}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)', marginBottom: 6 }}>{item.label}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-primary, #111)' }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div style={{ background: 'var(--cms-surface-3, #FFFFFF)', padding: 48, borderRadius: 2, boxShadow: '0 12px 40px rgba(17,17,17,0.08)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300, color: 'var(--text-primary, #111)', marginBottom: 32 }}>
              Kirim Pesan
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { label: 'Nama Lengkap', type: 'text', placeholder: 'Nama Anda' },
                { label: 'Email',        type: 'email', placeholder: 'email@anda.com' },
                { label: 'Telepon',      type: 'tel', placeholder: '+62 812 ...' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted, #9E9E9E)', marginBottom: 8 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} disabled style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--lito-border, #D9D2C7)', borderRadius: 2, background: 'var(--cms-card-bg, #F7F4EE)', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-primary, #111)', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted, #9E9E9E)', marginBottom: 8 }}>Pesan</label>
                <textarea rows={4} placeholder="Ceritakan momen yang ingin Anda abadikan..." disabled style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--lito-border, #D9D2C7)', borderRadius: 2, background: 'var(--cms-card-bg, #F7F4EE)', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-primary, #111)', resize: 'none', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <button disabled style={{ padding: '14px 0', background: 'var(--lito-ink, #111)', color: 'var(--lito-cream, #F7F4EE)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', borderRadius: 2, cursor: 'default', marginTop: 8 }}>
                {(d.submitText as string | undefined) ?? 'Kirim Pesan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
