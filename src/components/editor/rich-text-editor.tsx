'use client'
// apps/cms/src/components/editor/rich-text-editor.tsx
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Quote,
  Link2, Undo, Redo, Heading2, Heading3,
} from 'lucide-react'
import { cn } from '@litostudio/ui'

interface RichTextEditorProps {
  value?: JSONContent
  onChange?: (value: JSONContent) => void
  placeholder?: string
  readOnly?: boolean
  maxLength?: number
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
  readOnly = false,
  maxLength,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Placeholder.configure({ placeholder }),
      ...(maxLength ? [CharacterCount.configure({ limit: maxLength })] : []),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getJSON())
    },
  })

  if (!editor) return null

  function setLink() {
    const previous = editor!.getAttributes('link')['href'] as string | undefined
    const url = window.prompt('URL', previous)
    if (url === null) return
    if (url === '') { editor!.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    editor!.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className={cn('rounded-md border border-input bg-background', readOnly && 'opacity-75')}>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-input px-2 py-1.5">
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link">
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo">
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo">
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}
      <div className="tiptap-editor border-0 rounded-none rounded-b-md">
        <EditorContent editor={editor} />
      </div>
      {maxLength && (
        <div className="px-3 py-1 text-xs text-muted-foreground border-t border-input text-right">
          {editor.storage['characterCount']?.characters?.() ?? 0} / {maxLength}
        </div>
      )}
    </div>
  )
}

function ToolbarButton({ onClick, active, title, children }: {
  onClick: () => void; active: boolean; title: string; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
        active && 'bg-accent text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1" />
}
