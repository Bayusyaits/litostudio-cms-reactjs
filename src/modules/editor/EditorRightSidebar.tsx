/**
 * EditorRightSidebar — matches screenshot design exactly.
 * Header: block type icon + name + "Block ID: xxxxxx"
 * Tabs: Content | Style | Spacing | SEO | Visibility
 * Spacing tab: Margin/Padding with lock icon, 2×2 grid (Top/Bottom | Left/Right),
 *              device switcher, Advanced collapsible, footer (Need help? / Keyboard shortcuts)
 */

import { useState } from 'react'
import { Lock, Monitor, Tablet, Smartphone, HelpCircle, ChevronDown, Crown, Plus, Trash2 } from 'lucide-react'
import { useEditorStore } from '@/stores/editor.store'
import { ImageUploader } from '@/components/molecules/ImageUploader'
import type { EditorTab, Block, BlockStyles } from '@/types/editor.types'

// ── Reusable form helpers ─────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
      color: 'var(--text-secondary)', margin: '0 0 4px',
    }}>
      {children}
    </p>
  )
}

function PxInput({
  label, value, onChange,
}: { label: string; value?: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', margin: '0 0 3px' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0,
        border: '1px solid var(--lito-border)', borderRadius: 6, overflow: 'hidden' }}>
        <input
          type="number"
          value={value ?? 0}
          min={0} max={999}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          style={{
            width: '100%', padding: '5px 6px',
            border: 'none', outline: 'none',
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'var(--text-primary)',
            background: 'var(--cms-surface-2)',
          }}
        />
        <span style={{
          padding: '0 6px', lineHeight: '28px',
          fontFamily: 'var(--font-body)', fontSize: 11,
          color: 'var(--text-muted)', background: 'var(--cms-surface-2)',
          borderLeft: '1px solid var(--lito-border)',
          flexShrink: 0,
        }}>
          px
        </span>
      </div>
    </div>
  )
}

function FieldInput({ label, value, placeholder, onChange }: {
  label: string; value?: string; placeholder?: string; onChange: (v: string) => void
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Label>{label}</Label>
      <input
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '6px 10px',
          border: '1px solid var(--lito-border)', borderRadius: 6,
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'var(--text-primary)',
          background: 'var(--cms-surface-2)', outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function FieldSelect({ label, value, options, onChange }: {
  label: string; value?: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Label>{label}</Label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '6px 10px',
          border: '1px solid var(--lito-border)', borderRadius: 6,
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'var(--text-primary)',
          background: 'var(--cms-surface-2)', outline: 'none',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function FieldTextarea({ label, value, placeholder, onChange }: {
  label: string; value?: string; placeholder?: string; onChange: (v: string) => void
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Label>{label}</Label>
      <textarea
        value={value ?? ''}
        placeholder={placeholder}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '6px 10px',
          border: '1px solid var(--lito-border)', borderRadius: 6,
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'var(--text-primary)',
          background: 'var(--cms-surface-2)', outline: 'none',
          resize: 'vertical', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

// ── Section header with lock icon ─────────────────────────────────────────────

function SectionHead({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px 6px',
    }}>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
        color: 'var(--text-primary)', margin: 0,
      }}>
        {label}
      </p>
      <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <Lock size={12} style={{ color: 'var(--text-muted)' }} />
      </button>
    </div>
  )
}

// ── Content panel ─────────────────────────────────────────────────────────────

function ContentPanel({ block }: { block: Block }) {
  const { updateBlock } = useEditorStore()
  const update = (patch: Record<string, unknown>) => updateBlock(block.id, patch)
  const d = block.data as Record<string, unknown>

  // ── heading ──────────────────────────────────────────────────────────────
  if (block.type === 'heading') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Text" value={d['text'] as string} placeholder="Heading text" onChange={v => update({ text: v })} />
      <FieldSelect label="Level" value={String(d['level'] ?? 2)} options={[
        { value: '1', label: 'H1 — Page Title' },
        { value: '2', label: 'H2 — Section' },
        { value: '3', label: 'H3 — Subsection' },
        { value: '4', label: 'H4' },
        { value: '5', label: 'H5' },
        { value: '6', label: 'H6' },
      ]} onChange={v => update({ level: parseInt(v) })} />
    </div>
  )

  // ── text ─────────────────────────────────────────────────────────────────
  if (block.type === 'text') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldTextarea label="HTML Content" value={d['html'] as string} placeholder="<p>Your text...</p>" onChange={v => update({ html: v })} />
    </div>
  )

  // ── image ────────────────────────────────────────────────────────────────
  if (block.type === 'image') return (
    <div style={{ padding: '4px 14px' }}>
      <div style={{ marginBottom: 12 }}>
        <Label>Image</Label>
        <ImageUploader
          value={d['src'] as string | undefined}
          folder="blocks"
          onChange={url => update({ src: url ?? '' })}
        />
      </div>
      <FieldInput label="Alt text" value={d['alt'] as string} placeholder="Describe the image" onChange={v => update({ alt: v })} />
      <FieldInput label="Caption" value={d['caption'] as string} placeholder="Optional caption" onChange={v => update({ caption: v })} />
      <FieldInput label="Link URL" value={d['link'] as string} placeholder="https://..." onChange={v => update({ link: v })} />
      <FieldSelect label="Width" value={d['width'] as string ?? 'full'} options={[
        { value: 'full', label: 'Full width' },
        { value: 'wide', label: 'Wide' },
        { value: 'normal', label: 'Normal' },
        { value: 'small', label: 'Small' },
      ]} onChange={v => update({ width: v })} />
    </div>
  )

  // ── gallery ──────────────────────────────────────────────────────────────
  if (block.type === 'gallery') {
    const images = (d['images'] as Array<{ src: string; alt: string; caption?: string }>) ?? []
    const updateImages = (next: typeof images) => update({ images: next })
    return (
      <div style={{ padding: '4px 14px' }}>
        <FieldSelect label="Columns" value={String(d['columns'] ?? 3)} options={[
          { value: '2', label: '2 columns' },
          { value: '3', label: '3 columns' },
          { value: '4', label: '4 columns' },
        ]} onChange={v => update({ columns: parseInt(v) })} />
        <FieldSelect label="Gap" value={d['gap'] as string ?? 'md'} options={[
          { value: 'none', label: 'No gap' },
          { value: 'sm', label: 'Small' },
          { value: 'md', label: 'Medium' },
          { value: 'lg', label: 'Large' },
        ]} onChange={v => update({ gap: v })} />

        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Label>Images ({images.length})</Label>
            <button
              type="button"
              onClick={() => updateImages([...images, { src: '', alt: '' }])}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 5,
                border: '1px solid var(--lito-teal)',
                background: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 11,
                color: 'var(--lito-teal)',
              }}
            >
              <Plus size={11} /> Add
            </button>
          </div>

          {images.length === 0 && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              No images yet. Click Add to start.
            </p>
          )}

          {images.map((img, idx) => (
            <div key={idx} style={{
              padding: 8, marginBottom: 8,
              border: '1px solid var(--lito-border)', borderRadius: 8,
              background: 'var(--cms-surface-2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
                  Image {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => updateImages(images.filter((_, i) => i !== idx))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                >
                  <Trash2 size={12} style={{ color: 'var(--lito-danger, #f87171)' }} />
                </button>
              </div>
              <ImageUploader
                value={img.src || undefined}
                folder="blocks/gallery"
                onChange={url => {
                  const next = [...images]
                  next[idx] = { ...next[idx], src: url ?? '' }
                  updateImages(next)
                }}
              />
              <div style={{ marginTop: 6 }}>
                <input
                  value={img.alt}
                  placeholder="Alt text"
                  onChange={e => {
                    const next = [...images]
                    next[idx] = { ...next[idx], alt: e.target.value }
                    updateImages(next)
                  }}
                  style={{
                    width: '100%', padding: '4px 8px',
                    border: '1px solid var(--lito-border)', borderRadius: 5,
                    fontFamily: 'var(--font-body)', fontSize: 11,
                    color: 'var(--text-primary)', background: 'var(--cms-card-bg)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── video ────────────────────────────────────────────────────────────────
  if (block.type === 'video') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Video URL" value={d['url'] as string} placeholder="YouTube or Vimeo URL" onChange={v => update({ url: v })} />
      <FieldInput label="Caption" value={d['caption'] as string} placeholder="Optional caption" onChange={v => update({ caption: v })} />
    </div>
  )

  // ── button ───────────────────────────────────────────────────────────────
  if (block.type === 'button') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Button text" value={d['text'] as string} placeholder="Click here" onChange={v => update({ text: v })} />
      <FieldInput label="URL" value={d['url'] as string} placeholder="https://" onChange={v => update({ url: v })} />
      <FieldSelect label="Variant" value={d['variant'] as string ?? 'primary'} options={[
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
        { value: 'outline', label: 'Outline' },
        { value: 'ghost', label: 'Ghost' },
      ]} onChange={v => update({ variant: v })} />
      <FieldSelect label="Size" value={d['size'] as string ?? 'md'} options={[
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
      ]} onChange={v => update({ size: v })} />
      <FieldSelect label="Alignment" value={d['align'] as string ?? 'center'} options={[
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ]} onChange={v => update({ align: v })} />
    </div>
  )

  // ── hero ─────────────────────────────────────────────────────────────────
  if (block.type === 'hero') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Title" value={d['title'] as string} placeholder="Your headline" onChange={v => update({ title: v })} />
      <FieldInput label="Subtitle" value={d['subtitle'] as string} placeholder="Supporting text" onChange={v => update({ subtitle: v })} />
      <FieldInput label="CTA text" value={d['ctaText'] as string} placeholder="Get Started" onChange={v => update({ ctaText: v })} />
      <FieldInput label="CTA URL" value={d['ctaUrl'] as string} placeholder="#" onChange={v => update({ ctaUrl: v })} />
      <FieldInput label="Secondary CTA text" value={d['ctaSecondaryText'] as string} placeholder="Learn More" onChange={v => update({ ctaSecondaryText: v })} />
      <FieldInput label="Secondary CTA URL" value={d['ctaSecondaryUrl'] as string} placeholder="#" onChange={v => update({ ctaSecondaryUrl: v })} />
      <div style={{ marginBottom: 12 }}>
        <Label>Background image</Label>
        <ImageUploader
          value={d['backgroundImage'] as string | undefined}
          folder="blocks/hero"
          onChange={url => update({ backgroundImage: url ?? '' })}
        />
      </div>
      <FieldInput label="Min height (px)" value={String(d['minHeight'] ?? 480)} placeholder="480" onChange={v => update({ minHeight: parseInt(v) || 480 })} />
      <FieldSelect label="Text alignment" value={d['align'] as string ?? 'center'} options={[
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ]} onChange={v => update({ align: v })} />
    </div>
  )

  // ── cta ──────────────────────────────────────────────────────────────────
  if (block.type === 'cta') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Title" value={d['title'] as string} placeholder="Call to action title" onChange={v => update({ title: v })} />
      <FieldTextarea label="Description" value={d['description'] as string} placeholder="Supporting description" onChange={v => update({ description: v })} />
      <FieldInput label="Button text" value={d['buttonText'] as string} placeholder="Get Started" onChange={v => update({ buttonText: v })} />
      <FieldInput label="Button URL" value={d['buttonUrl'] as string} placeholder="https://" onChange={v => update({ buttonUrl: v })} />
      <FieldSelect label="Variant" value={d['variant'] as string ?? 'dark'} options={[
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'brand', label: 'Brand (Teal)' },
      ]} onChange={v => update({ variant: v })} />
      <FieldSelect label="Alignment" value={d['align'] as string ?? 'center'} options={[
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ]} onChange={v => update({ align: v })} />
    </div>
  )

  // ── services ─────────────────────────────────────────────────────────────
  if (block.type === 'services') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Our Services" onChange={v => update({ heading: v })} />
      <FieldSelect label="Columns" value={String(d['columns'] ?? 3)} options={[
        { value: '1', label: '1 column' },
        { value: '2', label: '2 columns' },
        { value: '3', label: '3 columns' },
        { value: '4', label: '4 columns' },
      ]} onChange={v => update({ columns: parseInt(v) })} />
    </div>
  )

  // ── pricing ──────────────────────────────────────────────────────────────
  if (block.type === 'pricing') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Pricing" onChange={v => update({ heading: v })} />
    </div>
  )

  // ── testimonials ─────────────────────────────────────────────────────────
  if (block.type === 'testimonials') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="What our clients say" onChange={v => update({ heading: v })} />
      <FieldSelect label="Layout" value={d['layout'] as string ?? 'grid'} options={[
        { value: 'grid', label: 'Grid' },
        { value: 'list', label: 'List' },
      ]} onChange={v => update({ layout: v })} />
    </div>
  )

  // ── faq ──────────────────────────────────────────────────────────────────
  if (block.type === 'faq') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Frequently Asked Questions" onChange={v => update({ heading: v })} />
    </div>
  )

  // ── team ─────────────────────────────────────────────────────────────────
  if (block.type === 'team') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Meet the Team" onChange={v => update({ heading: v })} />
      <FieldSelect label="Columns" value={String(d['columns'] ?? 4)} options={[
        { value: '2', label: '2 columns' },
        { value: '3', label: '3 columns' },
        { value: '4', label: '4 columns' },
      ]} onChange={v => update({ columns: parseInt(v) })} />
    </div>
  )

  // ── statistics ───────────────────────────────────────────────────────────
  if (block.type === 'statistics') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="By the Numbers" onChange={v => update({ heading: v })} />
      <FieldSelect label="Columns" value={String(d['columns'] ?? 4)} options={[
        { value: '2', label: '2 columns' },
        { value: '3', label: '3 columns' },
        { value: '4', label: '4 columns' },
      ]} onChange={v => update({ columns: parseInt(v) })} />
    </div>
  )

  // ── products ─────────────────────────────────────────────────────────────
  if (block.type === 'products') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Featured Products" onChange={v => update({ heading: v })} />
      <FieldInput label="Items to show" value={String(d['limit'] ?? 6)} placeholder="6" onChange={v => update({ limit: parseInt(v) || 6 })} />
      <FieldSelect label="Columns" value={String(d['columns'] ?? 3)} options={[
        { value: '2', label: '2 columns' },
        { value: '3', label: '3 columns' },
        { value: '4', label: '4 columns' },
      ]} onChange={v => update({ columns: parseInt(v) })} />
    </div>
  )

  // ── collections ──────────────────────────────────────────────────────────
  if (block.type === 'collections') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Shop by Collection" onChange={v => update({ heading: v })} />
      <FieldInput label="Items to show" value={String(d['limit'] ?? 4)} placeholder="4" onChange={v => update({ limit: parseInt(v) || 4 })} />
      <FieldSelect label="Columns" value={String(d['columns'] ?? 2)} options={[
        { value: '2', label: '2 columns' },
        { value: '3', label: '3 columns' },
        { value: '4', label: '4 columns' },
      ]} onChange={v => update({ columns: parseInt(v) })} />
    </div>
  )

  // ── journal / story ──────────────────────────────────────────────────────
  if (block.type === 'journal' || block.type === 'story') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Latest Posts" onChange={v => update({ heading: v })} />
      <FieldInput label="Items to show" value={String(d['limit'] ?? 3)} placeholder="3" onChange={v => update({ limit: parseInt(v) || 3 })} />
      <FieldSelect label="Columns" value={String(d['columns'] ?? 3)} options={[
        { value: '1', label: '1 column' },
        { value: '2', label: '2 columns' },
        { value: '3', label: '3 columns' },
      ]} onChange={v => update({ columns: parseInt(v) })} />
    </div>
  )

  // ── contact_form ─────────────────────────────────────────────────────────
  if (block.type === 'contact_form') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Heading" value={d['heading'] as string} placeholder="Get in Touch" onChange={v => update({ heading: v })} />
      <FieldTextarea label="Description" value={d['description'] as string} placeholder="Optional description" onChange={v => update({ description: v })} />
      <FieldInput label="Submit button text" value={d['submitText'] as string} placeholder="Send Message" onChange={v => update({ submitText: v })} />
    </div>
  )

  // ── newsletter ───────────────────────────────────────────────────────────
  if (block.type === 'newsletter') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Heading" value={d['heading'] as string} placeholder="Stay in the Loop" onChange={v => update({ heading: v })} />
      <FieldTextarea label="Description" value={d['description'] as string} placeholder="Subscribe for updates" onChange={v => update({ description: v })} />
      <FieldInput label="Input placeholder" value={d['placeholder'] as string} placeholder="Enter your email" onChange={v => update({ placeholder: v })} />
      <FieldInput label="Button text" value={d['buttonText'] as string} placeholder="Subscribe" onChange={v => update({ buttonText: v })} />
    </div>
  )

  // ── map ──────────────────────────────────────────────────────────────────
  if (block.type === 'map') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Google Maps embed URL" value={d['src'] as string} placeholder="https://www.google.com/maps/embed?..." onChange={v => update({ src: v })} />
      <FieldInput label="Height (px)" value={String(d['height'] ?? 400)} placeholder="400" onChange={v => update({ height: parseInt(v) || 400 })} />
    </div>
  )

  // ── social_links ─────────────────────────────────────────────────────────
  if (block.type === 'social_links') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldSelect label="Size" value={d['size'] as string ?? 'md'} options={[
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
      ]} onChange={v => update({ size: v })} />
      <FieldSelect label="Alignment" value={d['align'] as string ?? 'center'} options={[
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ]} onChange={v => update({ align: v })} />
    </div>
  )

  // ── html ─────────────────────────────────────────────────────────────────
  if (block.type === 'html') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldTextarea label="HTML Code" value={d['html'] as string} placeholder="<!-- Custom HTML -->" onChange={v => update({ html: v })} />
    </div>
  )

  // ── spacer ───────────────────────────────────────────────────────────────
  if (block.type === 'spacer') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Height (px)" value={String(d['height'] ?? 48)} placeholder="48" onChange={v => update({ height: parseInt(v) || 0 })} />
    </div>
  )

  // ── divider ──────────────────────────────────────────────────────────────
  if (block.type === 'divider') return (
    <div style={{ padding: '4px 14px' }}>
      <FieldSelect label="Style" value={d['style'] as string ?? 'solid'} options={[
        { value: 'solid', label: 'Solid' },
        { value: 'dashed', label: 'Dashed' },
        { value: 'dotted', label: 'Dotted' },
        { value: 'double', label: 'Double' },
      ]} onChange={v => update({ style: v })} />
      <FieldSelect label="Width" value={d['width'] as string ?? 'full'} options={[
        { value: 'full', label: 'Full' },
        { value: 'wide', label: 'Wide' },
        { value: 'normal', label: 'Normal' },
      ]} onChange={v => update({ width: v })} />
    </div>
  )

  // ── template blocks (campaigns_grid, destinations_grid, etc.) ────────────
  if (['campaigns_grid', 'destinations_grid', 'experiences', 'portfolio', 'packages', 'booking'].includes(block.type)) return (
    <div style={{ padding: '4px 14px' }}>
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Section heading" onChange={v => update({ heading: v })} />
      <FieldTextarea label="Description" value={d['description'] as string} placeholder="Optional description" onChange={v => update({ description: v })} />
      {(block.type === 'campaigns_grid' || block.type === 'destinations_grid') && (
        <FieldInput label="Items to show" value={String(d['limit'] ?? 6)} placeholder="6" onChange={v => update({ limit: parseInt(v) || 6 })} />
      )}
    </div>
  )

  // ── fallback ─────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{
        padding: 10, borderRadius: 8,
        background: 'var(--cms-surface-3)',
        border: '1px solid var(--lito-border)',
      }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
          {block.type} block
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
          No editable fields for this block type.
        </p>
      </div>
    </div>
  )
}

// ── Style panel ───────────────────────────────────────────────────────────────

function StylePanel({ block }: { block: Block }) {
  const { updateStyles } = useEditorStore()
  const s = block.styles ?? {}
  const upd = (patch: Partial<BlockStyles>) => updateStyles(block.id, patch)

  return (
    <div style={{ padding: '4px 14px' }}>
      <div style={{ marginBottom: 12 }}>
        <Label>Background colour</Label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="color" value={s.backgroundColor ?? '#ffffff'}
            onChange={e => upd({ backgroundColor: e.target.value })}
            style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--lito-border)', cursor: 'pointer', padding: 2 }} />
          <input value={s.backgroundColor ?? ''} onChange={e => upd({ backgroundColor: e.target.value })}
            placeholder="transparent"
            style={{
              flex: 1, padding: '5px 8px',
              border: '1px solid var(--lito-border)', borderRadius: 6,
              fontFamily: 'var(--font-body)', fontSize: 12,
              color: 'var(--text-primary)', background: 'var(--cms-surface-2)', outline: 'none',
            }} />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <Label>Text colour</Label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="color" value={s.textColor ?? '#000000'}
            onChange={e => upd({ textColor: e.target.value })}
            style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--lito-border)', cursor: 'pointer', padding: 2 }} />
          <input value={s.textColor ?? ''} onChange={e => upd({ textColor: e.target.value })}
            placeholder="inherit"
            style={{
              flex: 1, padding: '5px 8px',
              border: '1px solid var(--lito-border)', borderRadius: 6,
              fontFamily: 'var(--font-body)', fontSize: 12,
              color: 'var(--text-primary)', background: 'var(--cms-surface-2)', outline: 'none',
            }} />
        </div>
      </div>
      <FieldSelect label="Text alignment" value={s.textAlign ?? ''} options={[
        { value: '', label: 'Default' },
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ]} onChange={v => upd({ textAlign: v as BlockStyles['textAlign'] })} />
      <FieldSelect label="Max width" value={s.maxWidth ?? 'full'} options={[
        { value: 'full', label: 'Full' },
        { value: 'xl',   label: 'XL (1280px)' },
        { value: 'lg',   label: 'Large (1024px)' },
        { value: 'md',   label: 'Medium (768px)' },
        { value: 'sm',   label: 'Small (640px)' },
      ]} onChange={v => upd({ maxWidth: v as BlockStyles['maxWidth'] })} />
      <FieldInput label="Border radius (px)" value={String(s.borderRadius ?? '')} placeholder="0"
        onChange={v => upd({ borderRadius: parseInt(v) || 0 })} />
      <FieldInput label="Custom CSS class" value={s.customCss ?? ''} placeholder="my-class"
        onChange={v => upd({ customCss: v })} />
    </div>
  )
}

// ── Spacing panel — matches screenshot exactly ────────────────────────────────

function SpacingPanel({ block }: { block: Block }) {
  const { updateStyles } = useEditorStore()
  const s = block.styles ?? {}
  const upd = (patch: Partial<BlockStyles>) => updateStyles(block.id, patch)
  const [activeDevice, setActiveDevice] = useState<'Desktop' | 'Tablet' | 'Mobile'>('Desktop')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const deviceTabs: Array<{ label: 'Desktop' | 'Tablet' | 'Mobile'; Icon: typeof Monitor }> = [
    { label: 'Desktop', Icon: Monitor },
    { label: 'Tablet',  Icon: Tablet },
    { label: 'Mobile',  Icon: Smartphone },
  ]

  return (
    <div>
      {/* Margin */}
      <SectionHead label="Margin" />
      <div style={{ padding: '0 14px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <PxInput label="Top"    value={s.marginTop}    onChange={v => upd({ marginTop: v })} />
          <PxInput label="Bottom" value={s.marginBottom} onChange={v => upd({ marginBottom: v })} />
        </div>
      </div>

      {/* Padding */}
      <SectionHead label="Padding" />
      <div style={{ padding: '0 14px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <PxInput label="Top"    value={s.paddingTop}    onChange={v => upd({ paddingTop: v })} />
          <PxInput label="Bottom" value={s.paddingBottom} onChange={v => upd({ paddingBottom: v })} />
          <PxInput label="Left"   value={s.paddingLeft}   onChange={v => upd({ paddingLeft: v })} />
          <PxInput label="Right"  value={s.paddingRight}  onChange={v => upd({ paddingRight: v })} />
        </div>
      </div>

      {/* Device switcher */}
      <div style={{
        display: 'flex', gap: 0, margin: '0 14px 12px',
        border: '1px solid var(--lito-border)',
        borderRadius: 8, overflow: 'hidden',
      }}>
        {deviceTabs.map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveDevice(label)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 4, padding: '6px 4px',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
              background: activeDevice === label ? 'var(--lito-teal)' : 'var(--cms-surface-3)',
              color: activeDevice === label ? '#fff' : 'var(--text-muted)',
              borderRight: label !== 'Mobile' ? '1px solid var(--lito-border)' : 'none',
              transition: 'background 120ms, color 120ms',
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Advanced collapsible */}
      <button
        type="button"
        onClick={() => setAdvancedOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px', border: 'none', background: 'none',
          cursor: 'pointer', borderTop: '1px solid var(--lito-border)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
          Advanced
        </span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transform: advancedOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 150ms',
          }}
        />
      </button>
      {advancedOpen && (
        <div style={{ padding: '4px 14px 12px' }}>
          <FieldInput
            label="Custom ID"
            value={s.customId ?? ''}
            placeholder="section-id"
            onChange={v => upd({ customId: v })}
          />
          <FieldInput
            label="CSS Class"
            value={s.customCss ?? ''}
            placeholder="custom-class"
            onChange={v => upd({ customCss: v })}
          />
        </div>
      )}
    </div>
  )
}

// ── SEO panel ─────────────────────────────────────────────────────────────────

function SEOPanel() {
  const { pageSeo, setPageSeo } = useEditorStore()
  return (
    <div style={{ padding: '4px 14px' }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', margin: '0 0 12px' }}>
        Page-level SEO metadata. Saved with the page on publish.
      </p>
      <FieldInput
        label="Meta title"
        value={pageSeo.metaTitle}
        placeholder="Leave blank to use page title"
        onChange={v => setPageSeo({ metaTitle: v })}
      />
      <FieldTextarea
        label="Meta description"
        value={pageSeo.metaDescription}
        placeholder="Leave blank to use page description"
        onChange={v => setPageSeo({ metaDescription: v })}
      />
    </div>
  )
}

// ── Visibility panel ──────────────────────────────────────────────────────────

function VisibilityPanel({ block }: { block: Block }) {
  const { updateVisibility } = useEditorStore()
  const v = block.visibility ?? { desktop: true, tablet: true, mobile: true }

  return (
    <div style={{ padding: '4px 14px' }}>
      {(['desktop', 'tablet', 'mobile'] as const).map((device) => {
        const isOn = v[device] !== false
        return (
          <div
            key={device}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: '1px solid var(--lito-border)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {device}
            </span>
            <div
              onClick={() => updateVisibility(block.id, { [device]: !isOn })}
              style={{
                width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
                background: isOn ? 'var(--lito-teal)' : 'var(--cms-surface-3)',
                border: '1px solid var(--lito-border)',
                position: 'relative', transition: 'background 150ms',
              }}
            >
              <div style={{
                position: 'absolute', top: 2, width: 14, height: 14, borderRadius: '50%',
                background: 'var(--cms-card-bg)', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                transition: 'left 150ms',
                left: isOn ? 'calc(100% - 16px)' : 2,
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS: Array<{ id: EditorTab; label: string }> = [
  { id: 'content',    label: 'Content' },
  { id: 'styles',     label: 'Style' },
  { id: 'spacing',    label: 'Spacing' },
  { id: 'seo',        label: 'SEO' },
  { id: 'visibility', label: 'Visibility' },
]

// ── Main component ────────────────────────────────────────────────────────────

export function EditorRightSidebar() {
  const { selectedBlock, activeEditorTab, setEditorTab } = useEditorStore()
  const block = selectedBlock()

  if (!block) {
    return (
      <div style={{
        width: 232, flexShrink: 0,
        background: 'var(--cms-surface-3)',
        borderLeft: '1px solid var(--lito-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            No block selected
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            Click a block in the canvas to edit it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: 232, flexShrink: 0,
      background: 'var(--cms-surface-3)',
      borderLeft: '1px solid var(--lito-border)',
      display: 'flex', flexDirection: 'column',
      height: '100%',
    }}>
      {/* Block header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        borderBottom: '1px solid var(--lito-border)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: 'var(--lito-teal)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Crown size={12} style={{ color: '#fff' }} />
        </div>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
          color: 'var(--text-primary)', textTransform: 'capitalize',
        }}>
          {block.type}
        </span>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 9,
          color: 'var(--text-muted)', fontVariant: 'monospace',
          marginLeft: 'auto', flexShrink: 0,
        }}>
          Block ID: {block.id.slice(0, 8)}
        </span>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--lito-border)',
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setEditorTab(tab.id)}
            style={{
              flex: 1, padding: '9px 2px',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
              background: 'transparent',
              color: activeEditorTab === tab.id ? 'var(--lito-teal)' : 'var(--text-muted)',
              borderBottom: activeEditorTab === tab.id ? '2px solid var(--lito-teal)' : '2px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'color 120ms',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {activeEditorTab === 'content'    && <ContentPanel    block={block} />}
        {activeEditorTab === 'styles'     && <StylePanel      block={block} />}
        {activeEditorTab === 'spacing'    && <SpacingPanel    block={block} />}
        {activeEditorTab === 'seo'        && <SEOPanel />}
        {activeEditorTab === 'visibility' && <VisibilityPanel block={block} />}
      </div>

      {/* Footer — Need help? / Keyboard shortcuts */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--lito-border)',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <button type="button" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}>
          <HelpCircle size={13} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
            Need help?
          </span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
            Keyboard shortcuts
          </span>
          <kbd style={{
            fontFamily: 'var(--font-body)', fontSize: 10,
            background: 'var(--lito-border)', color: 'var(--text-muted)',
            borderRadius: 4, padding: '2px 5px',
          }}>
            ⌘ /
          </kbd>
        </div>
      </div>
    </div>
  )
}
