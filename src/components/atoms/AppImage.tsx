/**
 * AppImage — enterprise-grade image component for the CMS editor.
 *
 * Features:
 *  • Skeleton loader while image loads (pulsing gray rect — no layout shift)
 *  • Upload-illustration empty state when src is missing
 *  • Broken-image recovery — swaps to placeholder on load error, never shows
 *    browser's broken-image icon
 *  • lazy loading  (loading="lazy" + decoding="async")
 *  • fetchpriority control ("high" for LCP images, "low" for below-fold)
 *  • Aspect-ratio locking via `ratio` prop — prevents layout shift (CLS)
 *  • object-fit / object-position passthrough
 *  • draggable=false by default (prevents accidental drag-select in editor)
 *  • Full alt validation — warns in dev if alt is empty
 *
 * Usage:
 *   <AppImage src={url} alt="Hero image" ratio="16/9" priority />
 *   <AppImage src={url} alt="Portrait" ratio="4/5" objectFit="cover" />
 *   <AppImage src={url} alt="Logo" ratio="1/1" objectFit="contain" />
 */

import { useState, useEffect, useRef, type ImgHTMLAttributes, type CSSProperties } from 'react'

// ── Built-in SVG placeholders ─────────────────────────────────────────────────

/** Upload / no-image illustration — shown when src is empty */
const EMPTY_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='280' viewBox='0 0 400 280'%3E%3Crect width='400' height='280' fill='%23f9fafb'/%3E%3Crect x='1' y='1' width='398' height='278' rx='3' fill='none' stroke='%23e5e7eb' stroke-width='1' stroke-dasharray='6 4'/%3E%3Cg transform='translate(200 120)'%3E%3Ccircle cx='0' cy='-12' r='22' fill='%23e5e7eb'/%3E%3Cpath d='M-10-18 L0-28 L10-18' stroke='%23d1d5db' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3Cline x1='0' y1='-28' x2='0' y2='-16' stroke='%23d1d5db' stroke-width='2' stroke-linecap='round'/%3E%3C/g%3E%3Ctext x='200' y='160' text-anchor='middle' font-family='system-ui,sans-serif' font-size='13' fill='%239ca3af'%3ENo image%3C/text%3E%3Ctext x='200' y='178' text-anchor='middle' font-family='system-ui,sans-serif' font-size='11' fill='%23d1d5db'%3EUpload or paste a URL%3C/text%3E%3C/svg%3E"

/** Broken-image recovery placeholder */
const ERROR_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='280' viewBox='0 0 400 280'%3E%3Crect width='400' height='280' fill='%23fef2f2'/%3E%3Ctext x='200' y='135' text-anchor='middle' font-family='system-ui,sans-serif' font-size='24' fill='%23fca5a5'%3E%E2%9A%A0%EF%B8%8F%3C/text%3E%3Ctext x='200' y='158' text-anchor='middle' font-family='system-ui,sans-serif' font-size='12' fill='%23f87171'%3EImage failed to load%3C/text%3E%3C/svg%3E"

// ── Types ─────────────────────────────────────────────────────────────────────

type AspectRatio =
  | '1/1' | '4/3' | '3/2' | '16/9' | '21/9'
  | '4/5' | '3/4' | '2/3'   // portrait
  | 'auto'

type ObjectFit = CSSProperties['objectFit']
type FetchPriority = 'high' | 'low' | 'auto'
type LoadingAttr = 'lazy' | 'eager'

interface AppImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'src'> {
  src?: string | null
  alt: string
  /** Aspect ratio — locks the container height to prevent layout shift (CLS) */
  ratio?: AspectRatio
  objectFit?: ObjectFit
  objectPosition?: CSSProperties['objectPosition']
  /** Custom fallback URL shown on error. Defaults to ERROR_PLACEHOLDER. */
  fallback?: string
  /** If true, skip lazy loading (use for LCP/above-fold images) */
  priority?: boolean
  fetchPriority?: FetchPriority
  /** Additional class on the outer wrapper */
  wrapperClass?: string
  /** Additional style on the outer wrapper */
  wrapperStyle?: CSSProperties
  /** Show skeleton animation while loading (default: true) */
  skeleton?: boolean
  /** Border radius on both wrapper and img */
  radius?: CSSProperties['borderRadius']
}

// ── Skeleton animation (injected once) ───────────────────────────────────────

let skeletonInjected = false
function ensureSkeletonCSS() {
  if (skeletonInjected || typeof document === 'undefined') return
  skeletonInjected = true
  const style = document.createElement('style')
  style.textContent = `
    @keyframes _app-img-pulse {
      0%,100% { opacity: 1; }
      50%      { opacity: 0.45; }
    }
    ._app-img-skeleton { animation: _app-img-pulse 1.6s ease-in-out infinite; }
  `
  document.head.appendChild(style)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AppImage({
  src,
  alt,
  ratio = 'auto',
  objectFit = 'cover',
  objectPosition = 'center',
  fallback,
  priority = false,
  fetchPriority = 'auto',
  wrapperClass,
  wrapperStyle,
  skeleton = true,
  radius,
  style,
  className,
  ...rest
}: AppImageProps) {
  // Dev-time alt validation
  if (process.env.NODE_ENV !== 'production' && !alt) {
    console.warn('[AppImage] Missing alt text — add a descriptive alt for accessibility.')
  }

  ensureSkeletonCSS()

  const isEmpty  = !src || src.trim() === ''
  const initSrc  = isEmpty ? EMPTY_PLACEHOLDER : src

  const [current,     setCurrent]     = useState<string>(initSrc)
  const [isLoading,   setIsLoading]   = useState<boolean>(!isEmpty)
  const [hasErrored,  setHasErrored]  = useState<boolean>(false)
  const prevSrc = useRef<string | null | undefined>(src)

  // Reset state when src changes
  useEffect(() => {
    if (prevSrc.current === src) return
    prevSrc.current = src
    if (!src || src.trim() === '') {
      setCurrent(EMPTY_PLACEHOLDER)
      setIsLoading(false)
      setHasErrored(false)
    } else {
      setCurrent(src)
      setIsLoading(true)
      setHasErrored(false)
    }
  }, [src])

  // ── Wrapper style ─────────────────────────────────────────────────────────
  const wrapperCss: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius,
    backgroundColor: 'var(--cms-surface-2, #f3f4f6)',
    ...(ratio !== 'auto' ? { aspectRatio: ratio } : {}),
    ...wrapperStyle,
  }

  // ── Image style ───────────────────────────────────────────────────────────
  const imgCss: CSSProperties = {
    display: 'block',
    width: '100%',
    height: ratio !== 'auto' ? '100%' : 'auto',
    objectFit,
    objectPosition,
    borderRadius: radius,
    transition: 'opacity 0.25s ease',
    opacity: isLoading && skeleton && !isEmpty ? 0 : 1,
    ...style,
  }

  const loading: LoadingAttr = priority ? 'eager' : 'lazy'

  return (
    <div
      className={wrapperClass}
      style={wrapperCss}
      aria-hidden={!alt || undefined}
    >
      {/* Skeleton pulse overlay — shown while loading a real image */}
      {isLoading && skeleton && !isEmpty && !hasErrored && (
        <div
          className="_app-img-skeleton"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, var(--cms-surface-2,#f3f4f6) 25%, var(--cms-surface-3,#e5e7eb) 50%, var(--cms-surface-2,#f3f4f6) 75%)',
            backgroundSize: '200% 100%',
            zIndex: 1,
          }}
        />
      )}

      <img
        {...rest}
        src={current}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        draggable={false}
        style={imgCss}
        className={className}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasErrored(true)
          setIsLoading(false)
          setCurrent(fallback ?? ERROR_PLACEHOLDER)
        }}
      />
    </div>
  )
}

// ── Convenience presets ───────────────────────────────────────────────────────

/** Square thumbnail — for table rows and list views */
export function AppImageThumb({
  size = 48,
  radius = 6,
  ...props
}: AppImageProps & { size?: number }) {
  return (
    <AppImage
      {...props}
      ratio="1/1"
      objectFit="cover"
      radius={radius}
      wrapperStyle={{ width: size, height: size, flexShrink: 0 }}
      skeleton
    />
  )
}

/** Hero / banner image — eager-loaded, full-width */
export function AppImageHero(props: AppImageProps) {
  return <AppImage {...props} ratio={props.ratio ?? '16/9'} priority fetchPriority="high" skeleton={false} />
}

/** Portrait card image — for stories, journal, portfolio cards */
export function AppImageCard(props: AppImageProps) {
  return <AppImage {...props} ratio={props.ratio ?? '4/3'} objectFit="cover" skeleton />
}
