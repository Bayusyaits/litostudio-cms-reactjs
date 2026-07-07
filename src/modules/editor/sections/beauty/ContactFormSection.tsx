import type { Block } from '@/types/editor.types'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

export function ContactFormSection({ block }: { block: Block }) {
  const d          = block.data as Record<string, unknown>
  const heading    = String(d.heading    ?? 'Get in touch')
  const submitText = String(d.submitText ?? 'Send Message')
  const rawFields  = Array.isArray(d.fields) ? (d.fields as Record<string, string>[]) : []
  const fields     = rawFields.length ? rawFields : [
    { name: 'name',    label: 'Name',        type: 'text',     required: 'true' },
    { name: 'email',   label: 'Email',       type: 'email',    required: 'true' },
    { name: 'concern', label: 'Skin Concern', type: 'select',  required: 'false' },
    { name: 'message', label: 'Message',     type: 'textarea', required: 'true' },
  ]

  const inputStyle = BODY({ width: '100%', padding: '12px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--bx-border,rgba(44,36,32,0.18))', fontSize: 14, color: 'var(--bx-text,#2C2420)', outline: 'none', boxSizing: 'border-box' as const })

  return (
    <section style={{ background: 'var(--bx-bg,#FAF8F5)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(56px,8vw,100px) clamp(24px,3vw,40px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 'clamp(32px,5vw,80px)', alignItems: 'start' }}>
          {/* Left — headline */}
          <div>
            <h2 style={DISP({ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 400, lineHeight: 0.95, margin: 0, color: 'var(--bx-text,#2C2420)' })}>
              {heading}
            </h2>
            <p style={BODY({ fontSize: 14, lineHeight: 1.7, color: 'var(--bx-text-muted,#7A6E68)', margin: '20px 0 0', maxWidth: '32ch' })}>
              We typically reply within 24 hours.
            </p>
          </div>
          {/* Right — form fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {fields.map((f) => (
              <div key={f.name}>
                <label style={BODY({ display: 'block', fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--bx-text-muted,#7A6E68)', marginBottom: 4 })}>
                  {f.label}{f.required === 'true' ? ' *' : ''}
                </label>
                {f.type === 'textarea' ? (
                  <textarea readOnly rows={4} style={{ ...inputStyle, resize: 'none' }} placeholder={`Your ${String(f.label).toLowerCase()}…`} />
                ) : f.type === 'select' ? (
                  <select style={inputStyle}>
                    <option value="">Select…</option>
                  </select>
                ) : (
                  <input readOnly type={f.type ?? 'text'} style={inputStyle} placeholder={`Your ${String(f.label).toLowerCase()}…`} />
                )}
              </div>
            ))}
            <button style={BODY({ padding: '14px 32px', background: 'var(--bx-text,#2C2420)', color: 'var(--bx-bg,#FAF8F5)', border: 0, borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', alignSelf: 'flex-start', marginTop: 8 })}>
              {submitText}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
