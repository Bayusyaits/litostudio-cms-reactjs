import type { Block } from '@/types/editor.types'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

export function RichTextSection({ block }: { block: Block }) {
  const d    = block.data as Record<string, unknown>
  const html = String(d.html ?? d.content ?? d.text ?? '')

  return (
    <section style={{ background: 'var(--lito-cream,#FAFAF9)', padding: 'clamp(48px,6vw,80px) 32px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'var(--font-body,Inter)', fontSize: 16, lineHeight: 1.8, color: 'var(--lito-ink,#0A0A0A)' }}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
    </section>
  )
}
