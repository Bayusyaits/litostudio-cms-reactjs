/**
 * HeroSection — high-fidelity canvas replica of website HeroSection.vue
 *
 * Full-bleed dark hero with:
 *  - Background image + gradient overlay
 *  - Cormorant Garamond display title (regular + italic second line)
 *  - Eyebrow label (gold, uppercase)
 *  - Subtitle paragraph
 *  - Primary + secondary CTA buttons
 *  - Bottom stat / location bar
 *
 * Inline contentEditable editing when block is selected.
 * Lito design tokens: --lito-gold, --font-body, --font-display
 */

import type { Block, HeroBlockData } from '@/types/editor.types'
import { useEditorStore } from '@/stores/editor.store'

export function HeroSection({ block }: { block: Block }) {
  const d = block.data as HeroBlockData
  const { selectedBlockId, updateBlock } = useEditorStore()
  const isSelected = selectedBlockId === block.id
  const overlay = d.backgroundOverlay ?? 55

  const alignStyle: React.CSSProperties = {
    textAlign:  d.align === 'center' ? 'center' : d.align === 'right' ? 'right' : 'left',
    alignItems: d.align === 'center' ? 'center' : d.align === 'right' ? 'flex-end' : 'flex-start',
  }

  // Shared contentEditable props — blur saves to store
  const editableProps = (
    field: keyof HeroBlockData,
  ): React.HTMLAttributes<HTMLElement> & { suppressContentEditableWarning?: boolean } => ({
    contentEditable: isSelected,
    suppressContentEditableWarning: true,
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      const val = e.currentTarget.textContent ?? ''
      updateBlock(block.id, { [field]: val })
    },
    style: { outline: 'none', cursor: isSelected ? 'text' : 'inherit' } as React.CSSProperties,
  })

  const hasBg   = !!d.backgroundImage
  const bgColor = (block.styles?.backgroundColor as string | undefined) ?? 'var(--canvas-hero-bg-fallback, #0d0d0d)'

  return (
    <div
      style={{
        position:        'relative',
        minHeight:       d.minHeight ?? 600,
        backgroundColor: bgColor,
        backgroundImage: hasBg ? `url(${d.backgroundImage})` : undefined,
        backgroundSize:  'cover',
        backgroundPosition: 'center',
        overflow:        'hidden',
        paddingTop:      0,
        paddingBottom:   0,
      }}
    >
      {/* Dark gradient overlay */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: hasBg
            ? `linear-gradient(to bottom, rgba(0,0,0,${overlay / 100}) 0%, rgba(0,0,0,${Math.min(overlay / 100 + 0.2, 1)}) 100%)`
            : 'linear-gradient(160deg, #111111 0%, #1a1a1a 100%)',
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column',
          ...alignStyle,
          maxWidth: 960, margin: '0 auto',
          padding: '120px 48px 100px',
          gap: 0,
        }}
      >
        {/* Eyebrow */}
        {(d.eyebrow || isSelected) && (
          <span
            {...editableProps('eyebrow')}
            style={{
              ...editableProps('eyebrow').style,
              display: 'block',
              fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--lito-gold, #D4A853)',
              marginBottom: 24,
              opacity: d.eyebrow ? 1 : 0.4,
            }}
          >
            {d.eyebrow || (isSelected ? 'EYEBROW LABEL' : '')}
          </span>
        )}

        {/* Title */}
        <h1
          {...editableProps('title')}
          style={{
            ...editableProps('title').style,
            fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
            fontSize: 'clamp(48px, 6vw, 78px)',
            fontWeight: 300,
            lineHeight: 0.98,
            letterSpacing: '-0.02em',
            color: 'var(--canvas-hero-title, #ffffff)',
            margin: 0,
            marginBottom: d.titleItalic ? 4 : 20,
          }}
        >
          {d.title || (isSelected ? 'Hero Title' : '')}
        </h1>

        {/* Title italic (second display line) */}
        {(d.titleItalic || isSelected) && (
          <span
            {...editableProps('titleItalic')}
            style={{
              ...editableProps('titleItalic').style,
              display: 'block',
              fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
              fontSize: 'clamp(48px, 6vw, 78px)',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'var(--canvas-hero-title, #ffffff)',
              marginBottom: 28,
              opacity: d.titleItalic ? 1 : 0.3,
            }}
          >
            {d.titleItalic || (isSelected ? 'italic portion' : '')}
          </span>
        )}

        {/* Subtitle */}
        {(d.subtitle || isSelected) && (
          <p
            {...editableProps('subtitle')}
            style={{
              ...editableProps('subtitle').style,
              fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
              fontSize: 15,
              lineHeight: 1.6,
              color: 'var(--canvas-hero-subtitle, rgba(255,255,255,0.72))',
              maxWidth: 520,
              margin: 0,
              marginBottom: 36,
              opacity: d.subtitle ? 1 : 0.4,
            }}
          >
            {d.subtitle || (isSelected ? 'Supporting subtitle text goes here...' : '')}
          </p>
        )}

        {/* CTA buttons */}
        <div
          style={{
            display: 'flex', gap: 12, flexWrap: 'wrap',
            justifyContent: d.align === 'center' ? 'center' : 'flex-start',
          }}
        >
          {(d.ctaText || isSelected) && (
            <span
              {...editableProps('ctaText')}
              style={{
                ...editableProps('ctaText').style,
                display: 'inline-block',
                padding: '12px 28px',
                background: 'var(--lito-gold, #D4A853)',
                color: 'var(--canvas-accent-fg, #111111)',
                fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderRadius: 2,
                opacity: d.ctaText ? 1 : 0.5,
              }}
            >
              {d.ctaText || (isSelected ? 'Lihat Portfolio' : '')}
            </span>
          )}
          {(d.ctaSecondaryText || isSelected) && (
            <span
              {...editableProps('ctaSecondaryText')}
              style={{
                ...editableProps('ctaSecondaryText').style,
                display: 'inline-block',
                padding: '12px 28px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.4)',
                color: 'var(--canvas-hero-ghost, rgba(255,255,255,0.85))',
                fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderRadius: 2,
                opacity: d.ctaSecondaryText ? 1 : 0.3,
              }}
            >
              {d.ctaSecondaryText || (isSelected ? 'Hubungi Kami' : '')}
            </span>
          )}
        </div>

        {/* Bottom stat + location bar */}
        {(d.stat || d.location || isSelected) && (
          <div
            style={{
              display: 'flex', gap: 32, marginTop: 64,
              borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20,
              justifyContent: d.align === 'center' ? 'center' : 'flex-start',
            }}
          >
            {(d.stat || isSelected) && (
              <span
                {...editableProps('stat')}
                style={{
                  ...editableProps('stat').style,
                  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
                  fontSize: 13,
                  color: 'var(--canvas-hero-stat, rgba(255,255,255,0.5))',
                  letterSpacing: '0.06em',
                  opacity: d.stat ? 1 : 0.3,
                }}
              >
                {d.stat || (isSelected ? '500+ sesi' : '')}
              </span>
            )}
            {(d.location || isSelected) && (
              <span
                {...editableProps('location')}
                style={{
                  ...editableProps('location').style,
                  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
                  fontSize: 13,
                  color: 'var(--canvas-hero-stat, rgba(255,255,255,0.5))',
                  letterSpacing: '0.06em',
                  opacity: d.location ? 1 : 0.3,
                }}
              >
                {d.location || (isSelected ? 'Jakarta · Yogyakarta · Jawa Tengah' : '')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
