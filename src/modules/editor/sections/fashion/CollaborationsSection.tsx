import type { Block } from '@/types/editor.types'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})
const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Barlow',sans-serif)", ...e,
})

const DEFAULT_PARTNERS = [
  { name:'Studio\nTOKY' }, { name:'Label\nKURO' }, { name:'Arkana\nPress' },
  { name:'Volta\nAgency' }, { name:'Mesh\nJakarta' }, { name:'Indigo\nWorks' },
]

export function CollaborationsSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const eyebrow  = String(d.eyebrow ?? 'Partners & Collaborations')
  const heading  = String(d.title ?? 'Built with the Best')
  const partners = (d.partners as { name: string }[]) ?? DEFAULT_PARTNERS

  return (
    <section style={{ background: 'var(--nx-bg,#fff)', padding: '96px 0' }}>
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 clamp(24px,2.9vw,40px)' }}>
        <div style={{ marginBottom: 40 }}>
          <p style={BODY({ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-text-muted,#777)', margin: '0 0 10px' })}>{eyebrow}</p>
          <h2 style={DISP({ fontSize: 'clamp(28px,3vw,44px)', fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: 0 })}>{heading}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0, border: '1px solid var(--nx-border,#e8e8e8)' }}>
          {partners.map((p, i) => (
            <div key={i} style={{
              padding: '40px 24px',
              borderRight: i < partners.length - 1 ? '1px solid var(--nx-border,#e8e8e8)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center',
            }}>
              <div style={DISP({ fontSize: 16, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.01em', textTransform: 'uppercase', color: 'var(--nx-text,#111)', whiteSpace: 'pre-line' })}>{p.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
