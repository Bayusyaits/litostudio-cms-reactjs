/**
 * EditorRightSidebar — matches screenshot design exactly.
 * Header: block type icon + name + "Block ID: xxxxxx"
 * Tabs: Content | Style | Spacing | SEO | Visibility
 * Spacing tab: Margin/Padding with lock icon, 2×2 grid (Top/Bottom | Left/Right),
 *              device switcher, Advanced collapsible, footer (Need help? / Keyboard shortcuts)
 *
 * All inline style={{}} replaced with Tailwind classes.
 * CSS-var references use arbitrary-value syntax: text-[var(--name)], bg-[var(--name)] etc.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Lock, Monitor, Tablet, Smartphone, HelpCircle, ChevronDown, Crown, Plus, Trash2, History, RotateCcw, Loader2 } from 'lucide-react'
import { useEditorStore } from '@/stores/editor.store'
import { useWebsiteStore } from '@/stores/website.store'
import { cn } from '@/lib/utils'
import { FIELD_LIMITS } from '@/lib/fieldLimits'
import { ImageUploader } from '@/components/molecules/ImageUploader'
import { CodeEditor }    from '@/components/molecules/CodeEditor'
import { RichTextEditor } from '@/components/molecules/RichTextEditor'
import { DynamicContentPanel } from './DynamicContentPanel'
import { useTemplateManifest }  from '@/hooks/useTemplateManifest'
import { getCanvasTokens }      from './templateCanvasTokens'
import { pagesService } from '@/services/pages.service'
import type { PageRevision } from '@/services/pages.service'
import type { EditorTab, Block, BlockStyles } from '@/types/editor.types'

// ── Reusable form helpers ─────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-body text-[11px] font-medium text-[var(--text-secondary)] m-0 mb-1">
      {children}
    </p>
  )
}

function PxInput({
  label, value, onChange,
}: { label: string; value?: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="font-body text-[10px] text-[var(--text-muted)] m-0 mb-[3px]">
        {label}
      </p>
      <div className="flex items-center border border-[var(--lito-border)] rounded-md overflow-hidden">
        <input
          type="number"
          value={value ?? 0}
          min={0} max={999}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-full py-[5px] px-[6px] border-0 outline-none font-body text-[12px] text-[var(--cms-field-text)] bg-[var(--cms-surface-2)] transition-colors"
        />
        <span className="px-[6px] leading-7 font-body text-[11px] text-[var(--text-muted)] bg-[var(--cms-surface-2)] border-l border-[var(--lito-border)] shrink-0">
          px
        </span>
      </div>
    </div>
  )
}

function FieldInput({ label, value, placeholder, onChange, maxLength }: {
  label: string; value?: string; placeholder?: string; onChange: (v: string) => void; maxLength?: number
}) {
  const len = (value ?? '').length
  const showCounter = maxLength !== undefined
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-[3px]">
        <Label>{label}</Label>
        {showCounter && (
          <span className={cn(
            'font-body text-[10px] tabular-nums',
            len >= maxLength! ? 'text-[var(--s-danger)]'
              : len >= Math.floor(maxLength! * 0.9) ? 'text-[var(--lito-gold-deep)]'
              : 'text-[var(--text-faint)]',
          )}>
            {len}/{maxLength}
          </span>
        )}
      </div>
      <input
        value={value ?? ''}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-[6px] px-[10px] border border-[var(--lito-border)] rounded-md font-body text-[12px] text-[var(--cms-field-text)] bg-[var(--cms-surface-2)] outline-none box-border transition-colors placeholder:text-[var(--text-muted)]"
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
    <div className="mb-3">
      <Label>{label}</Label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-[6px] px-[10px] border border-[var(--lito-border)] rounded-md font-body text-[12px] text-[var(--cms-field-text)] bg-[var(--cms-surface-2)] outline-none appearance-auto transition-colors"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function FieldTextarea({ label, value, placeholder, onChange, maxLength, rows = 4 }: {
  label: string; value?: string; placeholder?: string; onChange: (v: string) => void; maxLength?: number; rows?: number
}) {
  const len = (value ?? '').length
  const showCounter = maxLength !== undefined
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-[3px]">
        <Label>{label}</Label>
        {showCounter && (
          <span className={cn(
            'font-body text-[10px] tabular-nums',
            len >= maxLength! ? 'text-[var(--s-danger)]'
              : len >= Math.floor(maxLength! * 0.9) ? 'text-[var(--lito-gold-deep)]'
              : 'text-[var(--text-faint)]',
          )}>
            {len}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        value={value ?? ''}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-[6px] px-[10px] border border-[var(--lito-border)] rounded-md font-body text-[12px] text-[var(--cms-field-text)] bg-[var(--cms-surface-2)] outline-none resize-y box-border transition-colors placeholder:text-[var(--text-muted)]"
      />
    </div>
  )
}

// ── Section header with lock icon ─────────────────────────────────────────────

function SectionHead({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between px-[14px] pt-[10px] pb-[6px]">
      <p className="font-body text-[12px] font-semibold text-[var(--text-primary)] m-0">
        {label}
      </p>
      <button type="button" className="bg-transparent border-0 cursor-pointer p-0">
        <Lock size={12} className="text-[var(--text-muted)]" />
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
    <div className="px-[14px] py-1">
      <FieldInput label="Text" value={d['text'] as string} placeholder="Heading text" onChange={v => update({ text: v })} maxLength={FIELD_LIMITS.TITLE} />
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
    <div className="px-[14px] py-2">
      <CodeEditor
        label="HTML Content"
        language="html"
        value={(d['html'] as string) ?? ''}
        placeholder="<p>Your text...</p>"
        minHeight={180}
        onChange={v => update({ html: v })}
      />
    </div>
  )

  // ── image ────────────────────────────────────────────────────────────────
  if (block.type === 'image') return (
    <div className="px-[14px] py-1">
      <div className="mb-3">
        <Label>Image</Label>
        <ImageUploader
          value={d['src'] as string | undefined}
          folder="blocks"
          onChange={url => update({ src: url ?? '' })}
        />
      </div>
      <FieldInput label="Alt text" value={d['alt'] as string} placeholder="Describe the image" onChange={v => update({ alt: v })} maxLength={FIELD_LIMITS.IMAGE_ALT} />
      <FieldInput label="Caption" value={d['caption'] as string} placeholder="Optional caption" onChange={v => update({ caption: v })} maxLength={200} />
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
      <div className="px-[14px] py-1">
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

        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Images ({images.length})</Label>
            <button
              type="button"
              onClick={() => updateImages([...images, { src: '', alt: '' }])}
              className="flex items-center gap-1 py-[3px] px-2 rounded-[5px] border border-[var(--lito-teal-fg)] bg-transparent cursor-pointer font-body text-[11px] text-[var(--lito-teal-fg)]"
            >
              <Plus size={11} /> Add
            </button>
          </div>

          {images.length === 0 && (
            <p className="font-body text-[11px] text-[var(--text-muted)] m-0">
              No images yet. Click Add to start.
            </p>
          )}

          {images.map((img, idx) => (
            <div key={idx} className="p-2 mb-2 border border-[var(--lito-border)] rounded-lg bg-[var(--cms-surface-2)]">
              <div className="flex items-center justify-between mb-[6px]">
                <span className="font-body text-[11px] text-[var(--text-muted)]">
                  Image {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => updateImages(images.filter((_, i) => i !== idx))}
                  className="bg-transparent border-0 cursor-pointer p-[2px]"
                >
                  <Trash2 size={12} className="text-[var(--lito-danger,#f87171)]" />
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
              <div className="mt-[6px]">
                <input
                  value={img.alt}
                  placeholder="Alt text"
                  maxLength={FIELD_LIMITS.IMAGE_ALT}
                  onChange={e => {
                    const next = [...images]
                    next[idx] = { ...next[idx], alt: e.target.value }
                    updateImages(next)
                  }}
                  className="w-full py-1 px-2 border border-[var(--lito-border)] rounded-[5px] font-body text-[11px] text-[var(--text-primary)] bg-[var(--cms-card-bg)] outline-none box-border"
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
    <div className="px-[14px] py-1">
      <FieldInput label="Video URL" value={d['url'] as string} placeholder="YouTube or Vimeo URL" onChange={v => update({ url: v })} />
      <FieldInput label="Caption" value={d['caption'] as string} placeholder="Optional caption" onChange={v => update({ caption: v })} maxLength={200} />
    </div>
  )

  // ── button ───────────────────────────────────────────────────────────────
  if (block.type === 'button') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Button text" value={d['text'] as string} placeholder="Click here" onChange={v => update({ text: v })} maxLength={FIELD_LIMITS.BUTTON_TEXT} />
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
    <div className="px-[14px] py-1">
      <FieldInput label="Eyebrow Label" value={d['eyebrow'] as string ?? ''} placeholder="EDITORIAL · JAKARTA" onChange={v => update({ eyebrow: v })} maxLength={FIELD_LIMITS.CTA_LABEL} />
      <FieldInput label="Title" value={d['title'] as string} placeholder="Your headline" onChange={v => update({ title: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
      <FieldInput label="Title (Italic)" value={d['titleItalic'] as string ?? ''} placeholder="italic portion" onChange={v => update({ titleItalic: v })} maxLength={80} />
      <FieldInput label="Subtitle" value={d['subtitle'] as string ?? ''} placeholder="Supporting text" onChange={v => update({ subtitle: v })} maxLength={FIELD_LIMITS.HERO_SUBTITLE} />
      <FieldInput label="CTA text" value={d['ctaText'] as string ?? ''} placeholder="Get Started" onChange={v => update({ ctaText: v })} maxLength={FIELD_LIMITS.CTA_LABEL} />
      <FieldInput label="CTA URL" value={d['ctaUrl'] as string ?? ''} placeholder="#" onChange={v => update({ ctaUrl: v })} />
      <FieldInput label="Secondary CTA text" value={d['ctaSecondaryText'] as string ?? ''} placeholder="Learn More" onChange={v => update({ ctaSecondaryText: v })} maxLength={FIELD_LIMITS.CTA_LABEL} />
      <FieldInput label="Secondary CTA URL" value={d['ctaSecondaryUrl'] as string ?? ''} placeholder="#" onChange={v => update({ ctaSecondaryUrl: v })} />
      <FieldInput label="Stat Label" value={d['stat'] as string ?? ''} placeholder="500+ sesi" onChange={v => update({ stat: v })} maxLength={50} />
      <FieldInput label="Location" value={d['location'] as string ?? ''} placeholder="Jakarta · Yogyakarta" onChange={v => update({ location: v })} maxLength={FIELD_LIMITS.LOCATION} />
      <div className="mb-3">
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
    <div className="px-[14px] py-1">
      <FieldInput label="Title" value={d['title'] as string} placeholder="Call to action title" onChange={v => update({ title: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
      <FieldTextarea label="Description" value={d['description'] as string} placeholder="Supporting description" onChange={v => update({ description: v })} maxLength={FIELD_LIMITS.DESCRIPTION} rows={3} />
      <FieldInput label="Button text" value={d['buttonText'] as string} placeholder="Get Started" onChange={v => update({ buttonText: v })} maxLength={FIELD_LIMITS.BUTTON_TEXT} />
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
    <div className="px-[14px] py-1">
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Our Services" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
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
    <div className="px-[14px] py-1">
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Pricing" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
    </div>
  )

  // ── testimonials ─────────────────────────────────────────────────────────
  if (block.type === 'testimonials') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="What our clients say" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
      <FieldSelect label="Layout" value={d['layout'] as string ?? 'grid'} options={[
        { value: 'grid', label: 'Grid' },
        { value: 'list', label: 'List' },
      ]} onChange={v => update({ layout: v })} />
    </div>
  )

  // ── faq ──────────────────────────────────────────────────────────────────
  if (block.type === 'faq') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Frequently Asked Questions" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
    </div>
  )

  // ── team ─────────────────────────────────────────────────────────────────
  if (block.type === 'team') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Meet the Team" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
      <FieldSelect label="Columns" value={String(d['columns'] ?? 4)} options={[
        { value: '2', label: '2 columns' },
        { value: '3', label: '3 columns' },
        { value: '4', label: '4 columns' },
      ]} onChange={v => update({ columns: parseInt(v) })} />
    </div>
  )

  // ── statistics ───────────────────────────────────────────────────────────
  if (block.type === 'statistics') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="By the Numbers" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
      <FieldSelect label="Columns" value={String(d['columns'] ?? 4)} options={[
        { value: '2', label: '2 columns' },
        { value: '3', label: '3 columns' },
        { value: '4', label: '4 columns' },
      ]} onChange={v => update({ columns: parseInt(v) })} />
    </div>
  )

  // ── products ─────────────────────────────────────────────────────────────
  if (block.type === 'products') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Featured Products" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
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
    <div className="px-[14px] py-1">
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Shop by Collection" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
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
    <div className="px-[14px] py-1">
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Latest Posts" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
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
    <div className="px-[14px] py-1">
      <FieldInput label="Heading" value={d['heading'] as string} placeholder="Get in Touch" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
      <FieldTextarea label="Description" value={d['description'] as string} placeholder="Optional description" onChange={v => update({ description: v })} maxLength={FIELD_LIMITS.DESCRIPTION} rows={3} />
      <FieldInput label="Submit button text" value={d['submitText'] as string} placeholder="Send Message" onChange={v => update({ submitText: v })} maxLength={FIELD_LIMITS.BUTTON_TEXT} />
    </div>
  )

  // ── newsletter ───────────────────────────────────────────────────────────
  if (block.type === 'newsletter') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Heading" value={d['heading'] as string} placeholder="Stay in the Loop" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
      <FieldTextarea label="Description" value={d['description'] as string} placeholder="Subscribe for updates" onChange={v => update({ description: v })} maxLength={FIELD_LIMITS.DESCRIPTION} rows={3} />
      <FieldInput label="Input placeholder" value={d['placeholder'] as string} placeholder="Enter your email" onChange={v => update({ placeholder: v })} maxLength={80} />
      <FieldInput label="Button text" value={d['buttonText'] as string} placeholder="Subscribe" onChange={v => update({ buttonText: v })} maxLength={FIELD_LIMITS.BUTTON_TEXT} />
    </div>
  )

  // ── map ──────────────────────────────────────────────────────────────────
  if (block.type === 'map') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Google Maps embed URL" value={d['src'] as string} placeholder="https://www.google.com/maps/embed?..." onChange={v => update({ src: v })} />
      <FieldInput label="Height (px)" value={String(d['height'] ?? 400)} placeholder="400" onChange={v => update({ height: parseInt(v) || 400 })} />
    </div>
  )

  // ── social_links ─────────────────────────────────────────────────────────
  if (block.type === 'social_links') return (
    <div className="px-[14px] py-1">
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
    <div className="px-[14px] py-2">
      <CodeEditor
        label="HTML Code"
        language="html"
        value={(d['html'] as string) ?? ''}
        placeholder="<!-- Custom HTML -->"
        minHeight={220}
        onChange={v => update({ html: v })}
      />
    </div>
  )

  // ── spacer ───────────────────────────────────────────────────────────────
  if (block.type === 'spacer') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Height (px)" value={String(d['height'] ?? 48)} placeholder="48" onChange={v => update({ height: parseInt(v) || 0 })} />
    </div>
  )

  // ── divider ──────────────────────────────────────────────────────────────
  if (block.type === 'divider') return (
    <div className="px-[14px] py-1">
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

  // ── template blocks (campaigns_grid, portfolio, packages, booking) ────────
  if (['campaigns_grid', 'destinations_grid', 'portfolio', 'packages', 'booking'].includes(block.type)) return (
    <div className="px-[14px] py-1">
      <FieldInput label="Section heading" value={d['heading'] as string} placeholder="Section heading" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
      <FieldTextarea label="Description" value={d['description'] as string} placeholder="Optional description" onChange={v => update({ description: v })} maxLength={FIELD_LIMITS.DESCRIPTION} rows={3} />
      {block.type === 'campaigns_grid' && (
        <FieldInput label="Items to show" value={String(d['limit'] ?? 6)} placeholder="6" onChange={v => update({ limit: parseInt(v) || 6 })} />
      )}
    </div>
  )

  // ── page_hero (fashion full-width hero for inner pages) ───────────────────
  if (block.type === 'page_hero') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Eyebrow" value={d['eyebrow'] as string ?? ''} placeholder="Contact Us" onChange={v => update({ eyebrow: v })} maxLength={FIELD_LIMITS.CTA_LABEL} />
      <FieldInput label="Title" value={d['title'] as string ?? ''} placeholder="Get in Touch" onChange={v => update({ title: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
      <FieldTextarea label="Description" value={(d['desc'] ?? d['description']) as string ?? ''} placeholder="Supporting text" onChange={v => update({ desc: v, description: v })} maxLength={FIELD_LIMITS.DESCRIPTION} rows={3} />
      <div className="mb-3">
        <Label>Background image</Label>
        <ImageUploader
          value={(d['imgSrc'] ?? d['backgroundImage']) as string | undefined}
          folder="blocks/page-hero"
          onChange={url => update({ imgSrc: url ?? '', backgroundImage: url ?? '' })}
        />
      </div>
      <FieldInput label="Image alt text" value={(d['imgAlt'] ?? d['alt']) as string ?? ''} placeholder="Hero image" onChange={v => update({ imgAlt: v, alt: v })} maxLength={FIELD_LIMITS.IMAGE_ALT} />
    </div>
  )

  // ── contact_cards (address / phone / email cards) ─────────────────────────
  if (block.type === 'contact_cards') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Heading" value={d['heading'] as string ?? ''} placeholder="Find Us" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
      <p className="font-body text-[10px] text-[var(--text-muted)] m-0 mb-2">
        Contact details (address, phone, email) are loaded from Site Settings → Footer.
      </p>
    </div>
  )

  // ── contact_cta (closing CTA strip) ──────────────────────────────────────
  if (block.type === 'contact_cta') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Eyebrow" value={d['eyebrow'] as string ?? ''} placeholder="Stay Connected" onChange={v => update({ eyebrow: v })} maxLength={FIELD_LIMITS.CTA_LABEL} />
      <FieldInput label="Title" value={d['title'] as string ?? ''} placeholder="Follow Our Journey" onChange={v => update({ title: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
      <FieldTextarea label="Description" value={(d['desc'] ?? d['description']) as string ?? ''} placeholder="Supporting text" onChange={v => update({ desc: v, description: v })} maxLength={FIELD_LIMITS.DESCRIPTION} rows={3} />
      <FieldInput label="Primary CTA text" value={d['ctaText'] as string ?? ''} placeholder="Shop Now" onChange={v => update({ ctaText: v })} maxLength={FIELD_LIMITS.CTA_LABEL} />
      <FieldInput label="Primary CTA URL" value={(d['ctaLink'] ?? d['ctaUrl']) as string ?? ''} placeholder="/catalogue" onChange={v => update({ ctaLink: v, ctaUrl: v })} />
      <FieldInput label="Secondary CTA text" value={d['homeText'] as string ?? ''} placeholder="Back to Home" onChange={v => update({ homeText: v })} maxLength={FIELD_LIMITS.CTA_LABEL} />
      <FieldInput label="Secondary CTA URL" value={d['homeLink'] as string ?? ''} placeholder="/" onChange={v => update({ homeLink: v })} />
    </div>
  )

  // ── contact (generic contact form + info section, all templates) ──────────
  if (block.type === 'contact') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Heading" value={d['heading'] as string ?? ''} placeholder="Get in Touch" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
      <FieldTextarea label="Description" value={d['description'] as string ?? ''} placeholder="Optional description" onChange={v => update({ description: v })} maxLength={FIELD_LIMITS.DESCRIPTION} rows={3} />
      <FieldInput label="Submit button text" value={(d['submitText'] ?? d['buttonText']) as string ?? ''} placeholder="Send Message" onChange={v => update({ submitText: v, buttonText: v })} maxLength={FIELD_LIMITS.BUTTON_TEXT} />
    </div>
  )

  // ── about / brand_story (generic about section, all templates) ───────────
  if (block.type === 'about' || block.type === 'brand_story') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Heading" value={(d['heading'] ?? d['title']) as string ?? ''} placeholder="Our Story" onChange={v => update({ heading: v, title: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
      <div className="mb-3">
        <Label>Description</Label>
        <RichTextEditor
          value={(d['description'] ?? d['subtitle']) as string ?? ''}
          placeholder="Your brand story"
          minHeight={140}
          ariaLabel="About description"
          onChange={html => update({ description: html, subtitle: html })}
        />
      </div>
      <FieldInput label="Since (year)" value={d['since'] as string ?? ''} placeholder="2019" onChange={v => update({ since: v })} maxLength={4} />
      <FieldInput label="Cities" value={d['cities'] as string ?? ''} placeholder="Jakarta, Bali, Surabaya" onChange={v => update({ cities: v })} maxLength={FIELD_LIMITS.LOCATION} />
      <div className="mb-3">
        <Label>Image</Label>
        <ImageUploader
          value={d['image'] as string | undefined}
          folder="blocks/about"
          onChange={url => update({ image: url ?? '' })}
        />
      </div>
      <FieldInput label="CTA text" value={d['ctaText'] as string ?? ''} placeholder="Learn More" onChange={v => update({ ctaText: v })} maxLength={FIELD_LIMITS.CTA_LABEL} />
      <FieldInput label="CTA URL" value={d['ctaUrl'] as string ?? ''} placeholder="/about" onChange={v => update({ ctaUrl: v })} />
    </div>
  )

  // ── social_grid (social feed / Instagram grid) ────────────────────────────
  if (block.type === 'social_grid') return (
    <div className="px-[14px] py-1">
      <FieldInput label="Heading" value={d['heading'] as string ?? ''} placeholder="Follow Us" onChange={v => update({ heading: v })} maxLength={FIELD_LIMITS.HERO_TITLE} />
      <p className="font-body text-[10px] text-[var(--text-muted)] m-0 mb-2">
        Social links are loaded from Site Settings → Footer.
      </p>
    </div>
  )

  // ── rich_text (standalone rich text block) ────────────────────────────────
  if (block.type === 'rich_text') return (
    <div className="px-[14px] py-2">
      <p className="font-body text-[10px] text-[var(--text-muted)] m-0 mb-2">
        Rich text content is edited directly in the canvas editor. Use the toolbar above the block.
      </p>
    </div>
  )

  // ── marquee (scrolling text strip) ───────────────────────────────────────
  // items:string[] — one item per line in textarea. Matches what MarqueeSection.vue reads.
  if (block.type === 'marquee') return (
    <div className="px-[14px] py-1">
      <div className="mb-3">
        <Label>Items (one per line)</Label>
        <textarea
          value={((d['items'] as string[] | undefined) ?? []).join('\n')}
          placeholder={'New Arrivals\nFree Shipping\nSustainable Fashion\nShop Now'}
          rows={4}
          onChange={e => {
            const items = e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
            update({ items })
          }}
          className="w-full py-[6px] px-[10px] border border-[var(--lito-border)] rounded-md font-body text-[12px] text-[var(--cms-field-text)] bg-[var(--cms-surface-2)] outline-none resize-y box-border transition-colors placeholder:text-[var(--text-muted)]"
        />
        <p className="font-body text-[10px] text-[var(--text-muted)] m-0 mt-1">
          Each line = one marquee item. Displayed in scrolling loop.
        </p>
      </div>
    </div>
  )

  // ── fallback ─────────────────────────────────────────────────────────────
  return (
    <div className="px-[14px] py-3">
      <div className="p-[10px] rounded-lg bg-[var(--cms-surface-3)] border border-[var(--lito-border)]">
        <p className="font-body text-[12px] font-semibold text-[var(--text-primary)] m-0 mb-1">
          {block.type} block
        </p>
        <p className="font-body text-[11px] text-[var(--text-muted)] m-0">
          No editable fields for this block type.
        </p>
      </div>
    </div>
  )
}

// ── Template palette chips ────────────────────────────────────────────────────

function TemplatePalette({ onPick }: { onPick: (color: string) => void }) {
  const { activeSite } = useWebsiteStore()
  const settings       = activeSite?.settings as Record<string, unknown> | null | undefined
  const templateSlug   = (settings?.template_slug as string | undefined) ?? 'lito'
  const tokens         = getCanvasTokens(templateSlug)

  const palette = [
    { label: 'Primary',   color: tokens['--lito-teal']   },
    { label: 'Accent',    color: tokens['--lito-gold']   },
    { label: 'Deep',      color: tokens['--lito-gold-deep'] },
    { label: 'Surface',   color: tokens['--cms-card-bg'] },
    { label: 'Text',      color: tokens['--text-primary'] },
    { label: 'Muted',     color: tokens['--text-muted']  },
  ]

  return (
    <div className="mb-3">
      <Label>Template palette</Label>
      <div className="flex gap-[6px] flex-wrap">
        {palette.map(({ label, color }) => (
          <button
            key={label}
            type="button"
            title={`${label}: ${color}`}
            onClick={() => onPick(color)}
            style={{ background: color }}
            className="w-6 h-6 rounded-md border-[1.5px] border-[var(--lito-border)] cursor-pointer p-0 shrink-0"
          />
        ))}
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
    <div className="px-[14px] py-1">
      {/* Template palette — quick-pick colours from the active template */}
      <TemplatePalette onPick={(color) => upd({ backgroundColor: color })} />

      <div className="mb-3">
        <Label>Background colour</Label>
        <div className="flex gap-2 items-center">
          <input type="color" value={s.backgroundColor ?? '#ffffff'}
            onChange={e => upd({ backgroundColor: e.target.value })}
            className="w-8 h-8 rounded-md border border-[var(--lito-border)] cursor-pointer p-[2px]" />
          <input value={s.backgroundColor ?? ''} onChange={e => upd({ backgroundColor: e.target.value })}
            placeholder="transparent"
            className="flex-1 py-[5px] px-2 border border-[var(--lito-border)] rounded-md font-body text-[12px] text-[var(--cms-field-text)] bg-[var(--cms-surface-2)] outline-none" />
        </div>
      </div>
      <div className="mb-3">
        <Label>Text colour</Label>
        <div className="flex gap-2 items-center">
          <input type="color" value={s.textColor ?? '#000000'}
            onChange={e => upd({ textColor: e.target.value })}
            className="w-8 h-8 rounded-md border border-[var(--lito-border)] cursor-pointer p-[2px]" />
          <input value={s.textColor ?? ''} onChange={e => upd({ textColor: e.target.value })}
            placeholder="inherit"
            className="flex-1 py-[5px] px-2 border border-[var(--lito-border)] rounded-md font-body text-[12px] text-[var(--cms-field-text)] bg-[var(--cms-surface-2)] outline-none" />
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

// ── Spacing panel ─────────────────────────────────────────────────────────────

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
      <div className="px-[14px] pb-2">
        <div className="grid grid-cols-2 gap-2">
          <PxInput label="Top"    value={s.marginTop}    onChange={v => upd({ marginTop: v })} />
          <PxInput label="Bottom" value={s.marginBottom} onChange={v => upd({ marginBottom: v })} />
        </div>
      </div>

      {/* Padding */}
      <SectionHead label="Padding" />
      <div className="px-[14px] pb-3">
        <div className="grid grid-cols-2 gap-2">
          <PxInput label="Top"    value={s.paddingTop}    onChange={v => upd({ paddingTop: v })} />
          <PxInput label="Bottom" value={s.paddingBottom} onChange={v => upd({ paddingBottom: v })} />
          <PxInput label="Left"   value={s.paddingLeft}   onChange={v => upd({ paddingLeft: v })} />
          <PxInput label="Right"  value={s.paddingRight}  onChange={v => upd({ paddingRight: v })} />
        </div>
      </div>

      {/* Device switcher */}
      <div className="flex mx-[14px] mb-3 border border-[var(--lito-border)] rounded-lg overflow-hidden">
        {deviceTabs.map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveDevice(label)}
            className={`flex-1 flex items-center justify-center gap-1 py-[6px] px-1 border-0 cursor-pointer font-body text-[11px] font-medium transition-[background,color] duration-[120ms] ${label !== 'Mobile' ? 'border-r border-[var(--lito-border)]' : ''} ${activeDevice === label ? 'bg-[var(--lito-teal)] text-white' : 'bg-[var(--cms-surface-3)] text-[var(--text-muted)]'}`}
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
        className="w-full flex items-center justify-between px-[14px] py-[10px] border-0 border-t border-[var(--lito-border)] bg-transparent cursor-pointer"
      >
        <span className="font-body text-[12px] font-semibold text-[var(--text-primary)]">
          Advanced
        </span>
        <ChevronDown
          size={14}
          className={`text-[var(--text-muted)] transition-transform duration-150 ${advancedOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {advancedOpen && (
        <div className="px-[14px] pb-3 pt-1">
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
    <div className="px-[14px] py-1">
      <p className="font-body text-[11px] text-[var(--text-muted)] m-0 mb-3">
        Page-level SEO metadata. Saved with the page on publish.
      </p>
      <FieldInput
        label="Meta title"
        value={pageSeo.metaTitle}
        placeholder="Leave blank to use page title"
        maxLength={FIELD_LIMITS.META_TITLE}
        onChange={v => setPageSeo({ metaTitle: v })}
      />
      <FieldTextarea
        label="Meta description"
        value={pageSeo.metaDescription}
        placeholder="Leave blank to use page description"
        maxLength={FIELD_LIMITS.META_DESCRIPTION}
        rows={3}
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
    <div className="px-[14px] py-1">
      {(['desktop', 'tablet', 'mobile'] as const).map((device) => {
        const isOn = v[device] !== false
        return (
          <div
            key={device}
            className="flex items-center justify-between py-2 border-b border-[var(--lito-border)]"
          >
            <span className="font-body text-[13px] text-[var(--text-primary)] capitalize">
              {device}
            </span>
            {/* Toggle switch */}
            <div
              role="switch"
              aria-checked={isOn}
              onClick={() => updateVisibility(block.id, { [device]: !isOn })}
              className={`relative w-9 h-5 rounded-[10px] cursor-pointer border border-[var(--lito-border)] transition-[background] duration-150 ${isOn ? 'bg-[var(--lito-teal)]' : 'bg-[var(--cms-surface-3)]'}`}
            >
              <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-[var(--cms-card-bg)] shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-[left] duration-150 ${isOn ? 'left-[calc(100%-16px)]' : 'left-[2px]'}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Animation panel ───────────────────────────────────────────────────────────

const ANIMATION_TYPES = [
  { value: '',          label: 'None'     },
  { value: 'fade-in',   label: 'Fade In'  },
  { value: 'slide-up',  label: 'Slide Up' },
  { value: 'slide-down',label: 'Slide Down'},
  { value: 'slide-left',label: 'Slide Left'},
  { value: 'zoom-in',   label: 'Zoom In'  },
  { value: 'bounce',    label: 'Bounce'   },
]

// Shared classes for the row layout and select inputs in AnimationPanel
const ROW_CLS   = 'flex items-center justify-between mb-[10px]'
const SEL_CLS   = 'flex-1 py-[5px] px-2 border border-[var(--lito-border)] rounded-md bg-[var(--cms-surface-2)] font-body text-[12px] text-[var(--text-primary)] outline-none'

function AnimationPanel({ block }: { block: Block }) {
  const { updateAnimation } = useEditorStore()
  const anim = block.animation ?? {}

  const patch = (p: Partial<NonNullable<Block['animation']>>) =>
    updateAnimation(block.id, { ...anim, ...p })

  return (
    <div className="p-[14px]">
      <p className="font-body text-[10px] font-bold tracking-[0.06em] text-[var(--text-muted)] m-0 mb-3 uppercase">
        Entrance Animation
      </p>

      {/* Effect */}
      <div className={ROW_CLS}>
        <Label>Effect</Label>
        <select
          value={anim.type ?? ''}
          onChange={(e) => patch({ type: e.target.value || undefined })}
          className={SEL_CLS}
        >
          {ANIMATION_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {anim.type && (
        <>
          {/* Duration */}
          <div className={ROW_CLS}>
            <Label>Duration (ms)</Label>
            <input
              type="number" min={100} max={3000} step={50}
              value={anim.duration ?? 400}
              onChange={(e) => patch({ duration: parseInt(e.target.value) || 400 })}
              className={`${SEL_CLS} max-w-[90px] text-right`}
            />
          </div>

          {/* Delay */}
          <div className={ROW_CLS}>
            <Label>Delay (ms)</Label>
            <input
              type="number" min={0} max={3000} step={50}
              value={anim.delay ?? 0}
              onChange={(e) => patch({ delay: parseInt(e.target.value) || 0 })}
              className={`${SEL_CLS} max-w-[90px] text-right`}
            />
          </div>

          {/* Preview hint */}
          <p className="font-body text-[10px] text-[var(--text-muted)] mt-2 mb-0 py-[6px] px-2 rounded-md bg-[var(--cms-surface-3)] border border-[var(--lito-border)]">
            Animation applied on page load. Preview in the live site.
          </p>
        </>
      )}
    </div>
  )
}

// ── History panel ─────────────────────────────────────────────────────────────

function HistoryPanel({ pageId }: { pageId: string | undefined }) {
  const [revisions,  setRevisions]  = useState<PageRevision[]>([])
  const [loading,    setLoading]    = useState(false)
  const [restoring,  setRestoring]  = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [restoredId, setRestoredId] = useState<string | null>(null)

  const loadRevisions = useCallback(async () => {
    if (!pageId) return
    setLoading(true)
    setError(null)
    try {
      const data = await pagesService.getRevisions(pageId, 'id', 10)
      setRevisions(data)
    } catch {
      setError('Could not load revision history.')
    } finally {
      setLoading(false)
    }
  }, [pageId])

  useEffect(() => {
    void loadRevisions()
  }, [loadRevisions])

  const handleRestore = async (rev: PageRevision) => {
    if (!pageId) return
    setRestoring(rev.id)
    setError(null)
    try {
      await pagesService.restoreRevision(pageId, rev.id, 'id')
      setRestoredId(rev.id)
      // Prompt user to reload the editor to pick up restored draft
    } catch {
      setError('Restore failed. Please try again.')
    } finally {
      setRestoring(null)
    }
  }

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (!pageId) {
    return (
      <div className="px-[14px] py-3">
        <p className="font-body text-[11px] text-[var(--text-muted)] m-0">
          Save the page first to enable revision history.
        </p>
      </div>
    )
  }

  return (
    <div className="px-[14px] py-2">
      <div className="flex items-center justify-between mb-3">
        <p className="font-body text-[11px] text-[var(--text-muted)] m-0">
          Last 10 published snapshots.
        </p>
        <button
          type="button"
          onClick={() => void loadRevisions()}
          className="bg-transparent border-0 cursor-pointer p-1 text-[var(--text-muted)] hover:text-[var(--lito-teal-fg)]"
          title="Refresh"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4 justify-center">
          <Loader2 size={14} className="animate-spin text-[var(--lito-teal-fg)]" />
          <span className="font-body text-[11px] text-[var(--text-muted)]">Loading…</span>
        </div>
      )}

      {error && (
        <p className="font-body text-[11px] text-[var(--lito-danger,#f87171)] m-0 mb-2">{error}</p>
      )}

      {restoredId && (
        <div className="mb-3 p-2 rounded-md bg-[var(--lito-teal-subtle)] border border-[var(--lito-teal-fg)] border-opacity-40">
          <p className="font-body text-[11px] text-[var(--lito-teal-fg)] m-0 font-semibold mb-[3px]">
            ✓ Version restored to draft.
          </p>
          <p className="font-body text-[11px] text-[var(--lito-teal-fg)] m-0 opacity-80">
            Click <strong>Publish</strong> to make it live.
          </p>
        </div>
      )}

      {!loading && revisions.length === 0 && !error && (
        <div className="py-4 text-center">
          <History size={20} className="text-[var(--text-muted)] mx-auto mb-2 opacity-40" />
          <p className="font-body text-[11px] text-[var(--text-muted)] m-0">
            No revisions yet. Publish the page to create the first snapshot.
          </p>
        </div>
      )}

      {revisions.map((rev) => (
        <div
          key={rev.id}
          className={`mb-2 p-[10px] rounded-lg border transition-[border-color] ${
            restoredId === rev.id
              ? 'border-[var(--lito-teal-fg)] bg-[var(--cms-surface-2)]'
              : 'border-[var(--lito-border)] bg-[var(--cms-surface-2)]'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[5px]">
                <span className="font-body text-[10px] font-bold text-[var(--lito-teal-fg)]">
                  v{rev.version}
                </span>
                {rev.label && (
                  <span className="font-body text-[10px] text-[var(--text-primary)] truncate">
                    {rev.label}
                  </span>
                )}
                <span className={`ml-auto shrink-0 inline-block px-[5px] py-[1px] rounded-full font-body text-[9px] font-semibold uppercase ${
                  rev.status === 'published'
                    ? 'bg-[var(--lito-teal-subtle)] text-[var(--lito-teal-fg)]'
                    : 'bg-[var(--lito-border)] text-[var(--text-muted)]'
                }`}>
                  {rev.status}
                </span>
              </div>
              <p className="font-body text-[9px] text-[var(--text-muted)] m-0 mt-[2px]">
                {fmtDate(rev.created_at)}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={restoring === rev.id}
            onClick={() => void handleRestore(rev)}
            className="w-full mt-[6px] py-[4px] px-2 rounded-[5px] border border-[var(--lito-border)] bg-transparent cursor-pointer font-body text-[10px] text-[var(--text-muted)] hover:border-[var(--lito-teal-fg)] hover:text-[var(--lito-teal-fg)] flex items-center justify-center gap-1 transition-[color,border-color] disabled:opacity-50"
          >
            {restoring === rev.id
              ? <><Loader2 size={10} className="animate-spin" /> Restoring…</>
              : <><RotateCcw size={10} /> Restore this version</>
            }
          </button>
        </div>
      ))}
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
  { id: 'animation',  label: 'Motion' },
  { id: 'history',    label: 'History' },
]

// ── Content tab router ────────────────────────────────────────────────────────

function ContentTabRouter({ block }: { block: Block }) {
  const { manifest } = useTemplateManifest()
  const hasManifestSection = manifest?.sections.some((s) => s.id === block.type) ?? false
  if (hasManifestSection) return <DynamicContentPanel block={block} />
  return <ContentPanel block={block} />
}

// ── Main component ────────────────────────────────────────────────────────────

export function EditorRightSidebar() {
  const { selectedBlock, blockDoc, activeEditorTab, setEditorTab, pageId, justAddedBlockId, clearJustAdded } = useEditorStore()
  const block = selectedBlock()

  // Persist the last non-null block to prevent "No block selected" flash during
  // focus transitions (e.g. clicking into CKEditor or other sidebar inputs).
  // Only show the empty state when the last known block is truly gone from blockDoc.
  const lastBlockRef = useRef<typeof block>(null)
  if (block) lastBlockRef.current = block
  const lastBlockStillExists = lastBlockRef.current
    ? blockDoc.blocks.some((b) => b.id === lastBlockRef.current!.id)
    : false
  const displayBlock = block ?? (lastBlockStillExists ? lastBlockRef.current : null)

  // Auto-focus the first text input when a new block is freshly added
  const contentPanelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!justAddedBlockId || !displayBlock || justAddedBlockId !== displayBlock.id) return
    // Small delay so the panel has finished rendering its inputs
    const id = setTimeout(() => {
      const panel = contentPanelRef.current
      if (!panel) return
      const first = panel.querySelector<HTMLElement>(
        'input[type="text"], input:not([type]), textarea'
      )
      first?.focus()
      clearJustAdded()
    }, 60)
    return () => clearTimeout(id)
  }, [justAddedBlockId, displayBlock, clearJustAdded])

  if (!displayBlock) {
    return (
      <div className="w-[232px] shrink-0 bg-[var(--cms-surface-3)] border-l border-[var(--lito-border)] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="font-body text-[12px] font-semibold text-[var(--text-primary)] m-0 mb-1">
            No block selected
          </p>
          <p className="font-body text-[11px] text-[var(--text-muted)] m-0">
            Click a block in the canvas to edit it.
          </p>
        </div>
      </div>
    )
  }
  // Alias so the rest of the component uses the stable display block
  const stableBlock = displayBlock

  return (
    <div className="w-[232px] shrink-0 bg-[var(--cms-surface-3)] border-l border-[var(--lito-border)] flex flex-col h-full">
      {/* Block header */}
      <div className="flex items-center gap-2 px-[14px] py-[10px] border-b border-[var(--lito-border)] shrink-0">
        <div className="w-6 h-6 rounded-md bg-[var(--lito-teal)] flex items-center justify-center shrink-0">
          <Crown size={12} className="text-white" />
        </div>
        <span className="font-body text-[13px] font-semibold text-[var(--text-muted)] capitalize">
          {stableBlock.type}
        </span>
        <span className="font-body text-[9px] text-[var(--text-muted)] font-[monospace] ml-auto shrink-0">
          Block ID: {stableBlock.id.slice(0, 8)}
        </span>
      </div>

      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Block inspector panels"
        className="flex border-b border-[var(--lito-border)] shrink-0 overflow-x-auto gap-3"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeEditorTab === tab.id}
            aria-controls={`editor-panel-${tab.id}`}
            id={`editor-tab-${tab.id}`}
            onClick={() => setEditorTab(tab.id)}
            className={`flex-1 py-[9px] px-[2px] border-0 cursor-pointer font-body text-[11px] font-medium bg-transparent whitespace-nowrap transition-[color] duration-[120ms] border-b-2 ${
              activeEditorTab === tab.id
                ? 'text-[var(--lito-teal-fg)] border-b-[var(--lito-teal-fg)]'
                : 'text-[var(--text-muted)] border-b-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        ref={contentPanelRef}
        role="tabpanel"
        id={`editor-panel-${activeEditorTab}`}
        aria-labelledby={`editor-tab-${activeEditorTab}`}
        className="flex-1 overflow-y-auto min-h-0"
      >
        {activeEditorTab === 'content'    && <ContentTabRouter block={stableBlock} />}
        {activeEditorTab === 'styles'     && <StylePanel      block={stableBlock} />}
        {activeEditorTab === 'spacing'    && <SpacingPanel    block={stableBlock} />}
        {activeEditorTab === 'seo'        && <SEOPanel />}
        {activeEditorTab === 'visibility' && <VisibilityPanel block={stableBlock} />}
        {activeEditorTab === 'animation'  && <AnimationPanel  block={stableBlock} />}
        {activeEditorTab === 'history'    && <HistoryPanel    pageId={pageId ?? undefined} />}
      </div>

      {/* Footer */}
      <div className="px-[14px] py-[10px] border-t border-[var(--lito-border)] shrink-0 flex flex-col gap-2">
        <button type="button" className="flex items-center gap-[6px] bg-transparent border-0 cursor-pointer p-0">
          <HelpCircle size={13} className="text-[var(--text-muted)]" />
          <span className="font-body text-[11px] text-[var(--text-muted)]">
            Need help?
          </span>
        </button>
        <div className="flex items-center justify-between">
          <span className="font-body text-[11px] text-[var(--text-muted)]">
            Keyboard shortcuts
          </span>
          <kbd className="font-body text-[10px] bg-[var(--lito-border)] text-[var(--text-muted)] rounded-[4px] px-[5px] py-[2px]">
            ⌘ /
          </kbd>
        </div>
      </div>
    </div>
  )
}
