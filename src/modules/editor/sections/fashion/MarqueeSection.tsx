import type { Block } from '@/types/editor.types'

const DISP = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-display,'Barlow Condensed',sans-serif)", ...e,
})

const ITEMS = ['NONOX','N','WEAR','N','NONOX','N','WEAR','N','NONOX','N','WEAR','N']

export function MarqueeSection({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const items = (d.items as string[]) ?? ITEMS

  return (
    <div style={{ background: 'var(--nx-text,#111)', overflow: 'hidden', padding: '18px 0', display: 'flex', gap: 0 }}>
      <div style={{ display: 'flex', gap: 32, whiteSpace: 'nowrap', animation: 'marquee 12s linear infinite' }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={DISP({
            fontSize: item === 'N' ? 20 : 14,
            fontWeight: 800,
            letterSpacing: item === 'N' ? '0.05em' : '0.3em',
            textTransform: 'uppercase',
            color: item === 'N' ? 'rgba(255,255,255,0.4)' : '#fff',
          })}>{item}</span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  )
}
