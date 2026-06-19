/**
 * RichTextEditor — CKEditor 5 Classic Build wrapper.
 *
 * Outputs raw HTML string. Designed for Editor A (simple content editing).
 * Value is stored in translations.body as { version: '1.0', source: 'simple', html: '...' }
 *
 * Body helpers are exported from this module:
 *   encodeBody(html)  → SimpleBody JSON (for saving)
 *   decodeBody(body)  → HTML string (for loading)
 */

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// CKEditor 5 Classic — already in dependencies
// The classic build ships a plain JS file with no bundled TS types; we
// declare just the surface we use so the compiler is happy.
type CKEditorInstance = {
  getData(): string
  setData(data: string): void
  destroy(): Promise<void>
  model: { document: { on(event: string, handler: () => void): void } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enableReadOnlyMode?(lockId: string): void
}

type ClassicEditorStatic = {
  create(element: HTMLElement | string, config?: Record<string, unknown>): Promise<CKEditorInstance>
}

// ── Body encoding helpers ─────────────────────────────────────────────────

export interface SimpleBody {
  version: '1.0'
  source: 'simple'
  html: string
}

export function encodeBody(html: string): SimpleBody {
  return { version: '1.0', source: 'simple', html }
}

export function decodeBody(body: unknown): string {
  if (!body) return ''
  if (typeof body === 'string') return body
  if (
    typeof body === 'object' &&
    body !== null &&
    'html' in body &&
    typeof (body as SimpleBody).html === 'string'
  ) {
    return (body as SimpleBody).html
  }
  return ''
}

// ── Component ─────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minHeight?: number
  /** AC-01: Accessible label for the editing region (announces to screen readers) */
  ariaLabel?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your content here…',
  disabled,
  className,
  minHeight = 300,
  ariaLabel = 'Rich text editor',
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef    = useRef<any>(null)
  const valueRef     = useRef(value)

  // Keep valueRef in sync without triggering effect
  useRef(value)
  valueRef.current = value

  useEffect(() => {
    if (!containerRef.current) return

    let destroyed = false

    // Dynamic import to avoid SSR issues
    import('@ckeditor/ckeditor5-build-classic').then((mod) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ClassicEditor = (mod.default ?? mod) as unknown as ClassicEditorStatic

      ClassicEditor.create(containerRef.current!, {
        placeholder,
        // AC-01: Provide accessible label for the toolbar container and
        // editing region so screen readers announce the editor context.
        label: ariaLabel,
        toolbar: {
          items: [
            'heading', '|',
            'bold', 'italic', 'underline', 'strikethrough', '|',
            'link', 'blockQuote', '|',
            'bulletedList', 'numberedList', '|',
            'insertTable', '|',
            'undo', 'redo',
          ],
          // Accessible label for the toolbar region
          label: 'Editor toolbar',
        },
        heading: {
          options: [
            { model: 'paragraph',  title: 'Paragraph',  class: 'ck-heading_paragraph' },
            { model: 'heading2',   view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
            { model: 'heading3',   view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
            { model: 'heading4',   view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
          ],
        },
      }).then((editor) => {
        if (destroyed) { void editor.destroy(); return }

        editorRef.current = editor
        editor.setData(valueRef.current)

        if (disabled) {
          editor.enableReadOnlyMode?.('host')
        }

        editor.model.document.on('change:data', () => {
          const html = editor.getData()
          onChange(html)
        })
      }).catch((err: unknown) => {
        console.error('[RichTextEditor] CKEditor create error:', err)
      })
    }).catch((err: unknown) => {
      console.error('[RichTextEditor] CKEditor import error:', err)
    })

    return () => {
      destroyed = true
      if (editorRef.current) {
        void editorRef.current.destroy().catch(() => {/* ignore */})
        editorRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // mount once

  // Sync external value changes (e.g. when loading data)
  useEffect(() => {
    if (!editorRef.current) return
    const current = editorRef.current.getData()
    if (current !== value) {
      editorRef.current.setData(value)
    }
  }, [value])

  return (
    <div
      className={cn(
        // ck-editor-host — global CSS in globals.css handles all theming + dark mode
        // Keep only structural layout here
        'ck-editor-host relative rounded-[var(--radius-md)] border border-[var(--lito-border)]',
        // Enforce min-height on editable area via CSS var
        '[&_.ck-editor__editable]:min-h-[var(--ck-min-h)]',
        '[&_.ck-editor__editable]:font-body',
        className,
      )}
      style={{ '--ck-min-h': `${minHeight}px` } as React.CSSProperties}
    >
      <div ref={containerRef} />
    </div>
  )
}
