/**
 * BlockRenderer — Renders a Block by its type inside the editor canvas.
 *
 * Each block renders a preview that looks like the final website output
 * but is editable in-place or via the right sidebar.
 * All blocks use design system CSS variables — no hardcoded colours.
 */

import type { Block } from '@/types/editor.types'
import type {
  TextBlockData, HeadingBlockData, ImageBlockData, GalleryBlockData,
  VideoBlockData, ButtonBlockData, SpacerBlockData, DividerBlockData,
  HeroBlockData, CTABlockData, ServicesBlockData, PricingBlockData,
  TestimonialsBlockData, FAQBlockData, TeamBlockData, StatisticsBlockData,
  ProductsBlockData, CollectionsBlockData, JournalBlockData, StoryBlockData,
  ContactFormBlockData, NewsletterBlockData, MapBlockData, SocialLinksBlockData,
  HTMLBlockData,
} from '@/types/editor.types'
import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Instagram, Facebook, Twitter, Linkedin,
  Youtube, Globe, Star,
} from 'lucide-react'

// ── Style helper ──────────────────────────────────────────────────────────────

function blockStyle(block: Block): React.CSSProperties {
  const s = block.styles ?? {}
  return {
    paddingTop:    s.paddingTop    !== undefined ? s.paddingTop    : undefined,
    paddingBottom: s.paddingBottom !== undefined ? s.paddingBottom : undefined,
    paddingLeft:   s.paddingLeft   !== undefined ? s.paddingLeft   : undefined,
    paddingRight:  s.paddingRight  !== undefined ? s.paddingRight  : undefined,
    marginTop:     s.marginTop     !== undefined ? s.marginTop     : undefined,
    marginBottom:  s.marginBottom  !== undefined ? s.marginBottom  : undefined,
    backgroundColor: s.backgroundColor ?? undefined,
    color:           s.textColor       ?? undefined,
    textAlign:       s.textAlign       ?? undefined,
    borderRadius:    s.borderRadius !== undefined ? s.borderRadius : undefined,
    borderWidth:     s.borderWidth  !== undefined ? s.borderWidth  : undefined,
    borderColor:     s.borderColor  ?? undefined,
    borderStyle:     s.borderWidth  ? 'solid' : undefined,
  }
}

function innerWidth(block: Block): React.CSSProperties {
  const maxWidth = block.styles?.maxWidth
  const map: Record<string, string> = { full: '100%', xl: '1280px', lg: '1024px', md: '768px', sm: '640px' }
  return maxWidth && maxWidth !== 'full'
    ? { maxWidth: map[maxWidth], marginLeft: 'auto', marginRight: 'auto' }
    : {}
}

// ── Individual blocks ─────────────────────────────────────────────────────────

function TextBlock({ block }: { block: Block }) {
  const d = block.data as TextBlockData
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }}>
      <div
        className="prose prose-sm max-w-none font-body text-[var(--text-primary)]"
        dangerouslySetInnerHTML={{ __html: d.html || '<p class="text-[var(--text-muted)]">Empty text block</p>' }}
      />
    </div>
  )
}

function HeadingBlock({ block }: { block: Block }) {
  const d = block.data as HeadingBlockData
  const Tag = `h${d.level}` as keyof JSX.IntrinsicElements
  const sizeMap: Record<number, string> = {
    1: 'text-4xl font-bold',
    2: 'text-3xl font-bold',
    3: 'text-2xl font-semibold',
    4: 'text-xl font-semibold',
    5: 'text-lg font-medium',
    6: 'text-base font-medium',
  }
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }}>
      <Tag className={`font-display ${sizeMap[d.level] ?? 'text-2xl'} text-[var(--text-primary)]`}>
        {d.text || 'Untitled Heading'}
      </Tag>
    </div>
  )
}

function ImageBlock({ block }: { block: Block }) {
  const d = block.data as ImageBlockData
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }}>
      {d.src ? (
        <figure>
          <img src={d.src} alt={d.alt} className="w-full h-auto rounded object-cover" />
          {d.caption && (
            <figcaption className="mt-2 text-xs text-center text-[var(--text-muted)] font-body">
              {d.caption}
            </figcaption>
          )}
        </figure>
      ) : (
        <div className="flex items-center justify-center h-40 rounded-xl bg-[var(--cms-surface-3)] border-2 border-dashed border-[var(--lito-border)]">
          <p className="text-xs text-[var(--text-muted)] font-body">Click to add image</p>
        </div>
      )}
    </div>
  )
}

function GalleryBlock({ block }: { block: Block }) {
  const d = block.data as GalleryBlockData
  const gapMap = { none: 'gap-0', sm: 'gap-1', md: 'gap-3', lg: 'gap-6' }
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }}>
      {d.images.length > 0 ? (
        <div className={`grid grid-cols-${d.columns} ${gapMap[d.gap] ?? 'gap-3'}`}>
          {d.images.map((img, i) => (
            <img key={i} src={img.src} alt={img.alt} className="w-full h-40 object-cover rounded" />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 rounded-xl bg-[var(--cms-surface-3)] border-2 border-dashed border-[var(--lito-border)]">
          <p className="text-xs text-[var(--text-muted)] font-body">Gallery — no images added</p>
        </div>
      )}
    </div>
  )
}

function VideoBlock({ block }: { block: Block }) {
  const d = block.data as VideoBlockData
  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    const vmMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`
    return url
  }
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }}>
      {d.url ? (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={getEmbedUrl(d.url)}
            className="absolute inset-0 w-full h-full rounded-xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 rounded-xl bg-[var(--cms-surface-3)] border-2 border-dashed border-[var(--lito-border)]">
          <p className="text-xs text-[var(--text-muted)] font-body">Paste a YouTube or Vimeo URL</p>
        </div>
      )}
    </div>
  )
}

function ButtonBlock({ block }: { block: Block }) {
  const d = block.data as ButtonBlockData
  const alignMap = { left: 'text-left', center: 'text-center', right: 'text-right' }
  const variantMap = {
    primary: 'bg-[var(--lito-teal)] text-white hover:opacity-90',
    secondary: 'bg-[var(--lito-gold)] text-[var(--lito-dark)] hover:opacity-90',
    outline: 'border-2 border-[var(--lito-teal)] text-[var(--lito-teal)] hover:bg-[var(--lito-teal)]/10',
    ghost: 'text-[var(--lito-teal)] underline underline-offset-2',
  }
  const sizeMap = { sm: 'px-4 py-2 text-xs', md: 'px-6 py-2.5 text-sm', lg: 'px-8 py-3 text-base' }
  return (
    <div style={{ ...blockStyle(block) }} className={alignMap[d.align]}>
      <a
        href={d.url}
        target={d.newTab ? '_blank' : '_self'}
        rel="noreferrer"
        className={`inline-block rounded-lg font-body font-semibold transition-all ${variantMap[d.variant]} ${sizeMap[d.size]}`}
        onClick={(e) => e.preventDefault()}
      >
        {d.text || 'Button'}
      </a>
    </div>
  )
}

function SpacerBlock({ block }: { block: Block }) {
  const d = block.data as SpacerBlockData
  return (
    <div
      style={{ height: d.height, ...blockStyle(block) }}
      className="relative w-full flex items-center justify-center"
    >
      <span className="text-[10px] text-[var(--text-muted)] font-body bg-[var(--cms-surface-2)] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        {d.height}px
      </span>
    </div>
  )
}

function DividerBlock({ block }: { block: Block }) {
  const d = block.data as DividerBlockData
  const widthMap = { full: 'w-full', wide: 'w-4/5', normal: 'w-1/2' }
  return (
    <div style={{ ...blockStyle(block) }} className="flex justify-center py-3">
      <hr
        className={widthMap[d.width]}
        style={{
          borderStyle: d.style,
          borderColor: d.color ?? 'var(--lito-border)',
          borderTopWidth: 1,
        }}
      />
    </div>
  )
}

function HeroBlock({ block }: { block: Block }) {
  const d = block.data as HeroBlockData
  const alignMap = { left: 'text-left items-start', center: 'text-center items-center', right: 'text-right items-end' }
  const overlay = d.backgroundOverlay ?? 50
  return (
    <div
      style={{
        ...blockStyle(block),
        backgroundImage: d.backgroundImage ? `url(${d.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: d.minHeight ?? 480,
        position: 'relative',
      }}
      className="flex items-center justify-center"
    >
      {d.backgroundImage && (
        <div
          style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlay / 100})` }}
        />
      )}
      <div
        style={{ position: 'relative', zIndex: 1, maxWidth: 800, padding: '0 24px', width: '100%' }}
        className={`flex flex-col gap-4 ${alignMap[d.align]}`}
      >
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white drop-shadow">
          {d.title || 'Hero Title'}
        </h1>
        {d.subtitle && (
          <p className="font-body text-lg text-white/90">{d.subtitle}</p>
        )}
        <div className="flex gap-3 flex-wrap">
          {d.ctaText && (
            <a href={d.ctaUrl} onClick={(e) => e.preventDefault()} className="inline-block px-6 py-3 rounded-lg bg-[var(--lito-teal)] text-white font-semibold font-body text-sm">
              {d.ctaText}
            </a>
          )}
          {d.ctaSecondaryText && (
            <a href={d.ctaSecondaryUrl} onClick={(e) => e.preventDefault()} className="inline-block px-6 py-3 rounded-lg border-2 border-white text-white font-semibold font-body text-sm">
              {d.ctaSecondaryText}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function CTABlock({ block }: { block: Block }) {
  const d = block.data as CTABlockData
  const bgMap = {
    light: 'bg-[var(--cms-surface-2)] text-[var(--text-primary)]',
    dark:  'bg-[var(--lito-dark)] text-white',
    brand: 'bg-[var(--lito-teal)] text-white',
  }
  const alignMap = { left: 'text-left', center: 'text-center', right: 'text-right' }
  return (
    <div style={{ ...blockStyle(block) }} className={`px-8 py-16 ${bgMap[d.variant]} ${alignMap[d.align]}`}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h2 className="font-display text-3xl font-bold mb-3">{d.title}</h2>
        {d.description && <p className="font-body text-base opacity-80 mb-6">{d.description}</p>}
        <a href={d.buttonUrl} onClick={(e) => e.preventDefault()} className="inline-block px-8 py-3 rounded-lg bg-white text-[var(--lito-dark)] font-semibold font-body text-sm">
          {d.buttonText}
        </a>
      </div>
    </div>
  )
}

function ServicesBlock({ block }: { block: Block }) {
  const d = block.data as ServicesBlockData
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6">
      {d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
      <div className={`grid grid-cols-1 sm:grid-cols-${d.columns} gap-6`}>
        {d.items.map((item, i) => (
          <div key={i} className="p-6 rounded-xl bg-[var(--cms-surface-2)] border border-[var(--lito-border)]">
            {item.icon && <div className="text-2xl mb-3">{item.icon}</div>}
            <h3 className="font-display text-base font-semibold mb-2 text-[var(--text-primary)]">{item.title}</h3>
            <p className="font-body text-sm text-[var(--text-muted)]">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PricingBlock({ block }: { block: Block }) {
  const d = block.data as PricingBlockData
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6">
      {d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
      <div className={`grid grid-cols-1 sm:grid-cols-${d.plans.length <= 2 ? d.plans.length : 3} gap-6 max-w-4xl mx-auto`}>
        {d.plans.map((plan, i) => (
          <div key={i} className={`p-6 rounded-2xl border-2 flex flex-col gap-3 ${plan.featured ? 'border-[var(--lito-teal)] bg-[var(--lito-teal)]/5' : 'border-[var(--lito-border)] bg-[var(--cms-surface-2)]'}`}>
            {plan.featured && <span className="text-xs font-body font-bold text-[var(--lito-teal)] uppercase tracking-wider">Most Popular</span>}
            <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
            <div className="flex items-end gap-1">
              <span className="font-display text-3xl font-bold text-[var(--text-primary)]">{plan.price}</span>
              {plan.period && <span className="font-body text-sm text-[var(--text-muted)] mb-1">{plan.period}</span>}
            </div>
            <ul className="space-y-1 flex-1">
              {plan.features.map((f, fi) => (
                <li key={fi} className="font-body text-sm text-[var(--text-secondary)] flex items-center gap-2">
                  <span className="text-[var(--lito-teal)]">✓</span> {f}
                </li>
              ))}
            </ul>
            <a href={plan.ctaUrl} onClick={(e) => e.preventDefault()} className={`block text-center py-2.5 rounded-lg text-sm font-semibold font-body mt-2 ${plan.featured ? 'bg-[var(--lito-teal)] text-white' : 'border border-[var(--lito-border)] text-[var(--text-primary)] hover:bg-[var(--cms-surface-3)]'}`}>
              {plan.ctaText}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

function TestimonialsBlock({ block }: { block: Block }) {
  const d = block.data as TestimonialsBlockData
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6">
      {d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
      <div className={`grid grid-cols-1 ${d.layout === 'grid' ? 'sm:grid-cols-2' : ''} gap-6`}>
        {d.items.map((item, i) => (
          <div key={i} className="p-6 rounded-xl bg-[var(--cms-surface-2)] border border-[var(--lito-border)]">
            {item.rating && (
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: item.rating }).map((_, ri) => (
                  <Star key={ri} className="w-3.5 h-3.5 fill-[var(--lito-gold)] text-[var(--lito-gold)]" />
                ))}
              </div>
            )}
            <p className="font-body text-sm text-[var(--text-secondary)] italic mb-4">"{item.quote}"</p>
            <div className="flex items-center gap-3">
              {item.avatar
                ? <img src={item.avatar} alt={item.name} className="w-8 h-8 rounded-full object-cover" />
                : <div className="w-8 h-8 rounded-full bg-[var(--lito-teal)]/20 flex items-center justify-center text-xs font-bold text-[var(--lito-teal)]">{item.name[0]}</div>
              }
              <div>
                <p className="font-body text-sm font-semibold text-[var(--text-primary)]">{item.name}</p>
                {item.title && <p className="font-body text-xs text-[var(--text-muted)]">{item.title}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FAQBlock({ block }: { block: Block }) {
  const d = block.data as FAQBlockData
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6">
      {d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
      <div className="max-w-2xl mx-auto space-y-2">
        {d.items.map((item, i) => (
          <div key={i} className="rounded-xl border border-[var(--lito-border)] overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-5 py-4 text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-body text-sm font-medium text-[var(--text-primary)]">{item.question}</span>
              {open === i ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
            </button>
            {open === i && (
              <div className="px-5 pb-4">
                <p className="font-body text-sm text-[var(--text-muted)]">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamBlock({ block }: { block: Block }) {
  const d = block.data as TeamBlockData
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6">
      {d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
      <div className={`grid grid-cols-2 sm:grid-cols-${d.columns} gap-6`}>
        {d.members.map((m, i) => (
          <div key={i} className="text-center">
            {m.photo
              ? <img src={m.photo} alt={m.name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover" />
              : <div className="w-20 h-20 rounded-full bg-[var(--lito-teal)]/10 mx-auto mb-3 flex items-center justify-center font-bold text-[var(--lito-teal)] text-xl">{m.name[0]}</div>
            }
            <p className="font-body text-sm font-semibold text-[var(--text-primary)]">{m.name}</p>
            {m.role && <p className="font-body text-xs text-[var(--text-muted)]">{m.role}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatisticsBlock({ block }: { block: Block }) {
  const d = block.data as StatisticsBlockData
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6">
      {d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
      <div className={`grid grid-cols-2 sm:grid-cols-${d.columns} gap-6 text-center`}>
        {d.items.map((item, i) => (
          <div key={i} className="p-6 rounded-xl bg-[var(--cms-surface-2)]">
            <p className="font-display text-4xl font-bold text-[var(--lito-teal)]">
              {item.prefix}{item.value}{item.suffix}
            </p>
            <p className="font-body text-sm text-[var(--text-muted)] mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductsBlock({ block }: { block: Block }) {
  const d = block.data as ProductsBlockData
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6">
      {d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
      <div className={`grid grid-cols-2 sm:grid-cols-${d.columns} gap-4`}>
        {Array.from({ length: d.limit }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[var(--cms-surface-2)] border border-[var(--lito-border)] overflow-hidden">
            <div className="h-40 bg-[var(--cms-surface-3)] flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <div className="p-3">
              <p className="font-body text-sm font-medium text-[var(--text-primary)]">Product {i + 1}</p>
              {d.showPrice && <p className="font-body text-xs text-[var(--lito-teal)] mt-0.5">$0.00</p>}
            </div>
          </div>
        ))}
      </div>
      <p className="font-body text-xs text-[var(--text-muted)] text-center mt-4">
        Live data from the Products catalog
      </p>
    </div>
  )
}

function CollectionsBlock({ block }: { block: Block }) {
  const d = block.data as CollectionsBlockData
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6">
      {d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
      <div className={`grid grid-cols-2 sm:grid-cols-${d.columns} gap-4`}>
        {Array.from({ length: d.limit }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[var(--cms-surface-2)] border border-[var(--lito-border)] h-32 flex items-center justify-center">
            <span className="font-body text-sm text-[var(--text-muted)]">Collection {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function JournalBlock({ block }: { block: Block }) {
  const d = block.data as JournalBlockData
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6">
      {d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
      <div className={`grid grid-cols-1 sm:grid-cols-${d.columns} gap-6`}>
        {Array.from({ length: d.limit }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[var(--cms-surface-2)] border border-[var(--lito-border)] overflow-hidden">
            <div className="h-36 bg-[var(--cms-surface-3)]" />
            <div className="p-4">
              <p className="font-body text-xs text-[var(--text-muted)] mb-1">Jan 1, 2025</p>
              <p className="font-display text-sm font-semibold text-[var(--text-primary)]">Journal Post {i + 1}</p>
              {d.showExcerpt && <p className="font-body text-xs text-[var(--text-muted)] mt-1 line-clamp-2">Brief excerpt from the journal post goes here...</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StoryBlock({ block }: { block: Block }) {
  const d = block.data as StoryBlockData
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6">
      {d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
      <div className={d.layout === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}>
        {Array.from({ length: d.limit }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[var(--cms-surface-2)] border border-[var(--lito-border)] p-4 flex gap-3 items-center">
            <div className="w-12 h-12 rounded-lg bg-[var(--cms-surface-3)] flex-shrink-0" />
            <p className="font-body text-sm font-medium text-[var(--text-primary)]">Story {i + 1}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ContactFormBlock({ block }: { block: Block }) {
  const d = block.data as ContactFormBlockData
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6">
      <div className="max-w-lg mx-auto">
        {d.heading && <h2 className="font-display text-2xl font-bold mb-2 text-[var(--text-primary)]">{d.heading}</h2>}
        {d.description && <p className="font-body text-sm text-[var(--text-muted)] mb-6">{d.description}</p>}
        <div className="space-y-4">
          {d.fields.map((f, i) => (
            <div key={i}>
              <label className="block font-body text-sm font-medium text-[var(--text-primary)] mb-1">
                {f.label}{f.required && <span className="text-red-500"> *</span>}
              </label>
              {f.type === 'textarea'
                ? <textarea rows={4} disabled className="w-full px-3 py-2 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-2)] font-body text-sm resize-none" placeholder={f.label} />
                : <input type={f.type} disabled className="w-full px-3 py-2 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-2)] font-body text-sm" placeholder={f.label} />
              }
            </div>
          ))}
          <button disabled className="w-full py-3 rounded-lg bg-[var(--lito-teal)] text-white font-body text-sm font-semibold">
            {d.submitText ?? 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  )
}

function NewsletterBlock({ block }: { block: Block }) {
  const d = block.data as NewsletterBlockData
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6 text-center">
      {d.heading && <h2 className="font-display text-2xl font-bold mb-2 text-[var(--text-primary)]">{d.heading}</h2>}
      {d.description && <p className="font-body text-sm text-[var(--text-muted)] mb-6">{d.description}</p>}
      <div className="flex gap-2 max-w-sm mx-auto">
        <input type="email" disabled placeholder={d.placeholder ?? 'Enter your email'} className="flex-1 px-3 py-2 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-2)] font-body text-sm" />
        <button disabled className="px-5 py-2 rounded-lg bg-[var(--lito-teal)] text-white font-body text-sm font-semibold whitespace-nowrap">
          {d.buttonText ?? 'Subscribe'}
        </button>
      </div>
    </div>
  )
}

function MapBlock({ block }: { block: Block }) {
  const d = block.data as MapBlockData
  return (
    <div style={{ ...blockStyle(block) }}>
      {d.src ? (
        <iframe src={d.src} width="100%" height={d.height ?? 400} style={{ border: 0 }} loading="lazy" className="rounded-xl" />
      ) : (
        <div className="flex items-center justify-center rounded-xl bg-[var(--cms-surface-3)] border-2 border-dashed border-[var(--lito-border)]" style={{ height: d.height ?? 400 }}>
          <p className="font-body text-sm text-[var(--text-muted)]">Paste a Google Maps embed URL</p>
        </div>
      )}
    </div>
  )
}

function SocialLinksBlock({ block }: { block: Block }) {
  const d = block.data as SocialLinksBlockData
  const alignMap = { left: 'justify-start', center: 'justify-center', right: 'justify-end' }
  const sizeMap  = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' }
  const icons: Record<string, React.ReactNode> = {
    instagram: <Instagram />, facebook: <Facebook />, twitter: <Twitter />,
    linkedin:  <Linkedin />,  youtube:  <Youtube />,  website: <Globe />,
  }
  return (
    <div style={{ ...blockStyle(block) }} className={`flex gap-3 ${alignMap[d.align]}`}>
      {d.links.map((link, i) => (
        <a key={i} href={link.url} onClick={(e) => e.preventDefault()} className={`${sizeMap[d.size]} rounded-full bg-[var(--cms-surface-3)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--lito-teal)] transition-colors`}>
          <span className="w-4 h-4">{icons[link.platform] ?? <Globe />}</span>
        </a>
      ))}
    </div>
  )
}

function HTMLBlockComp({ block }: { block: Block }) {
  const d = block.data as HTMLBlockData
  return (
    <div style={{ ...blockStyle(block) }}>
      {d.html ? (
        <div className="relative">
          <div
            className="pointer-events-none opacity-60 font-mono text-xs bg-[var(--cms-surface-2)] rounded-xl p-3 overflow-auto max-h-40"
            dangerouslySetInnerHTML={{ __html: d.html }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-body text-xs text-[var(--text-muted)] bg-[var(--cms-surface-2)]/80 px-2 py-1 rounded">
              HTML block — edit in sidebar
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-20 rounded-xl bg-[var(--cms-surface-3)] border-2 border-dashed border-[var(--lito-border)]">
          <p className="font-body text-xs text-[var(--text-muted)]">Paste HTML in the sidebar</p>
        </div>
      )}
    </div>
  )
}

// ── Main renderer ─────────────────────────────────────────────────────────────

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'text':         return <TextBlock block={block} />
    case 'heading':      return <HeadingBlock block={block} />
    case 'image':        return <ImageBlock block={block} />
    case 'gallery':      return <GalleryBlock block={block} />
    case 'video':        return <VideoBlock block={block} />
    case 'button':       return <ButtonBlock block={block} />
    case 'spacer':       return <SpacerBlock block={block} />
    case 'divider':      return <DividerBlock block={block} />
    case 'hero':         return <HeroBlock block={block} />
    case 'cta':          return <CTABlock block={block} />
    case 'services':     return <ServicesBlock block={block} />
    case 'pricing':      return <PricingBlock block={block} />
    case 'testimonials': return <TestimonialsBlock block={block} />
    case 'faq':          return <FAQBlock block={block} />
    case 'team':         return <TeamBlock block={block} />
    case 'statistics':   return <StatisticsBlock block={block} />
    case 'products':     return <ProductsBlock block={block} />
    case 'collections':  return <CollectionsBlock block={block} />
    case 'journal':      return <JournalBlock block={block} />
    case 'story':        return <StoryBlock block={block} />
    case 'contact_form': return <ContactFormBlock block={block} />
    case 'newsletter':   return <NewsletterBlock block={block} />
    case 'map':          return <MapBlock block={block} />
    case 'social_links': return <SocialLinksBlock block={block} />
    case 'html':         return <HTMLBlockComp block={block} />
    default:
      return (
        <div className="p-4 text-center font-body text-sm text-[var(--text-muted)]">
          Unknown block type: {(block as Block).type}
        </div>
      )
  }
}
