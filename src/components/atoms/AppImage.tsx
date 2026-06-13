/**
 * AppImage — drop-in replacement for <img> that:
 *   1. Shows a placeholder (light-gray SVG) while loading
 *   2. Silently swaps to the same placeholder on error — no broken-image icon
 *   3. Accepts all standard <img> props
 *
 * Usage:
 *   <AppImage src={url} alt="Description" style={{ width: '100%' }} />
 */
import { useState, useEffect, type ImgHTMLAttributes } from 'react'

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3ENo image%3C/text%3E%3C/svg%3E"

interface AppImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string
  alt: string
  /** Fallback src to use on error (defaults to built-in placeholder) */
  fallback?: string
}

export function AppImage({ src, alt, fallback, style, ...rest }: AppImageProps) {
  const effective = src && src.trim() !== '' ? src : (fallback ?? PLACEHOLDER)
  const [current, setCurrent] = useState<string>(effective)

  // Reset when src prop changes
  useEffect(() => {
    setCurrent(effective)
  }, [effective])

  return (
    <img
      {...rest}
      src={current}
      alt={alt}
      style={{ ...style }}
      onError={() => setCurrent(fallback ?? PLACEHOLDER)}
    />
  )
}
