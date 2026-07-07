import type { Block } from '@/types/editor.types'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

const BODY = (e?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "var(--font-body,'Inter',system-ui,sans-serif)", ...e,
})

export function RichTextSection({ block }: { block: Block }) {
  const d   = block.data as Record<string, unknown>
  const html = String(d.html ?? d.content ?? d.text ?? '')

  return (
    <section style={{ background: 'var(--bx-bg,#FAF8F5)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(48px,6vw,80px) clamp(24px,3vw,40px)' }}>
        <div
          style={BODY({ fontSize: 16, lineHeight: 1.8, color: 'var(--bx-text,#2C2420)' })}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
      </div>
    </section>
  )
}
