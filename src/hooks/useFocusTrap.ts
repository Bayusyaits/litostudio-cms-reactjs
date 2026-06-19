/**
 * useFocusTrap — AC-08: WCAG 2.1.2 No Keyboard Trap
 *
 * Traps Tab / Shift+Tab focus within a dialog container and closes on Escape.
 * Restores focus to the previously-focused element when the trap is removed.
 *
 * Usage:
 *   const dialogRef = useRef<HTMLDivElement>(null)
 *   useFocusTrap(dialogRef, isOpen, onClose)
 *
 *   <div ref={dialogRef} role="dialog" aria-modal="true" ...>
 */

import { useEffect, type RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(', ')

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
) {
  useEffect(() => {
    if (!active) return
    const container = ref.current
    if (!container) return

    // Save element that had focus before modal opened
    const previouslyFocused = document.activeElement as HTMLElement | null

    // Auto-focus first focusable element
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (focusable.length > 0) {
      // Small delay lets the modal finish rendering / animating
      const t = setTimeout(() => focusable[0].focus(), 50)

      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          onEscape?.()
          return
        }
        if (e.key !== 'Tab') return

        // Re-query each time in case DOM changed (e.g. form validation messages)
        const els = Array.from(container!.querySelectorAll<HTMLElement>(FOCUSABLE))
        if (els.length === 0) { e.preventDefault(); return }

        const first = els[0]
        const last  = els[els.length - 1]

        if (e.shiftKey) {
          // Shift+Tab: wrap to last
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          // Tab: wrap to first
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }

      container.addEventListener('keydown', handleKeyDown)

      return () => {
        clearTimeout(t)
        container.removeEventListener('keydown', handleKeyDown)
        // Restore focus to the element that opened the modal
        previouslyFocused?.focus?.()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}
