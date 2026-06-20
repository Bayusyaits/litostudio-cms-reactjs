/**
 * IframeCanvas — renders the live Nuxt website inside an iframe and overlays
 * CMS chrome badges using absolute positioning based on section bounds
 * reported by the website via postMessage.
 *
 * The iframe renders /preview on the Nuxt dev server (or production URL).
 * All editing interactions happen in the overlay layer — nothing is injected
 * into the website bundle.
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { useEditorStore }   from '@/stores/editor.store'
import { usePreviewBridge } from '@/hooks/usePreviewBridge'
import type { SectionBound }from '@/hooks/usePreviewBridge'
import type { PreviewMode } from '@/types/editor.types'

const PREVIEW_URL = (import.meta.env.VITE_WEBSITE_PREVIEW_URL ?? 'http://localhost:3000') + '/preview'

/**
 * The "canonical desktop" viewport width that templates are designed for.
 * Mirrors the value used in canvas-website-tokens.css and block defaults.
 */
const DESKTOP_DESIGN_WIDTH = 1440

// ── Section chrome badge (same visual as existing inline badge) ───────────────

interface SectionBadgeProps {
  label:      string
  isSelected: boolean
  isHovered:  boolean
  rect:       SectionBound['rect']
  zoomLevel:  number
  onClick:    () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function SectionBadge({ label, isSelected, isHovered, rect, zoomLevel, onClick, onMouseEnter, onMouseLeave }: SectionBadgeProps) {
  const scale = zoomLevel / 100
  const top    = rect.top    * scale
  const left   = rect.left   * scale
  const width  = rect.width  * scale
  const height = rect.height * scale

  const ring: string = isSelected
    ? 'inset 0 0 0 2px var(--lito-teal, #2DD4BF)'
    : isHovered
      ? 'inset 0 0 0 1px rgba(45,212,191,0.4)'
      : 'none'

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position:  'absolute',
        top,
        left,
        width,
        height,
        boxShadow: ring,
        zIndex:    isSelected ? 20 : isHovered ? 10 : 0,
        pointerEvents: 'all',
        cursor: 'pointer',
      }}
    >
      {(isSelected || isHovered) && (
        <div
          style={{
            position: 'absolute', top: 10, left: 10, zIndex: 22,
            display: 'inline-flex', alignItems: 'center', gap: 1,
            background: 'rgba(13,13,13,0.85)',
            border: '1px solid rgba(201,162,90,0.45)',
            borderRadius: 6,
            backdropFilter: 'blur(6px)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <span style={{
            padding: '4px 10px',
            fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
            fontSize: 10, fontWeight: 600, letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'rgba(201,162,90,0.9)',
          }}>
            {label}
          </span>
          <span style={{ width: 1, alignSelf: 'stretch', background: 'rgba(201,162,90,0.2)' }} />
          <span style={{
            padding: '4px 8px',
            fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
            fontSize: 10, color: 'rgba(255,255,255,0.55)',
          }}>
            ✎ Edit
          </span>
          <span style={{ width: 1, alignSelf: 'stretch', background: 'rgba(201,162,90,0.15)' }} />
          <span style={{
            padding: '4px 8px',
            fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
            fontSize: 10, color: 'rgba(255,255,255,0.55)',
          }}>
            ⧉ Duplicate
          </span>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface IframeCanvasProps {
  previewMode: PreviewMode
  zoomLevel:   number
}

export function IframeCanvas({ previewMode, zoomLevel }: IframeCanvasProps) {
  const { blockDoc, selectedBlockId, selectBlock } = useEditorStore()
  const iframeRef    = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [bounds,       setBounds]      = useState<SectionBound[]>([])
  const [hoveredId,    setHoveredId]   = useState<string | null>(null)
  const [containerW,   setContainerW]  = useState<number>(0)

  usePreviewBridge({
    iframeRef,
    onBoundsChange:  useCallback((b: SectionBound[]) => setBounds(b), []),
    onHoveredChange: useCallback((id: string | null) => setHoveredId(id), []),
  })

  // ── Measure canvas area with ResizeObserver ───────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      setContainerW(w)
    })
    ro.observe(el)
    // Set immediately on mount
    setContainerW(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  // ── Canvas sizing logic ────────────────────────────────────────────────────
  // Desktop: render iframe at DESKTOP_DESIGN_WIDTH, then scale to fit the
  // actual canvas area. This ensures the editor shows how the site looks at
  // 1440px, not squeezed into the ~840px gap between sidebars.
  //
  // Mobile/tablet: fixed-width viewport, scaled by user zoom level.

  const isDesktop = previewMode === 'desktop'

  // Width the iframe renders at (its CSS width / viewport)
  const iframeViewportW: number | string =
    previewMode === 'mobile' ? 375 :
    previewMode === 'tablet' ? 768 :
    DESKTOP_DESIGN_WIDTH

  // Height the iframe renders at
  const iframeViewportH: number | string =
    previewMode === 'mobile' ? 812 :
    previewMode === 'tablet' ? 1024 :
    '100%'

  // Scale factor applied to the iframe element
  // Desktop: shrink 1440 → containerW, then apply user zoom on top
  // Mobile/tablet: user zoom only
  const fitScale = isDesktop && containerW > 0
    ? containerW / DESKTOP_DESIGN_WIDTH
    : 1

  const userScale   = zoomLevel / 100
  const totalScale  = fitScale * userScale

  // Outer wrapper dimensions — what the overlay and scroll container see
  // For desktop: the wrapper is exactly containerW wide (the scaled iframe takes that space)
  // For mobile/tablet: the wrapper matches the zoomed fixed width
  const wrapperW = isDesktop
    ? (containerW > 0 ? containerW * userScale : '100%')
    : (typeof iframeViewportW === 'number' ? iframeViewportW * userScale : '100%')

  // The overlay scale should match the scale applied to the iframe so that
  // SectionBadge rects (which come from the website's own pixel coordinates)
  // map correctly onto the overlay.
  const overlayScale = totalScale

  return (
    // Outer div fills the canvas area — used only for ResizeObserver measurement
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', flex: 1 }}
    >
      <div
        style={{
          position:   'relative',
          width:      wrapperW,
          height:     '100%',
          overflow:   'hidden',
          margin:     '0 auto',
        }}
      >
        {/* Live website iframe */}
        <iframe
          ref={iframeRef}
          src={PREVIEW_URL}
          title="Live website preview"
          style={{
            width:           iframeViewportW,
            height:          iframeViewportH,
            border:          'none',
            display:         'block',
            // Apply combined scale; skip identity transform to avoid GPU layers
            transform:       totalScale !== 1 ? `scale(${totalScale})` : undefined,
            transformOrigin: 'top left',
          }}
          allow="same-origin"
        />

        {/* Transparent overlay — intercepts clicks, renders badges */}
        <div
          style={{
            position:      'absolute',
            inset:         0,
            pointerEvents: 'none',
          }}
        >
          {bounds.map(({ blockId, rect }) => {
            const block = blockDoc.blocks.find((b) => b.id === blockId)
            if (!block) return null
            return (
              <SectionBadge
                key={blockId}
                label={block.name ?? block.type}
                isSelected={selectedBlockId === blockId}
                isHovered={hoveredId === blockId}
                rect={rect}
                // Pass effective scale so badge rects align with scaled iframe
                zoomLevel={overlayScale * 100}
                onClick={() => selectBlock(blockId)}
                onMouseEnter={() => setHoveredId(blockId)}
                onMouseLeave={() => setHoveredId(null)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
