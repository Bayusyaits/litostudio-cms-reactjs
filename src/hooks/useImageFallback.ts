/**
 * useImageFallback — handles broken image src gracefully.
 *
 * Returns `{ src, onError }` to spread onto an <img> element.
 * On load failure the src is swapped to the placeholder so the
 * broken-image icon never shows.
 */
import { useState, useCallback } from 'react'

/** 1×1 light-gray SVG data URI — zero network request */
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect width='1' height='1' fill='%23e5e7eb'/%3E%3C/svg%3E"

export function useImageFallback(initial?: string) {
  const [src, setSrc] = useState<string>(initial || PLACEHOLDER)

  const onError = useCallback(() => {
    setSrc(PLACEHOLDER)
  }, [])

  return { src: initial || PLACEHOLDER, dynamicSrc: src, onError, PLACEHOLDER }
}
