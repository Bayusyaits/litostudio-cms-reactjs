import type { Block } from '@/types/editor.types'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Cormorant Garamond',Georgia,serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

const DEFAULTS = [
  { num: '01', title: 'Face Care',  desc: 'Cleansers, serums, and moisturisers for every skin type.' },
  { num: '02', title: 'Treatments', desc: 'Professional-grade treatments for targeted concerns.' },
  { num: '03', title: 'Body Care',  desc: 'Nourishing formulas from head to toe.' },
  { num: '04', title: 'Tools',      desc: 'Devices and tools to amplify your routine.' },
]

export function ProductCategoriesSection({ block }: { block: Block }) {
  const d       = block.data as Record<string, unknown>
  const eyebrow = String(d.eyebrow ?? '(02) By category')
  const heading = String(d.heading ?? 'Find your daily care')
  const linkText= String(d.linkText ?? 'All products')
  const rawItems= Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : []
  const cats    = rawItems.length ? rawItems : (DEFAULTS as Record<string, unknown>[])

  return (
    <section style={{ background: 'var(--bx-page-alt,#F3F0EB)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(56px,8vw,110px) clamp(24px,3vw,40px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 48 }}>
          <div>
            <span style={BODY({ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bx-accent-text,#8B5E3C)', display: 'flex', gap: 8 })}>
              <span style={{ fontWeight: 600 }}>{eyebrow.match(/\((\d+)\)/)?.[0] ?? '(02)'}</span>
              {eyebrow.replace(/^\(\d+\)\s*/, '')}
            </span>
            <h2 style={DISP({ fontSize: 'clamp(34px,5vw,60px)', fontWeight: 400, margin: '14px 0 0', color: 'var(--bx-text,#2C2420)' })}>
              {heading}
            </h2>
          </div>
          <span style={BODY({ fontSize: 12, color: 'var(--bx-text,#2C2420)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--bx-text,#2C2420)', paddingBottom: 2 })}>
            {linkText} →
          </span>
        </div>
        {/* Grid — bordered cells with gap=1 creates thin border effect */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 1, background: 'var(--bx-border,rgba(44,36,32,0.10))', border: '1px solid var(--bx-border,rgba(44,36,32,0.10))' }}>
          {cats.map((c, idx) => (
            <div key={idx} style={{ background: 'var(--bx-bg,#FAF8F5)', padding: 'clamp(24px,3vw,38px)', display: 'flex', flexDirection: 'column', minHeight: 230, cursor: 'pointer', transition: 'background .2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bx-surface-2,#EDE9E3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bx-bg,#FAF8F5)')}>
              <span style={BODY({ fontSize: 11, color: 'var(--bx-accent-text,#8B5E3C)', letterSpacing: '.1em' })}>
                {String(c.num ?? String(idx + 1).padStart(2, '0'))}
              </span>
              <h3 style={DISP({ fontSize: 26, color: 'var(--bx-text,#2C2420)', margin: '12px 0 10px', fontWeight: 400 })}>
                {String(c.title ?? 'Category')}
              </h3>
              <p style={BODY({ fontSize: 13, lineHeight: 1.6, color: 'var(--bx-text-muted,#7A6E68)', margin: 0 })}>
                {String(c.desc ?? c.description ?? '')}
              </p>
              <span style={BODY({ marginTop: 'auto', paddingTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--bx-text,#2C2420)', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase' })}>
                Shop ↗
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
