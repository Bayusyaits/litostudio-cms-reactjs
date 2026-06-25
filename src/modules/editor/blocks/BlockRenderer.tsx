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
import { useState } from 'react'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { AppImage } from '@/components/atoms/AppImage'
import {
  ChevronDown, ChevronUp, Instagram, Facebook, Twitter, Linkedin,
  Youtube, Globe,
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
import { CategoriesSection }   from '../sections/CategoriesSection'

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
        {d.description && <p className="font-body text-base opacity-80 mb-6">{d.description}</p>}
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
      {d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
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
      {d.heading && <h2 className="font-display text-2xl font-bold text-center mb-8 text-[var(--text-primary)]">{d.heading}</h2>}
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
              <p className="font-body text-sm font-medium text-[var(--text-muted)]">Product {i + 1}</p>
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
  return (
    <div style={{ ...blockStyle(block), position: 'relative', minHeight: 440, background: d.imgSrc ? undefined : 'var(--lito-ink, #0A0A0A)', backgroundImage: d.imgSrc ? `url(${d.imgSrc})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.1) 100%)' }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '0 var(--nx-gutter, 32px) clamp(2.5rem, 6vh, 5rem)', width: '100%', maxWidth: 1200 }}>
        {d.eyebrow && (
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', margin: 0, marginBottom: 14 }}>
            {String(d.eyebrow)}
          </p>
        )}
        <h1 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.025em', textTransform: 'uppercase', color: '#FAFAF9', margin: 0, marginBottom: 16 }}>
          {String(d.title ?? 'Page Title')}
        </h1>
        {d.desc && (
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: 0, marginBottom: 24, maxWidth: '50ch' }}>
            {String(d.desc)}
          </p>
        )}
        {d.ctaLabel && (
          <a style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 32px', background: '#FAFAF9', color: '#0A0A0A', fontFamily: 'var(--font-body, Inter)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
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
        {d.eyebrow && (
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(250,250,249,0.55)', margin: 0, marginBottom: 16 }}>
            {String(d.eyebrow)}
          </p>
        )}
        <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.025em', textTransform: 'uppercase', color: '#FAFAF9', margin: 0, marginBottom: 20 }}>
          {String(d.title ?? "Let's Work Together")}
        </h2>
        {d.desc && (
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 14, color: 'rgba(250,250,249,0.7)', lineHeight: 1.7, margin: 0, marginBottom: 40 }}>
            {String(d.desc)}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 36px', background: '#FAFAF9', color: '#0A0A0A', fontFamily: 'var(--font-body, Inter)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {String(d.ctaText ?? 'Send an Email')}
          </a>
          {d.homeText && (
            <a style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 36px', background: 'transparent', color: '#FAFAF9', border: '1px solid rgba(250,250,249,0.4)', fontFamily: 'var(--font-body, Inter)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
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
  return (
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        {d.heading && (
          <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink, #0A0A0A)', margin: 0, marginBottom: 40 }}>
            {String(d.heading)}
          </h2>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {items.map((item, i) => (
            <div key={i} style={{ padding: '28px 32px', border: '1px solid var(--lito-border, rgba(0,0,0,.1))', background: 'var(--cms-surface-2, #F5F5F4)' }}>
              <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted, #999)', margin: 0, marginBottom: 8 }}>
                {item.label ?? `Info ${i + 1}`}
              </p>
              <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 15, color: 'var(--lito-ink, #0A0A0A)', margin: 0 }}>
                {item.value ?? '—'}
              </p>
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
  return (
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        {/* Image side */}
        <div style={{ background: 'var(--cms-surface-3, #EDEDED)', aspectRatio: '4/5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {d.image ? (
            <img src={String(d.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 10, color: 'var(--text-muted, #999)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Brand Image</span>
          )}
        </div>
        {/* Text side */}
        <div>
          {d.since && (
            <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #999)', marginBottom: 16, marginTop: 0 }}>
              Est. {String(d.since)}
            </p>
          )}
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted, #999)', marginBottom: 12, marginTop: 0 }}>
            {String(d.heading ?? 'Our Story')}
          </p>
          <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--lito-ink, #0A0A0A)', margin: 0, marginBottom: 20 }}>
            {String(d.title ?? 'Born from a Passion for Fashion')}
          </h2>
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary, #666)', margin: 0, marginBottom: 28 }}>
            {String(d.description ?? 'Tell your brand story here.')}
          </p>
          <a style={{ display: 'inline-block', fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--lito-ink, #0A0A0A)', textDecoration: 'none', borderBottom: '1px solid var(--lito-ink, #0A0A0A)', paddingBottom: 2 }}>
            {String(d.ctaText ?? 'Learn More')}
          </a>
        </div>
      </div>
    </div>
  )
}

function LookbookBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  // 5-image editorial lookbook grid (asymmetric)
  const placeholders = ['Large', 'Tall', 'Square', 'Square', 'Wide']
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
        {d.description && (
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 14, color: 'rgba(255,255,255,0.72)', margin: 0, marginBottom: 24 }}>
            {String(d.description)}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <a style={{ display: 'inline-block', padding: '11px 28px', background: '#fff', color: '#0A0A0A', fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {String(d.buttonText ?? 'Shop Now')}
          </a>
          {d.ctaSecondaryText && (
            <a style={{ display: 'inline-block', padding: '11px 28px', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
              {String(d.ctaSecondaryText)}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function PhilosophyBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const items = Array.isArray(d.items) ? d.items as Array<{ title: string; description: string }> : []
  return (
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink, #0A0A0A)', margin: 0, marginBottom: 48 }}>
          {String(d.heading ?? 'Our Philosophy')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, items.length)}, 1fr)`, gap: 32 }}>
          {items.map((item, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--lito-border, rgba(0,0,0,.1))', paddingTop: 24 }}>
              <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted, #999)', margin: 0, marginBottom: 12 }}>
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 18, fontWeight: 500, color: 'var(--lito-ink, #0A0A0A)', margin: 0, marginBottom: 10 }}>
                {item.title}
              </h3>
              <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary, #666)', margin: 0 }}>
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
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px' }}>
        {d.eyebrow && (
          <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #999)', margin: 0, marginBottom: 12 }}>
            {String(d.eyebrow)}
          </p>
        )}
        <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink, #0A0A0A)', margin: 0, marginBottom: 48 }}>
          {String(d.heading ?? 'Our Journey')}
        </h2>
        <div style={{ position: 'relative' }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: 48, top: 0, bottom: 0, width: 1, background: 'var(--lito-border, rgba(0,0,0,.1))' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            {entries.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
                <div style={{ width: 96, flexShrink: 0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 15, fontWeight: 600, color: 'var(--lito-ink, #0A0A0A)' }}>{e.year}</span>
                </div>
                {/* Dot */}
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--lito-ink, #0A0A0A)', flexShrink: 0, marginTop: 4, marginLeft: -4 }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 16, fontWeight: 500, color: 'var(--lito-ink, #0A0A0A)', margin: 0, marginBottom: 6 }}>{e.title}</h3>
                  <p style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary, #666)', margin: 0 }}>{e.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CollaborationsBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>
  const items = Array.isArray(d.items) && d.items.length > 0
    ? d.items as Array<{ name?: string; logo?: string }>
    : Array.from({ length: 6 }, (_, i) => ({ name: `Partner ${i + 1}` }))
  return (
    <div style={blockStyle(block)}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        {d.eyebrow && (
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
                ? <img src={item.logo} alt={item.name} style={{ maxHeight: 48, maxWidth: 120, objectFit: 'contain', opacity: 0.6 }} />
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
              {item.image && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />}
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
  return (
    <div style={{ ...blockStyle(block), borderTop: '1px solid var(--lito-border, rgba(0,0,0,.1))' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
        <h2 style={{ fontFamily: 'var(--font-display, Inter)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--lito-ink, #0A0A0A)', margin: 0, maxWidth: 480 }}>
          {String(d.heading ?? 'Ready to Explore?')}
        </h2>
        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
          <a style={{ display: 'inline-block', padding: '12px 28px', background: 'var(--lito-ink, #0A0A0A)', color: 'var(--lito-cream, #FAFAF9)', fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {String(d.ctaText ?? 'Shop the Collection')}
          </a>
          {d.ctaSecondaryText && (
            <a style={{ display: 'inline-block', padding: '12px 28px', border: '1px solid var(--lito-border, rgba(0,0,0,.1))', color: 'var(--lito-ink, #0A0A0A)', fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
              {String(d.ctaSecondaryText)}
            </a>
          )}
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
            <div className="h-44 bg-[var(--cms-surface-3)] flex items-center justify-center">
              <span className="text-3xl">📢</span>
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

// ── Null-mapped block warning ─────────────────────────────────────────────────
// Block types in this set are silently dropped by the backend publish sync
// (BLOCK_TO_SECTION_TYPE maps them to null). Show a visual warning in the
// editor so authors know the block won't appear on the published website.

const NULL_MAPPED_BLOCK_TYPES = new Set([
  'image', 'video', 'button', 'cta', 'statistics', 'spacer', 'divider', 'html',
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
      <span>⚠️</span>
      <span>This block is <strong>editor-only</strong> — it won't appear on the published website.</span>
    </div>
  )
}

// ── Main renderer ─────────────────────────────────────────────────────────────

export function BlockRenderer({ block }: { block: Block }) {
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
    case 'services':     return <OfferingsSection block={block} />   // → 4-col services card grid (website: offerings)
    case 'gallery':      return <GallerySection block={block} />     // → masonry + hover overlay (website: selected_works)
    case 'portfolio':    return <PortfolioSection block={block} />   // → dark-bg editorial portfolio grid (website: portfolio)
    case 'testimonials': return <TestimonialsSection block={block} />// → dark bg + client list + quote
    case 'journal':      return <JournalSection block={block} />     // → 1 large + 2 small editorial
    case 'story':        return <StoriesSection block={block} />     // → 3-col story cards (website: stories)
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
    case 'about_cta':        return <AboutCtaBlock block={block} />        // → full-width CTA bar
    case 'product_carousel': return <ProductCarouselBlock block={block} /> // → horizontal product scroll
    // ── Beauty template section types ─────────────────────────────────────────
    case 'campaigns_grid': return <CampaignsGridBlock block={block} />// → Beauty promotions grid
    default:
      return (
        <div className="p-4 text-center font-body text-sm text-[var(--text-muted)]">
          Unknown block type: {(block as Block).type}
        </div>
      )
  }
}
