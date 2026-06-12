/**
 * EditorRightSidebar — Content, Styles, Spacing, Layout, SEO,
 * Visibility, Conditions tabs for the selected block.
 */

import { useEditorStore } from '@/stores/editor.store'
import type { EditorTab, Block, BlockStyles } from '@/types/editor.types'

// ── Tab bar ───────────────────────────────────────────────────────────────────

const TABS: Array<{ id: EditorTab; label: string }> = [
  { id: 'content',    label: 'Content' },
  { id: 'styles',     label: 'Style' },
  { id: 'spacing',    label: 'Spacing' },
  { id: 'seo',        label: 'SEO' },
  { id: 'visibility', label: 'Visibility' },
]

// ── Form helpers ──────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-body text-xs font-medium text-[var(--text-secondary)] mb-1">
      {children}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-2.5 py-1.5 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-2)] font-body text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--lito-teal)] ${props.className ?? ''}`}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={4}
      className={`w-full px-2.5 py-1.5 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-2)] font-body text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--lito-teal)] resize-none ${props.className ?? ''}`}
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={`w-full px-2.5 py-1.5 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-2)] font-body text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--lito-teal)] ${props.className ?? ''}`}
    />
  )
}

function SpacingInput({ label, value, onChange }: { label: string; value?: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value ?? ''}
          min={0}
          max={999}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        />
        <span className="font-body text-xs text-[var(--text-muted)]">px</span>
      </div>
    </div>
  )
}

// ── Content panel (per block type) ───────────────────────────────────────────

function ContentPanel({ block }: { block: Block }) {
  const { updateBlock } = useEditorStore()
  const update = (patch: Record<string, unknown>) => updateBlock(block.id, patch)
  const d = block.data as Record<string, unknown>

  // Render generic key/value editor for all block types
  return (
    <div className="space-y-4">
      {block.type === 'heading' && (
        <>
          <div>
            <Label>Text</Label>
            <Input value={d['text'] as string ?? ''} onChange={(e) => update({ text: e.target.value })} placeholder="Heading text" />
          </div>
          <div>
            <Label>Level</Label>
            <Select value={d['level'] as number ?? 2} onChange={(e) => update({ level: parseInt(e.target.value) })}>
              <option value={1}>H1 — Page Title</option>
              <option value={2}>H2 — Section</option>
              <option value={3}>H3 — Subsection</option>
              <option value={4}>H4</option>
              <option value={5}>H5</option>
              <option value={6}>H6</option>
            </Select>
          </div>
        </>
      )}

      {block.type === 'text' && (
        <div>
          <Label>HTML Content</Label>
          <Textarea
            value={d['html'] as string ?? ''}
            onChange={(e) => update({ html: e.target.value })}
            placeholder="<p>Your text...</p>"
            rows={8}
          />
          <p className="font-body text-[10px] text-[var(--text-muted)] mt-1">
            Basic HTML tags supported: &lt;p&gt; &lt;strong&gt; &lt;em&gt; &lt;a&gt; &lt;ul&gt; &lt;li&gt;
          </p>
        </div>
      )}

      {block.type === 'image' && (
        <>
          <div>
            <Label>Image URL</Label>
            <Input value={d['src'] as string ?? ''} onChange={(e) => update({ src: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <Label>Alt text</Label>
            <Input value={d['alt'] as string ?? ''} onChange={(e) => update({ alt: e.target.value })} placeholder="Describe the image" />
          </div>
          <div>
            <Label>Caption</Label>
            <Input value={d['caption'] as string ?? ''} onChange={(e) => update({ caption: e.target.value })} placeholder="Optional caption" />
          </div>
          <div>
            <Label>Width</Label>
            <Select value={d['width'] as string ?? 'full'} onChange={(e) => update({ width: e.target.value })}>
              <option value="full">Full width</option>
              <option value="wide">Wide</option>
              <option value="normal">Normal</option>
              <option value="small">Small</option>
            </Select>
          </div>
        </>
      )}

      {block.type === 'button' && (
        <>
          <div>
            <Label>Button text</Label>
            <Input value={d['text'] as string ?? ''} onChange={(e) => update({ text: e.target.value })} placeholder="Click here" />
          </div>
          <div>
            <Label>URL</Label>
            <Input value={d['url'] as string ?? ''} onChange={(e) => update({ url: e.target.value })} placeholder="https://" />
          </div>
          <div>
            <Label>Variant</Label>
            <Select value={d['variant'] as string ?? 'primary'} onChange={(e) => update({ variant: e.target.value })}>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
              <option value="ghost">Ghost</option>
            </Select>
          </div>
          <div>
            <Label>Size</Label>
            <Select value={d['size'] as string ?? 'md'} onChange={(e) => update({ size: e.target.value })}>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </Select>
          </div>
          <div>
            <Label>Alignment</Label>
            <Select value={d['align'] as string ?? 'center'} onChange={(e) => update({ align: e.target.value })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </div>
        </>
      )}

      {block.type === 'spacer' && (
        <div>
          <Label>Height (px)</Label>
          <Input
            type="number" min={0} max={500}
            value={d['height'] as number ?? 48}
            onChange={(e) => update({ height: parseInt(e.target.value) || 0 })}
          />
        </div>
      )}

      {block.type === 'hero' && (
        <>
          <div>
            <Label>Title</Label>
            <Input value={d['title'] as string ?? ''} onChange={(e) => update({ title: e.target.value })} placeholder="Your headline" />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input value={d['subtitle'] as string ?? ''} onChange={(e) => update({ subtitle: e.target.value })} placeholder="Supporting text" />
          </div>
          <div>
            <Label>CTA Button text</Label>
            <Input value={d['ctaText'] as string ?? ''} onChange={(e) => update({ ctaText: e.target.value })} placeholder="Get Started" />
          </div>
          <div>
            <Label>CTA Button URL</Label>
            <Input value={d['ctaUrl'] as string ?? ''} onChange={(e) => update({ ctaUrl: e.target.value })} placeholder="#" />
          </div>
          <div>
            <Label>Background image URL</Label>
            <Input value={d['backgroundImage'] as string ?? ''} onChange={(e) => update({ backgroundImage: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <Label>Overlay opacity (%)</Label>
            <Input type="range" min={0} max={100} value={d['backgroundOverlay'] as number ?? 50} onChange={(e) => update({ backgroundOverlay: parseInt(e.target.value) })} />
            <p className="font-body text-[10px] text-[var(--text-muted)]">{d['backgroundOverlay'] as number ?? 50}%</p>
          </div>
          <div>
            <Label>Text alignment</Label>
            <Select value={d['align'] as string ?? 'center'} onChange={(e) => update({ align: e.target.value })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </div>
        </>
      )}

      {block.type === 'video' && (
        <div>
          <Label>YouTube / Vimeo URL</Label>
          <Input value={d['url'] as string ?? ''} onChange={(e) => update({ url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
        </div>
      )}

      {block.type === 'html' && (
        <div>
          <Label>HTML code</Label>
          <Textarea
            value={d['html'] as string ?? ''}
            onChange={(e) => update({ html: e.target.value })}
            placeholder="<!-- Paste your HTML here -->"
            rows={12}
            style={{ fontFamily: 'monospace', fontSize: 11 }}
          />
        </div>
      )}

      {block.type === 'divider' && (
        <>
          <div>
            <Label>Style</Label>
            <Select value={d['style'] as string ?? 'solid'} onChange={(e) => update({ style: e.target.value })}>
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="double">Double</option>
            </Select>
          </div>
          <div>
            <Label>Width</Label>
            <Select value={d['width'] as string ?? 'full'} onChange={(e) => update({ width: e.target.value })}>
              <option value="full">Full</option>
              <option value="wide">Wide</option>
              <option value="normal">Normal</option>
            </Select>
          </div>
        </>
      )}

      {block.type === 'map' && (
        <>
          <div>
            <Label>Google Maps embed URL</Label>
            <Textarea value={d['src'] as string ?? ''} onChange={(e) => update({ src: e.target.value })} placeholder="https://www.google.com/maps/embed?..." />
          </div>
          <div>
            <Label>Height (px)</Label>
            <Input type="number" value={d['height'] as number ?? 400} onChange={(e) => update({ height: parseInt(e.target.value) || 400 })} />
          </div>
        </>
      )}

      {/* Fallback for complex blocks */}
      {!['heading','text','image','button','spacer','hero','video','html','divider','map'].includes(block.type) && (
        <div className="p-3 rounded-xl bg-[var(--cms-surface-3)] border border-[var(--lito-border)]">
          <p className="font-body text-xs font-semibold text-[var(--text-primary)] mb-1">
            {block.type} block
          </p>
          <p className="font-body text-xs text-[var(--text-muted)]">
            Use the JSON editor or the full block editor to configure this block.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Styles panel ─────────────────────────────────────────────────────────────

function StylesPanel({ block }: { block: Block }) {
  const { updateStyles } = useEditorStore()
  const s = block.styles ?? {}
  const upd = (patch: Partial<BlockStyles>) => updateStyles(block.id, patch)

  return (
    <div className="space-y-4">
      <div>
        <Label>Background colour</Label>
        <div className="flex gap-2 items-center">
          <input type="color" value={s.backgroundColor ?? '#ffffff'} onChange={(e) => upd({ backgroundColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-[var(--lito-border)]" />
          <Input value={s.backgroundColor ?? ''} onChange={(e) => upd({ backgroundColor: e.target.value })} placeholder="transparent" />
        </div>
      </div>
      <div>
        <Label>Text colour</Label>
        <div className="flex gap-2 items-center">
          <input type="color" value={s.textColor ?? '#000000'} onChange={(e) => upd({ textColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-[var(--lito-border)]" />
          <Input value={s.textColor ?? ''} onChange={(e) => upd({ textColor: e.target.value })} placeholder="inherit" />
        </div>
      </div>
      <div>
        <Label>Text alignment</Label>
        <Select value={s.textAlign ?? ''} onChange={(e) => upd({ textAlign: e.target.value as BlockStyles['textAlign'] })}>
          <option value="">Default</option>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </Select>
      </div>
      <div>
        <Label>Max width</Label>
        <Select value={s.maxWidth ?? 'full'} onChange={(e) => upd({ maxWidth: e.target.value as BlockStyles['maxWidth'] })}>
          <option value="full">Full</option>
          <option value="xl">XL (1280px)</option>
          <option value="lg">Large (1024px)</option>
          <option value="md">Medium (768px)</option>
          <option value="sm">Small (640px)</option>
        </Select>
      </div>
      <div>
        <Label>Border radius (px)</Label>
        <Input type="number" min={0} max={999} value={s.borderRadius ?? ''} onChange={(e) => upd({ borderRadius: parseInt(e.target.value) || 0 })} placeholder="0" />
      </div>
      <div>
        <Label>Custom CSS class</Label>
        <Input value={s.customCss ?? ''} onChange={(e) => upd({ customCss: e.target.value })} placeholder="my-class another-class" />
      </div>
    </div>
  )
}

// ── Spacing panel ─────────────────────────────────────────────────────────────

function SpacingPanel({ block }: { block: Block }) {
  const { updateStyles } = useEditorStore()
  const s = block.styles ?? {}
  const upd = (patch: Partial<BlockStyles>) => updateStyles(block.id, patch)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <SpacingInput label="Padding Top"    value={s.paddingTop}    onChange={(v) => upd({ paddingTop: v })} />
        <SpacingInput label="Padding Bottom" value={s.paddingBottom} onChange={(v) => upd({ paddingBottom: v })} />
        <SpacingInput label="Padding Left"   value={s.paddingLeft}   onChange={(v) => upd({ paddingLeft: v })} />
        <SpacingInput label="Padding Right"  value={s.paddingRight}  onChange={(v) => upd({ paddingRight: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SpacingInput label="Margin Top"    value={s.marginTop}    onChange={(v) => upd({ marginTop: v })} />
        <SpacingInput label="Margin Bottom" value={s.marginBottom} onChange={(v) => upd({ marginBottom: v })} />
      </div>
    </div>
  )
}

// ── SEO panel ─────────────────────────────────────────────────────────────────

function SEOPanel({ block }: { block: Block }) {
  const seo = block.seo ?? {}
  return (
    <div className="space-y-4">
      <p className="font-body text-xs text-[var(--text-muted)]">
        Override page-level SEO for this section (optional).
      </p>
      <div>
        <Label>Title override</Label>
        <Input
          value={seo.title ?? ''}
          onChange={() => { /* SEO fields live outside block.data — not yet wired */ }}
          placeholder="Leave blank to use page title"
        />
      </div>
      <div>
        <Label>Description override</Label>
        <Textarea
          value={seo.description ?? ''}
          placeholder="Leave blank to use page description"
        />
      </div>
    </div>
  )
}

// ── Visibility panel ──────────────────────────────────────────────────────────

function VisibilityPanel({ block }: { block: Block }) {
  const { updateVisibility } = useEditorStore()
  const v = block.visibility ?? { desktop: true, tablet: true, mobile: true }

  return (
    <div className="space-y-3">
      {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
        <label key={device} className="flex items-center justify-between cursor-pointer">
          <span className="font-body text-sm text-[var(--text-primary)] capitalize">{device}</span>
          <div
            className={`w-9 h-5 rounded-full transition-colors ${v[device] !== false ? 'bg-[var(--lito-teal)]' : 'bg-[var(--cms-surface-3)]'}`}
            onClick={() => updateVisibility(block.id, { [device]: v[device] === false })}
          >
            <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform m-0.5 ${v[device] !== false ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </label>
      ))}
    </div>
  )
}

// ── Main sidebar ──────────────────────────────────────────────────────────────

export function EditorRightSidebar() {
  const { selectedBlock, activeEditorTab, setEditorTab } = useEditorStore()
  const block = selectedBlock()

  if (!block) {
    return (
      <div className="w-64 flex-shrink-0 bg-[var(--cms-sidebar-bg)] border-l border-[var(--lito-border)] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="font-body text-xs font-semibold text-[var(--text-primary)]">No block selected</p>
          <p className="font-body text-xs text-[var(--text-muted)]">Click a block in the canvas to edit it.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 flex-shrink-0 bg-[var(--cms-sidebar-bg)] border-l border-[var(--lito-border)] flex flex-col">
      {/* Block info header */}
      <div className="px-3 py-2.5 border-b border-[var(--lito-border)] flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-[var(--lito-teal)]/10 flex items-center justify-center">
          <span className="text-[10px] text-[var(--lito-teal)] font-bold uppercase">{block.type[0]}</span>
        </div>
        <span className="font-body text-xs font-semibold text-[var(--text-primary)] capitalize">{block.type}</span>
        <span className="font-body text-[9px] text-[var(--text-muted)] font-mono ml-auto">{block.id}</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--lito-border)] overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setEditorTab(tab.id)}
            className={`flex-1 py-2 text-[10px] font-body font-medium whitespace-nowrap transition-colors ${
              activeEditorTab === tab.id
                ? 'border-b-2 border-[var(--lito-teal)] text-[var(--lito-teal)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {activeEditorTab === 'content'    && <ContentPanel    block={block} />}
        {activeEditorTab === 'styles'     && <StylesPanel     block={block} />}
        {activeEditorTab === 'spacing'    && <SpacingPanel    block={block} />}
        {activeEditorTab === 'seo'        && <SEOPanel        block={block} />}
        {activeEditorTab === 'visibility' && <VisibilityPanel block={block} />}
      </div>
    </div>
  )
}
