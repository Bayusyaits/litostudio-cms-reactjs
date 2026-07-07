/**
 * BlockRenderer — Renders a Block by its type inside the editor canvas.
 *
 * Each block renders a preview that looks like the final website output
 * but is editable in-place or via the right sidebar.
 * All blocks use design system CSS variables — no hardcoded colours.
 */

import type { Block } from '@/types/editor.types'
import { useEditorStore } from '@/stores/editor.store'
import type {
  TextBlockData, HeadingBlockData, ImageBlockData,
  VideoBlockData, ButtonBlockData, SpacerBlockData, DividerBlockData,
  CTABlockData,
  FAQBlockData, TeamBlockData, StatisticsBlockData,
  ProductsBlockData, CollectionsBlockData,
  NewsletterBlockData, SocialLinksBlockData,
  HTMLBlockData,
} from '@/types/editor.types'
import React, { useState } from 'react'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { AppImage } from '@/components/atoms/AppImage'
import {
  ChevronDown, ChevronUp, Instagram, Facebook, Twitter, Linkedin,
  Youtube, Globe, MapPin, Mail, Phone, Clock,
  Package, Megaphone, TriangleAlert,
} from 'lucide-react'

// ── High-fidelity Lito section renderers (95%+ visual parity) ────────────────
import { HeroSection }         from '../sections/HeroSection'
import { MapSection }          from '../sections/MapSection'
import { PricingSection }      from '../sections/PricingSection'
import { OfferingsSection }    from '../sections/OfferingsSection'
import { TestimonialsSection } from '../sections/TestimonialsSection'
import { JournalSection }      from '../sections/JournalSection'
import { GallerySection }      from '../sections/GallerySection'
import { PortfolioSection }    from '../sections/PortfolioSection'
import { AboutSection }        from '../sections/AboutSection'
import { CampaignSection }     from '../sections/CampaignSection'
import { ContactSection }      from '../sections/ContactSection'
import { StoriesSection }      from '../sections/StoriesSection'
import { CategoriesSection }      from '../sections/CategoriesSection'
// ── Template section registries ───────────────────────────────────────────────
import { fashionRegistry } from '../sections/fashion/registry'
import { beautyRegistry }  from '../sections/beauty/registry'
import { litoRegistry }    from '../sections/lito/registry'

const TEMPLATE_REGISTRIES: Record<string, Record<string, React.ComponentType<{ block: Block }>>> = {
  fashion:     fashionRegistry,
  beauty:      beautyRegistry,
  lito:        litoRegistry,
  photography: litoRegistry,
}

// ── Fashion / Beauty listing section renderers (legacy — superseded by registry) ─
import { JournalListingSection }      from '../sections/fashion/JournalListingSection'
import { StoriesListingSection }      from '../sections/fashion/StoriesListingSection'
import { GalleryListingSection }      from '../sections/fashion/GalleryListingSection'
import { DestinationsListingSection } from '../sections/fashion/DestinationsListingSection'
// ── Lito listing section renderers ────────────────────────────────────────────
import { JournalListingSection      as LitoJournalListingSection }      from '../sections/lito/JournalListingSection'
import { StoriesListingSection      as LitoStoriesListingSection }      from '../sections/lito/StoriesListingSection'
import { GalleryListingSection      as LitoGalleryListingSection }      from '../sections/lito/GalleryListingSection'
import { DestinationsListingSection as LitoDestinationsListingSection } from '../sections/lito/DestinationsListingSection'
import { LitoStoriesSection  } from '../sections/lito/StoriesSection'
import { LitoJournalSection  } from '../sections/lito/JournalSection'
import { LitoGallerySection  } from '../sections/lito/GallerySection'
import { LitoOfferingSection } from '../sections/lito/OfferingSection'

// ── Style helper ──────────────────────────────────────────────────────────────

/**
 * Derive inline styles for a block's outer wrapper.
 * Default vertical section padding (64px top + bottom) is applied unless the
 * block explicitly overrides it — this matches the real website's section rhythm
 * and makes the canvas look like the live site rather than a flat widget list.
 * Hero and Spacer blocks explicitly set paddingTop/Bottom: 0 in their defaults.
 */
function blockStyle(block: Block): React.CSSProperties {
  const s = block.styles ?? {}
  // Blocks that manage their own layout should not have forced padding
  const noPadding = block.type === 'spacer' || block.type === 'divider'
  // Support both canonical keys (backgroundColor/textColor) and legacy shorthand
  // keys (background/color) that may exist in older pageDefaults entries.
  const bg    = s.backgroundColor ?? (s as Record<string, unknown>).background as string | undefined
  const color = s.textColor       ?? (s as Record<string, unknown>).color       as string | undefined
  return {
    paddingTop:    s.paddingTop    !== undefined ? s.paddingTop    : noPadding ? 0 : 64,
    paddingBottom: s.paddingBottom !== undefined ? s.paddingBottom : noPadding ? 0 : 64,
    paddingLeft:   s.paddingLeft   !== undefined ? s.paddingLeft   : undefined,
    paddingRight:  s.paddingRight  !== undefined ? s.paddingRight  : undefined,
    marginTop:     s.marginTop     !== undefined ? s.marginTop     : undefined,
    marginBottom:  s.marginBottom  !== undefined ? s.marginBottom  : undefined,
    backgroundColor: bg,
    color,
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
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(d.html) || '<p class="text-[var(--text-muted)]">Empty text block</p>' }}
      />
    </div>
  )
}

function HeadingBlock({ block }: { block: Block }) {
  const { updateBlock, selectedBlockId } = useEditorStore()
  const isSelected = selectedBlockId === block.id
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
      <Tag
        contentEditable={isSelected}
        suppressContentEditableWarning
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={isSelected}
        onBlur={(e) =>
          updateBlock(block.id, { text: e.currentTarget.textContent ?? '' })
        }
        className={`font-display ${sizeMap[d.level] ?? 'text-2xl'} text-[var(--text-primary)] outline-none min-w-[1px]`}
      >
        {d.text || (isSelected ? undefined : 'Untitled Heading')}
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
          <AppImage src={d.src} alt={d.alt} className="w-full h-auto rounded object-cover" />
          {!!d.caption && (
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
      <div className="max-w-[700px] mx-auto">
        <h2 className="font-display text-3xl font-bold mb-3">{d.title}</h2>
        {!!d.description && <p className="font-body text-base opacity-80 mb-6">{d.description}</p>}
        <a href={d.buttonUrl} onClick={(e) => e.preventDefault()} className="inline-block px-8 py-3 rounded-lg bg-white text-[var(--lito-dark)] font-semibold font-body text-sm">
          {d.buttonText}
        </a>
      </div>
    </div>
  )
}

function FAQBlock({ block }: { block: Block }) {
  const d = block.data as FAQBlockData
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6">
      {!!d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
      <div className="max-w-2xl mx-auto space-y-2">
        {d.items.map((item, i) => (
          <div key={i} className="rounded-xl border border-[var(--lito-border)] overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-5 py-4 text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-body text-sm font-medium text-[var(--text-muted)]">{item.question}</span>
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
      {!!d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
      <div className={`grid grid-cols-2 sm:grid-cols-${d.columns} gap-6`}>
        {d.members.map((m, i) => (
          <div key={i} className="text-center">
            {m.photo
              ? <AppImage src={m.photo} alt={m.name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover" />
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
      {!!d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
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
      {!!d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
      <div className={`grid grid-cols-2 sm:grid-cols-${d.columns} gap-4`}>
        {Array.from({ length: d.limit }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[var(--cms-surface-2)] border border-[var(--lito-border)] overflow-hidden">
            <div className="h-40 bg-[var(--cms-surface-3)] flex items-center justify-center text-[var(--text-muted)]">
              <Package size={28} strokeWidth={1.5} />
            </div>
            <div className="p-3">
              <p className="font-body text-sm font-medium text-[var(--text-muted)]">Product {i + 1}</p>
              {!!d.showPrice && <p className="font-body text-xs text-[var(--lito-teal)] mt-0.5">$0.00</p>}
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
      {!!d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
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

function NewsletterBlock({ block }: { block: Block }) {
  const d = block.data as NewsletterBlockData
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6 text-center">
      {!!d.heading && <h2 className="font-display text-2xl font-bold mb-2 text-[var(--text-primary)]">{d.heading}</h2>}
      {!!d.description && <p className="font-body text-sm text-[var(--text-muted)] mb-6">{d.description}</p>}
      <div className="flex gap-2 max-w-sm mx-auto">
        <input type="email" disabled placeholder={d.placeholder ?? 'Enter your email'} className="flex-1 px-3 py-2 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-2)] font-body text-sm" />
        <button disabled className="px-5 py-2 rounded-lg bg-[var(--lito-teal)] text-white font-body text-sm font-semibold whitespace-nowrap">
          {d.buttonText ?? 'Subscribe'}
        </button>
      </div>
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
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(d.html) }}
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

// ── Fashion template blocks ───────────────────────────────────────────────────
// All use CSS vars that are remapped via [data-template="fashion"] in
// canvas-website-tokens.css: --lito-ink → #0A0A0A, --lito-cream → #FAFAF9,
// --lito-border → rgba(0,0,0,.1), --font-display → 'Inter'

function PageHeroBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const heroHeight = d.height ? String(d.height) : '55vh'
  return (
    <div style={{ ...blockStyle(block), position: 'relative', minHeight: heroHeight, background: d.imgSrc ? undefined : 'var(--lito-ink, #0A0A0A)', backgroundImage: d.imgSrc ? `url(${d.imgSrc})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.1) 100%)' }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '0 var(--nx-gutter, 32px) clamp(2.5rem, 6vh, 5rem)', width: '100%', maxWidth: 1200 }}>
        {!!d.eyebrow && (
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', margin: 0, marginBottom: 14 }}>
            {String(d.eyebrow)}
          </p>
        )}
        <h1 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.025em', textTransform: 'uppercase', color: 'var(--lito-cream, #FAFAF9)', margin: 0, marginBottom: 16 }}>
          {String(d.title ?? 'Page Title')}
        </h1>
        {!!d.desc && (
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: 0, marginBottom: 24, maxWidth: '50ch' }}>
            {String(d.desc)}
          </p>
        )}
        {!!d.ctaLabel && (
          <a style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 32px', background: 'var(--lito-cream, #FAFAF9)', color: 'var(--lito-ink, #0A0A0A)', fontFamily: 'var(--font-body, Inter)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {String(d.ctaLabel)}
          </a>
        )}
      </div>
    </div>
  )
}

function ContactCtaBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  return (
    <div style={{ ...blockStyle(block), background: 'var(--lito-ink, #0A0A0A)', padding: 'clamp(4rem, 8vw, 7rem) 32px', textAlign: 'center' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {!!d.eyebrow && (
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(250,250,249,0.55)', margin: 0, marginBottom: 16 }}>
            {String(d.eyebrow)}
          </p>
        )}
        <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.025em', textTransform: 'uppercase', color: 'var(--lito-cream, #FAFAF9)', margin: 0, marginBottom: 20 }}>
          {String(d.title ?? "Let's Work Together")}
        </h2>
        {!!d.desc && (
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 14, color: 'rgba(250,250,249,0.7)', lineHeight: 1.7, margin: 0, marginBottom: 40 }}>
            {String(d.desc)}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!!d.whatsappUrl && (
            <a style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 36px', background: '#25D366', color: '#fff', fontFamily: 'var(--font-body, Inter)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
              {String(d.whatsappText ?? 'Chat on WhatsApp')}
            </a>
          )}
          <a style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 36px', background: 'var(--lito-cream, #FAFAF9)', color: 'var(--lito-ink, #0A0A0A)', fontFamily: 'var(--font-body, Inter)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {String(d.ctaText ?? 'Send an Email')}
          </a>
          {!!d.homeText && (
            <a style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 36px', background: 'transparent', color: 'var(--lito-cream, #FAFAF9)', border: '1px solid rgba(250,250,249,0.4)', fontFamily: 'var(--font-body, Inter)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
              {String(d.homeText)}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function ContactCardsBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const items = Array.isArray(d.items) ? d.items as Array<{ icon?: string; label?: string; value?: string }> : []
  const iconMap: Record<string, React.ReactNode> = {
    MapPin: <MapPin size={18} />,
    Mail:   <Mail size={18} />,
    Phone:  <Phone size={18} />,
    Clock:  <Clock size={18} />,
  }
  return (
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        {!!d.heading && (
          <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink, #0A0A0A)', margin: 0, marginBottom: 40 }}>
            {String(d.heading)}
          </h2>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {items.map((item, i) => (
            <div key={i} style={{ padding: '28px 32px', border: '1px solid var(--lito-border, rgba(0,0,0,.1))', background: 'var(--cms-surface-2, #F5F5F4)', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {!!item.icon && iconMap[item.icon] && (
                <div style={{ width: 40, height: 40, background: 'var(--lito-ink, #0A0A0A)', color: 'var(--lito-cream, #FAFAF9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {iconMap[item.icon]}
                </div>
              )}
              <div>
                <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted, #999)', margin: 0, marginBottom: 6 }}>
                  {item.label ?? `Info ${i + 1}`}
                </p>
                <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 15, color: 'var(--lito-ink, #0A0A0A)', margin: 0, whiteSpace: 'pre-line' }}>
                  {item.value ?? '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function NewArrivalBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const count = typeof d.productCount === 'number' ? d.productCount : 8
  const placeholders = Array.from({ length: count })
  return (
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-display, Inter, system-ui)', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--lito-ink, #0A0A0A)', margin: 0 }}>
            {String(d.title ?? 'New Arrivals')}
          </h2>
          <a style={{ fontFamily: 'var(--font-body, Inter, system-ui)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary, #666)', textDecoration: 'none' }}>
            {String(d.catalogueText ?? 'View All')} →
          </a>
        </div>
        {/* Product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {placeholders.map((_, i) => (
            <div key={i} style={{ background: 'var(--cms-surface-2, #F5F5F4)' }}>
              <div style={{ paddingBottom: '125%', position: 'relative', background: 'var(--cms-surface-3, #EDEDED)', overflow: 'hidden' }}>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body, Inter)', fontSize: 10, color: 'var(--text-muted, #999)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Product {i + 1}
                </span>
              </div>
              <div style={{ padding: '12px 0' }}>
                <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 12, color: 'var(--text-primary, #0A0A0A)', margin: 0, marginBottom: 4 }}>Product Name</p>
                <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 12, color: 'var(--text-secondary, #666)', margin: 0 }}>Rp 0</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BrandStoryBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const values = Array.isArray(d.values) ? d.values as string[] : []
  const currentYear = new Date().getFullYear()
  const yearsCount = d.since ? currentYear - Number(d.since) : null
  return (
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        {/* Image side with floating years badge */}
        <div style={{ position: 'relative' }}>
          <div style={{ background: 'var(--cms-surface-3, #EDEDED)', aspectRatio: '4/5', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {d.image ? (
              <AppImage src={String(d.image)} alt="" priority objectFit="cover" wrapperStyle={{ position: 'absolute', inset: 0 }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <span style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 10, color: 'var(--text-muted, #999)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Brand Image</span>
            )}
          </div>
          {yearsCount !== null && (
            <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, background: 'var(--brand, #E84500)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <span style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{yearsCount}</span>
              <span style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
                {String(d.yearsStrongLabel ?? 'Years')}
              </span>
            </div>
          )}
        </div>
        {/* Text side */}
        <div>
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brand, #E84500)', marginBottom: 16, marginTop: 0 }}>
            {String(d.eyebrow ?? 'Who We Are')}
          </p>
          <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--lito-ink, #0A0A0A)', margin: 0, marginBottom: 20 }}>
            {String(d.title ?? 'Born from a Passion for Fashion')}
          </h2>
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary, #666)', margin: 0, marginBottom: 24 }}>
            {String(d.description ?? 'Tell your brand story here.')}
          </p>
          {values.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {values.map((v, i) => (
                <span key={i} style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--lito-ink, #0A0A0A)', padding: '5px 12px', border: '1px solid var(--lito-border, rgba(0,0,0,.15))' }}>
                  {v}
                </span>
              ))}
            </div>
          )}
          {!!d.ctaText && (
            <a style={{ display: 'inline-block', fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--lito-ink, #0A0A0A)', textDecoration: 'none', borderBottom: '1px solid var(--lito-ink, #0A0A0A)', paddingBottom: 2 }}>
              {String(d.ctaText)}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function LookbookBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  // 5-image editorial lookbook grid (asymmetric)
  return (
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #999)', margin: 0, marginBottom: 8 }}>
            {String(d.eyebrow ?? 'This Season')}
          </p>
          <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink, #0A0A0A)', margin: 0 }}>
            {String(d.title ?? 'Lookbook')}
          </h2>
        </div>
        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: '280px 280px', gap: 8 }}>
          <div style={{ gridColumn: '1', gridRow: '1 / 3', background: 'var(--cms-surface-3, #EDEDED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 10, color: 'var(--text-muted, #999)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Image 1</span>
          </div>
          {[2, 3, 4, 5].map(n => (
            <div key={n} style={{ background: 'var(--cms-surface-3, #EDEDED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 10, color: 'var(--text-muted, #999)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Image {n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CampaignBannerBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const hasBg = !!d.backgroundImage
  return (
    <div style={{ ...blockStyle(block), position: 'relative', minHeight: 500, background: hasBg ? undefined : 'var(--lito-ink, #0A0A0A)', backgroundImage: hasBg ? `url(${d.backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      {/* overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%)' }} />
      {/* content */}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 48px 52px', maxWidth: 720 }}>
        <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: 0, marginBottom: 12 }}>
          {String(d.eyebrow ?? 'New Collection')}
        </p>
        <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 42, fontWeight: 300, letterSpacing: '-0.025em', lineHeight: 1.1, color: '#fff', margin: 0, marginBottom: 24 }}>
          {String(d.title ?? 'The New Season Is Here')}
        </h2>
        {!!d.description && (
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 14, color: 'rgba(255,255,255,0.72)', margin: 0, marginBottom: 24 }}>
            {String(d.description)}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <a style={{ display: 'inline-block', padding: '11px 28px', background: '#fff', color: 'var(--lito-ink, #0A0A0A)', fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {String(d.buttonText ?? 'Shop Now')}
          </a>
          {!!d.ctaSecondaryText && (
            <a style={{ display: 'inline-block', padding: '11px 28px', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
              {String(d.ctaSecondaryText)}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// Icon SVGs for philosophy cards (matches Fashion About.html reference)
const PHILOSOPHY_ICONS = [
  // Innovation — lightning bolt
  <svg key="a" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  // Craftsmanship — pencil edit
  <svg key="b" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  // Sustainability — shield
  <svg key="c" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  // Community — users
  <svg key="d" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
]

function PhilosophyBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const items = Array.isArray(d.items) ? d.items as Array<{ icon?: string; title: string; description: string }> : []
  return (
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brand, #E84500)', margin: 0, marginBottom: 12 }}>
            {String(d.eyebrow ?? 'Values')}
          </p>
          <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink, #0A0A0A)', margin: 0 }}>
            {String(d.heading ?? 'Our Philosophy')}
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: 'var(--cms-surface-2, #F5F5F4)', borderRadius: 6, padding: '36px 28px', border: '1px solid var(--lito-border, rgba(0,0,0,.1))', transition: 'transform 0.25s ease, border-color 0.25s, box-shadow 0.25s' }}>
              <div style={{ width: 48, height: 48, background: 'rgba(232,69,0,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: 'var(--brand, #E84500)' }}>
                {PHILOSOPHY_ICONS[i % PHILOSOPHY_ICONS.length]}
              </div>
              <h3 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--lito-ink, #0A0A0A)', margin: 0, marginBottom: 10 }}>
                {item.title}
              </h3>
              <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 13.5, lineHeight: 1.65, color: 'var(--text-secondary, #666)', margin: 0 }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TimelineBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const entries = Array.isArray(d.entries) ? d.entries as Array<{ year: string; title: string; description: string }> : []
  return (
    <div style={{ ...blockStyle(block), background: 'var(--lito-ink, #0A0A0A)', paddingTop: 80, paddingBottom: 80, overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        {/* Label */}
        <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', margin: 0, marginBottom: 48 }}>
          {String(d.heading ?? 'Our Journey')}
        </p>
        {/* Horizontal scroll track */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 8 }}>
          {entries.map((e, i) => (
            <div key={i} style={{ flex: '0 0 220px', borderLeft: `2px solid ${i === 0 ? 'var(--brand, #E84500)' : 'rgba(255,255,255,0.15)'}`, padding: '0 0 32px 24px', position: 'relative', color: '#fff' }}>
              {/* Dot */}
              <div style={{ position: 'absolute', top: 0, left: -5, width: 8, height: 8, background: 'var(--brand, #E84500)', borderRadius: '50%' }} />
              <div style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 36, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 10, color: i === 0 ? 'var(--brand, #E84500)' : 'rgba(255,255,255,0.3)' }}>
                {e.year}
              </div>
              <div style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                {e.title}
              </div>
              <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
                {e.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CollaborationsBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const items: Array<{ name?: string; logo?: string }> = Array.isArray(d.items) && d.items.length > 0
    ? d.items as Array<{ name?: string; logo?: string }>
    : Array.from({ length: 6 }, (_, i) => ({ name: `Partner ${i + 1}`, logo: undefined }))
  return (
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        {!!d.eyebrow && (
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #999)', margin: 0, marginBottom: 12 }}>
            {String(d.eyebrow)}
          </p>
        )}
        <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink, #0A0A0A)', margin: 0, marginBottom: 40 }}>
          {String(d.heading ?? 'Our Collaborations')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, border: '1px solid var(--lito-border, rgba(0,0,0,.1))' }}>
          {items.map((item, i) => (
            <div key={i} style={{ aspectRatio: '3/2', background: 'var(--cms-surface-2, #F5F5F4)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--lito-border, rgba(0,0,0,.1))', borderBottom: '1px solid var(--lito-border, rgba(0,0,0,.1))' }}>
              {item.logo
                ? <AppImage src={item.logo} alt={item.name ?? ''} objectFit="contain" style={{ maxHeight: 48, maxWidth: 120, opacity: 0.6 }} wrapperStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                : <p style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 13, color: 'var(--text-secondary, #666)', margin: 0 }}>{item.name}</p>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MarqueeBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const items = Array.isArray(d.items) ? d.items as string[] : ['New Arrivals', 'Free Shipping', 'Sustainable Fashion', 'Shop Now']
  // Show static marquee in editor (no animation)
  const repeated = [...items, ...items, ...items]
  return (
    <div style={{ ...blockStyle(block), paddingTop: 20, paddingBottom: 20, background: 'var(--lito-ink, #0A0A0A)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 0, alignItems: 'center', whiteSpace: 'nowrap' }}>
        {repeated.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 24 }}>
            <span style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', padding: '0 32px' }}>
              {item}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8 }}>●</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function PromoBannersBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const items = Array.isArray(d.items)
    ? d.items as Array<{ image?: string; title?: string; link?: string; buttonText?: string }>
    : [{ title: 'Summer Sale' }, { title: 'New Season' }]
  return (
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 12 }}>
          {items.map((item, i) => (
            <div key={i} style={{ position: 'relative', minHeight: 320, background: item.image ? undefined : 'var(--cms-surface-3, #EDEDED)', backgroundImage: item.image ? `url(${item.image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
              {!!item.image && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />}
              <div style={{ position: 'relative', zIndex: 1, padding: 24 }}>
                <p style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 20, fontWeight: 400, color: item.image ? '#fff' : 'var(--lito-ink, #0A0A0A)', margin: 0, marginBottom: 12 }}>
                  {item.title ?? `Promo ${i + 1}`}
                </p>
                <a style={{ display: 'inline-block', fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: item.image ? '#fff' : 'var(--lito-ink, #0A0A0A)', textDecoration: 'none', borderBottom: `1px solid ${item.image ? '#fff' : 'var(--lito-ink, #0A0A0A)'}` }}>
                  {item.buttonText ?? 'Shop Now'}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AboutCtaBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const hasBg = !!d.backgroundImage
  return (
    <div style={{ ...blockStyle(block), position: 'relative', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: hasBg ? undefined : 'var(--lito-ink, #0A0A0A)', backgroundImage: hasBg ? `url(${d.backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff', padding: '60px 32px' }}>
        <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.025em', margin: 0, marginBottom: 32 }}>
          {String(d.title ?? 'Ready to Explore?')}
        </h2>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a style={{ display: 'inline-block', padding: '14px 32px', background: 'var(--lito-cream, #FAFAF9)', color: 'var(--lito-ink, #0A0A0A)', fontFamily: 'var(--font-body, Inter)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {String(d.shopText ?? 'Shop the Collection')}
          </a>
          <a style={{ display: 'inline-block', padding: '14px 32px', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', fontFamily: 'var(--font-body, Inter)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {String(d.contactText ?? 'Contact Us')}
          </a>
        </div>
      </div>
    </div>
  )
}

function ProductCarouselBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const limit = typeof d.limit === 'number' ? d.limit : 8
  return (
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--lito-ink, #0A0A0A)', margin: 0 }}>
            {String(d.title ?? 'You May Also Like')}
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ width: 32, height: 32, border: '1px solid var(--lito-border, rgba(0,0,0,.1))', background: 'none', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--text-secondary, #666)' }}>←</button>
            <button style={{ width: 32, height: 32, border: '1px solid var(--lito-border, rgba(0,0,0,.1))', background: 'none', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--text-secondary, #666)' }}>→</button>
          </div>
        </div>
        {/* Horizontal scroll preview */}
        <div style={{ display: 'flex', gap: 12, overflowX: 'hidden' }}>
          {Array.from({ length: Math.min(limit, 5) }).map((_, i) => (
            <div key={i} style={{ flexShrink: 0, width: 200 }}>
              <div style={{ paddingBottom: '125%', position: 'relative', background: 'var(--cms-surface-3, #EDEDED)', overflow: 'hidden', marginBottom: 10 }}>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body, Inter)', fontSize: 10, color: 'var(--text-muted, #999)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Product {i + 1}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 12, color: 'var(--text-primary, #0A0A0A)', margin: 0, marginBottom: 2 }}>Product Name</p>
              <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 12, color: 'var(--text-secondary, #666)', margin: 0 }}>Rp 0</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StoresBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const items = Array.isArray(d.items)
    ? d.items as Array<{ name?: string; address?: string; phone?: string; hours?: string; mapUrl?: string; mapImage?: string }>
    : []
  return (
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        {!!d.eyebrow && (
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brand, #E84500)', margin: 0, marginBottom: 12 }}>
            {String(d.eyebrow)}
          </p>
        )}
        <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink, #0A0A0A)', margin: 0, marginBottom: 40 }}>
          {String(d.heading ?? 'Find Us Near You')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: 'var(--cms-surface-2, #F5F5F4)', border: '1px solid var(--lito-border, rgba(0,0,0,.1))', borderRadius: 6, padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 18, fontWeight: 700, color: 'var(--lito-ink, #0A0A0A)', marginBottom: 4 }}>
                {item.name ?? `Store ${i + 1}`}
              </div>
              {!!item.address && (
                <div style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 13, color: 'var(--text-secondary, #666)', marginBottom: 6, lineHeight: 1.5 }}>
                  {item.address}
                </div>
              )}
              {!!item.hours && (
                <div style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--brand, #E84500)', marginBottom: 12, whiteSpace: 'pre-line' }}>
                  {item.hours}
                </div>
              )}
              {!!item.mapUrl && (
                <a style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--lito-ink, #0A0A0A)', textDecoration: 'none', borderBottom: '1px solid rgba(0,0,0,.2)', paddingBottom: 2, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  Get Directions →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SocialGridBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const platforms = [
    { name: 'Instagram', handle: '@yourbrand', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
    { name: 'TikTok', handle: '@yourbrand', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg> },
    { name: 'Facebook', handle: 'Your Brand', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg> },
    { name: 'YouTube', handle: 'Your Brand TV', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg> },
    { name: 'Pinterest', handle: '@yourbrand', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
  ]
  return (
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {!!d.eyebrow && (
            <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brand, #E84500)', margin: 0, marginBottom: 12 }}>
              {String(d.eyebrow)}
            </p>
          )}
          <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink, #0A0A0A)', margin: 0 }}>
            {String(d.title ?? 'Follow Our Journey')}
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {platforms.map((p, i) => (
            <div key={i} style={{ background: 'var(--cms-surface-2, #F5F5F4)', border: '1px solid var(--lito-border, rgba(0,0,0,.1))', borderRadius: 6, padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ color: 'var(--lito-ink, #0A0A0A)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                {p.icon}
              </div>
              <div style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 13, fontWeight: 600, color: 'var(--lito-ink, #0A0A0A)', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 12, color: 'var(--text-secondary, #666)' }}>{p.handle}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Beauty template blocks ────────────────────────────────────────────────────

function CampaignsGridBlock({ block }: { block: Block }) {
  // Beauty template: promotions / campaign cards grid (not the same as Lito CampaignSection)
  const d = block.data as Record<string, unknown>
  const limit  = typeof d.limit  === 'number' ? d.limit  : 4
  const cols   = typeof d.columns === 'number' ? d.columns : 2
  return (
    <div style={{ ...blockStyle(block), ...innerWidth(block) }} className="px-6">
      {d.heading != null && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{String(d.heading)}</h2>}
      <div className={`grid grid-cols-1 sm:grid-cols-${cols} gap-5`}>
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[var(--cms-surface-2)] border border-[var(--lito-border)] overflow-hidden">
            <div className="h-44 bg-[var(--cms-surface-3)] flex items-center justify-center text-[var(--text-muted)]">
              <Megaphone size={32} strokeWidth={1.5} />
            </div>
            <div className="p-4">
              <p className="font-display text-sm font-semibold text-[var(--text-primary)] mb-1">Campaign {i + 1}</p>
              <p className="font-body text-xs text-[var(--text-muted)] line-clamp-2">Campaign description goes here.</p>
            </div>
          </div>
        ))}
      </div>
      <p className="font-body text-xs text-[var(--text-muted)] text-center mt-4">Live data from the Campaigns catalog</p>
    </div>
  )
}

// ── Beauty: Founder Quote ─────────────────────────────────────────────────────
// Visual replica of beauty/components/sections/FounderQuoteSection.vue
// Dark bg, 2-col grid (portrait image left | blockquote right), attribution row.

function FounderQuoteBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const quote       = String(d.quote       ?? 'Beauty is about enhancing what you have. Let yourself shine through.')
  const founderName = String(d.founderName ?? 'Founder Name')
  const founderRole = String(d.founderRole ?? 'Founder & Creative Director')
  const image       = typeof d.image === 'string' && d.image ? d.image : null
  const eyebrow     = String(d.eyebrow ?? 'From the founder')

  return (
    <div style={{ ...blockStyle(block), background: 'var(--bx-text, #0A0A0A)', paddingTop: 0, paddingBottom: 0 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(60px, 9vw, 130px) 40px', display: 'grid', gridTemplateColumns: image ? '1fr 1.1fr' : '1fr', gap: 'clamp(28px, 5vw, 72px)', alignItems: 'center' }}>
        {/* Left: portrait image */}
        {image && (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}>
              <AppImage src={image} alt={founderName} priority objectFit="cover" wrapperStyle={{ position: 'absolute', inset: 0 }} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        )}

        {/* Right: quote content */}
        <div>
          {/* Eyebrow */}
          <span style={{ display: 'block', fontFamily: 'var(--font-body, Inter)', fontSize: 12, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 24 }}>
            <span style={{ opacity: 0.5, marginRight: 8 }}>(04)</span>
            {eyebrow}
          </span>

          {/* Blockquote */}
          <p style={{ fontFamily: 'var(--font-display, Cormorant, Georgia, serif)', fontWeight: 400, fontSize: 'clamp(28px, 3.6vw, 48px)', lineHeight: 1.18, letterSpacing: '-0.01em', color: 'var(--lito-cream, #FAF8F5)', margin: '0 0 2rem' }}>
            &ldquo;{quote}&rdquo;
          </p>

          {/* Attribution */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {image && (
              <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                <AppImage src={image} alt={founderName} ratio="1/1" objectFit="cover" wrapperStyle={{ position: 'absolute', inset: 0 }} style={{ width: '100%', height: '100%' }} />
              </div>
            )}
            {!image && (
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body, Inter)', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
                {founderName.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
            )}
            <div>
              <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 14, fontWeight: 600, color: 'var(--lito-cream, #FAF8F5)', margin: '0 0 3px' }}>
                {founderName}
              </p>
              <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 12.5, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                {founderRole}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Beauty: Product Benefits ───────────────────────────────────────────────────
// Visual replica of beauty/components/sections/ProductBenefitsSection.vue
// Alternating image|text cards with stat overlay on the image.

const MOCK_BENEFITS = [
  { eyebrow: 'Ingredient Quality', title: 'Sourced with Intention', description: 'Every ingredient is hand-selected for efficacy and sustainability — no fillers, no compromise.', statValue: '97%', statLabel: 'Natural Origin' },
  { eyebrow: 'Clinical Results', title: 'Science-Backed Formulas', description: 'Developed in partnership with leading dermatologists to deliver visible results within weeks.', statValue: '92%', statLabel: 'Saw Results in 4 Weeks' },
]

function ProductBenefitsBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const rawItems = Array.isArray(d.items) ? d.items as Array<Record<string, unknown>> : []
  const items: Array<Record<string, unknown>> = rawItems.length ? rawItems : (MOCK_BENEFITS as Array<Record<string, unknown>>)

  return (
    <div style={{ ...blockStyle(block), padding: '80px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', display: 'flex', flexDirection: 'column', gap: 80 }}>
        {items.map((item, i) => {
          const isReverse = i % 2 === 1
          const image     = typeof item.image === 'string' && item.image ? item.image : null

          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(3rem, 5vw, 6rem)', alignItems: 'center', direction: isReverse ? 'rtl' : 'ltr' }}>
              {/* Image side */}
              <div style={{ direction: 'ltr', position: 'relative' }}>
                <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', borderRadius: 6, background: 'var(--cms-surface-3, #EDEDED)' }}>
                  {image ? (
                    <AppImage src={image} alt={String(item.title ?? '')} objectFit="cover" wrapperStyle={{ position: 'absolute', inset: 0 }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--cms-surface-3, #EDEDED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, color: 'var(--text-muted, #999)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Image {i + 1}</span>
                    </div>
                  )}
                  {/* Stat overlay */}
                  {!!(item.statValue || item.statLabel) && (
                    <div style={{ position: 'absolute', bottom: 24, right: 24, background: 'rgba(250,248,245,0.96)', borderRadius: 4, padding: '14px 18px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                      <p style={{ fontFamily: 'var(--font-display, Cormorant, Georgia, serif)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, color: 'var(--bx-accent-text, #8B5E3C)', margin: 0, lineHeight: 1 }}>
                        {String(item.statValue ?? '')}
                      </p>
                      <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #888)', margin: '6px 0 0' }}>
                        {String(item.statLabel ?? '')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Text side */}
              <div style={{ direction: 'ltr' }}>
                {!!item.eyebrow && (
                  <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--bx-accent-text, #8B5E3C)', margin: '0 0 1rem' }}>
                    {String(item.eyebrow)}
                  </p>
                )}
                {!!item.title && (
                  <h3 style={{ fontFamily: 'var(--font-display, Cormorant, Georgia, serif)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 400, color: 'var(--text-primary, #0A0A0A)', margin: '0 0 1.25rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                    {String(item.title)}
                  </h3>
                )}
                {!!item.description && (
                  <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 'clamp(14px, 1.5vw, 16px)', lineHeight: 1.75, color: 'var(--text-muted, #666)', maxWidth: '48ch', margin: '0 0 1.75rem' }}>
                    {String(item.description)}
                  </p>
                )}
                {!!item.ctaLabel && (
                  <a style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body, Inter)', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary, #0A0A0A)', textDecoration: 'none', borderBottom: '1.5px solid var(--bx-accent, #8B5E3C)', paddingBottom: 2 }}>
                    {String(item.ctaLabel)}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Null-mapped block warning ─────────────────────────────────────────────────
// Block types in this set are silently dropped by the backend publish sync
// (BLOCK_TO_SECTION_TYPE maps them to null). Show a visual warning in the
// editor so authors know the block won't appear on the published website.

const NULL_MAPPED_BLOCK_TYPES = new Set([
  'image', 'video', 'button', 'cta', 'statistics', 'spacer', 'divider', 'html',
  'email', 'textarea',  // form field types — editor-only, not rendered on website
])

function NullMappedWarning() {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '4px 10px',
        background: 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        borderRadius: '4px',
        marginBottom: '4px',
        fontSize: '11px',
        fontFamily: 'var(--font-body)',
        color: '#92400E',
        userSelect: 'none',
      }}
    >
      <TriangleAlert size={14} />
      <span>This block is <strong>editor-only</strong> — it won't appear on the published website.</span>
    </div>
  )
}

// ── Main renderer ─────────────────────────────────────────────────────────────

export function BlockRenderer({ block, template }: { block: Block; template?: string }) {
  const isLito = template === 'lito' || template === 'photography' || !template

  // ── Template registry delegation ─────────────────────────────────────────
  // Each template has its own registry.ts in sections/<template>/.
  // Check the registry first; fall through to shared switch cases below.
  if (template && TEMPLATE_REGISTRIES[template]) {
    const TemplateSection = TEMPLATE_REGISTRIES[template][block.type]
    if (TemplateSection) return <TemplateSection block={block} />
  }

  const nullMapped = NULL_MAPPED_BLOCK_TYPES.has(block.type)
  const warn = nullMapped ? <NullMappedWarning /> : null

  switch (block.type) {
    case 'text':         return <TextBlock block={block} />
    case 'heading':      return <HeadingBlock block={block} />
    case 'image':        return <>{warn}<ImageBlock block={block} /></>
    case 'video':        return <>{warn}<VideoBlock block={block} /></>
    case 'button':       return <>{warn}<ButtonBlock block={block} /></>
    case 'spacer':       return <>{warn}<SpacerBlock block={block} /></>
    case 'divider':      return <>{warn}<DividerBlock block={block} /></>
    case 'faq':          return <FAQBlock block={block} />
    case 'team':         return <TeamBlock block={block} />
    case 'statistics':   return <>{warn}<StatisticsBlock block={block} /></>
    case 'products':     return <ProductsBlock block={block} />
    case 'collections':  return <CollectionsBlock block={block} />
    case 'newsletter':   return <NewsletterBlock block={block} />
    case 'map':              return <MapSection block={block} />      // → generic map embed (website: story_map)
    case 'destinations_grid': return <MapSection block={block} />   // → Lito destinations grid (website: story_map)
    case 'social_links': return <SocialLinksBlock block={block} />
    case 'html':         return <>{warn}<HTMLBlockComp block={block} /></>
    // ── High-fidelity Lito section renderers ──────────────────────────────────
    case 'hero':         return <HeroSection block={block} />        // → full-bleed dark hero, editable inline
    case 'pricing':      return <PricingSection block={block} />     // → Lito photography pricing cards
    case 'services':     return isLito ? <LitoOfferingSection block={block} /> : <OfferingsSection block={block} />   // → 4-col services card grid
    case 'gallery':      return isLito ? <LitoGallerySection block={block} />  : <GallerySection block={block} />     // → masonry + hover overlay
    case 'portfolio':    return <PortfolioSection block={block} />   // → dark-bg editorial portfolio grid (website: portfolio)
    case 'testimonials': return <TestimonialsSection block={block} />// → dark bg + client list + quote
    case 'journal':      return isLito ? <LitoJournalSection block={block} /> : <JournalSection block={block} />     // → 3-col (lito) / 1+2 editorial
    case 'story':        return isLito ? <LitoStoriesSection block={block} /> : <StoriesSection block={block} />     // → 5-col asymmetric (lito)
    case 'contact_form': return <ContactSection block={block} />     // → split info + form (website: contact)
    case 'cta':          return <>{warn}<CTABlock block={block} /></>  // → generic CTA band
    // ── Lito template section types ───────────────────────────────────────────
    case 'about':        return <AboutSection block={block} />       // → 2-col image + text (website: about)
    case 'campaign':     return <CampaignSection block={block} />    // → full-width campaign banner (website: campaign)
    case 'story_categories': return <CategoriesSection block={block} />// → story category cards (website: story_categories)
    // ── Fashion template section types ────────────────────────────────────────
    case 'page_hero':        return <PageHeroBlock block={block} />        // → full-bleed page hero
    case 'contact_cta':      return <ContactCtaBlock block={block} />      // → dark contact CTA band
    case 'contact_cards':    return <ContactCardsBlock block={block} />    // → contact info cards grid
    case 'new_arrival':      return <NewArrivalBlock block={block} />      // → product grid with title
    case 'brand_story':      return <BrandStoryBlock block={block} />      // → 2-col image + copy
    case 'lookbook':         return <LookbookBlock block={block} />        // → asymmetric editorial gallery
    case 'campaign_banner':  return <CampaignBannerBlock block={block} />  // → full-bleed dark banner
    case 'philosophy':       return <PhilosophyBlock block={block} />      // → numbered value pillars
    case 'timeline':         return <TimelineBlock block={block} />        // → vertical year timeline
    case 'collaborations':   return <CollaborationsBlock block={block} />  // → partner logo grid
    case 'marquee':          return <MarqueeBlock block={block} />         // → scrolling text band
    case 'promo_banners':    return <PromoBannersBlock block={block} />    // → 2-col promo banner grid
    case 'about_cta':        return <AboutCtaBlock block={block} />        // → fullbleed image CTA
    case 'product_carousel': return <ProductCarouselBlock block={block} /> // → horizontal product scroll
    case 'stores':           return <StoresBlock block={block} />          // → multi-store location cards
    case 'social_grid':      return <SocialGridBlock block={block} />      // → social platform grid
    // ── Beauty template section types ─────────────────────────────────────────
    case 'campaigns_grid': return <CampaignsGridBlock block={block} />// → Beauty promotions grid
    // ── Listing page sections (full paginated listing pages rendered as CMS blocks) ─
    case 'journal_listing':  return <JournalListingSection block={block} /> // → paginated journal post grid
    case 'stories_listing':  return <StoriesListingSection block={block} /> // → featured + paginated story grid
    case 'gallery_listing':  return <GalleryListingSection block={block} /> // → masonry gallery with filters
    case 'blogs_listing':    return <JournalListingSection block={block} /> // → same layout as journal_listing
    case 'destinations_listing': return <DestinationsListingSection block={block} />
    // ── Lito-specific listing section types ───────────────────────────────────
    case 'lito_journal_listing':      return <LitoJournalListingSection block={block} />
    case 'lito_stories_listing':      return <LitoStoriesListingSection block={block} />
    case 'lito_gallery_listing':      return <LitoGalleryListingSection block={block} />
    case 'lito_destinations_listing': return <LitoDestinationsListingSection block={block} />
    // ── Aliases — types that share a renderer with an existing case ───────────
    case 'destinations':    return <MapSection block={block} />            // → same as destinations_grid
    case 'offerings':       return isLito ? <LitoOfferingSection block={block} /> : <OfferingsSection block={block} />  // → same as services
    case 'packages':        return <PricingSection block={block} />        // → same as pricing
    case 'booking':         return <ContactSection block={block} />        // → contact form fallback
    case 'stories':         return isLito ? <LitoStoriesSection block={block} /> : <StoriesSection block={block} />  // → same as story
    case 'founder_quote':   return <FounderQuoteBlock block={block} />      // → Beauty dark-bg founder quote (dedicated)
    case 'product_benefits':return <ProductBenefitsBlock block={block} />  // → Beauty alternating benefit cards (dedicated)
    default:
      return (
        <div className="p-4 text-center font-body text-sm text-[var(--text-muted)]">
          Unknown block type: {(block as Block).type}
        </div>
      )
  }
}
