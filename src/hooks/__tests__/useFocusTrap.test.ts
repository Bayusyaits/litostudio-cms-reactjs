/**
 * useFocusTrap — unit tests (AC-08 / WCAG 2.1.2)
 *
 * Strategy: mount a real DOM subtree inside jsdom, attach the hook via
 * renderHook, and drive focus with userEvent keyboard simulation.
 */

import { renderHook } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFocusTrap } from '../useFocusTrap'

// All tests use fake timers so we can advance past the 50ms auto-focus delay
beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

// ── helpers ──────────────────────────────────────────────────────────────────

function buildContainer(html: string): HTMLDivElement {
  const div = document.createElement('div')
  div.innerHTML = html
  document.body.appendChild(div)
  return div
}

function cleanup(el: HTMLElement) {
  document.body.removeChild(el)
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('useFocusTrap', () => {
  let container: HTMLDivElement

  afterEach(() => {
    if (container && document.body.contains(container)) {
      cleanup(container)
    }
  })

  // ── 1. Auto-focus first focusable element ──────────────────────────────────
  it('focuses first focusable element when activated', async () => {
    container = buildContainer(`
      <button id="btn1">One</button>
      <button id="btn2">Two</button>
    `)

    const { result } = renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useFocusTrap(ref, true)
      return ref
    })

    // hook sets a 50ms timeout — advance timers
    await vi.runAllTimersAsync()

    expect(document.activeElement).toBe(container.querySelector('#btn1'))
    result.current // satisfy lint
  })

  // ── 2. Inactive — does NOT steal focus ────────────────────────────────────
  it('does not focus anything when active=false', async () => {
    const outside = document.createElement('input')
    document.body.appendChild(outside)
    outside.focus()

    container = buildContainer('<button id="inside">Inside</button>')

    renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useFocusTrap(ref, false)
    })

    await vi.runAllTimersAsync()

    expect(document.activeElement).toBe(outside)
    document.body.removeChild(outside)
  })

  // ── 3. Escape calls onEscape callback ─────────────────────────────────────
  it('calls onEscape when Escape key is pressed', async () => {
    const user = userEvent.setup({ delay: null })
    container = buildContainer('<button id="btn">Close</button>')

    const onEscape = vi.fn()

    renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useFocusTrap(ref, true, onEscape)
    })

    await vi.runAllTimersAsync()
    container.querySelector<HTMLButtonElement>('#btn')!.focus()

    await user.keyboard('{Escape}')

    expect(onEscape).toHaveBeenCalledOnce()
  })

  // ── 4. Tab wraps forward: last → first ────────────────────────────────────
  it('wraps Tab from last to first focusable element', async () => {
    const user = userEvent.setup({ delay: null })
    container = buildContainer(`
      <button id="a">A</button>
      <button id="b">B</button>
      <button id="c">C</button>
    `)

    renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useFocusTrap(ref, true)
    })

    await vi.runAllTimersAsync()

    // Manually focus last button to test wrap
    const last = container.querySelector<HTMLButtonElement>('#c')!
    last.focus()
    expect(document.activeElement).toBe(last)

    await user.keyboard('{Tab}')

    expect(document.activeElement).toBe(container.querySelector('#a'))
  })

  // ── 5. Shift+Tab wraps backward: first → last ─────────────────────────────
  it('wraps Shift+Tab from first to last focusable element', async () => {
    const user = userEvent.setup({ delay: null })
    container = buildContainer(`
      <button id="x">X</button>
      <button id="y">Y</button>
    `)

    renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useFocusTrap(ref, true)
    })

    await vi.runAllTimersAsync()

    const first = container.querySelector<HTMLButtonElement>('#x')!
    first.focus()

    await user.keyboard('{Shift>}{Tab}{/Shift}')

    expect(document.activeElement).toBe(container.querySelector('#y'))
  })

  // ── 6. Restores focus on unmount ──────────────────────────────────────────
  it('restores focus to previously-focused element on deactivation', async () => {
    const trigger = document.createElement('button')
    trigger.id = 'trigger'
    document.body.appendChild(trigger)
    trigger.focus()

    container = buildContainer('<button id="modal-btn">Action</button>')

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useFocusTrap(ref, true)
    })

    await vi.runAllTimersAsync()

    unmount()

    // focus should return to the element that was active before the trap
    expect(document.activeElement).toBe(trigger)
    document.body.removeChild(trigger)
  })

  // ── 7. No focusable children — Tab does not throw ────────────────────────
  it('handles container with no focusable children gracefully', async () => {
    const user = userEvent.setup({ delay: null })
    container = buildContainer('<p>No interactive elements here</p>')

    expect(() => {
      renderHook(() => {
        const ref = useRef<HTMLElement>(container)
        useFocusTrap(ref, true)
      })
    }).not.toThrow()

    await vi.runAllTimersAsync()

    // Tab should not throw even with no focusable elements
    await expect(user.keyboard('{Tab}')).resolves.not.toThrow()
  })

  // ── 8. details > summary is included in focusable set ────────────────────
  it('includes details > summary in focusable selector', async () => {
    container = buildContainer(`
      <details>
        <summary id="sum">Toggle</summary>
        <p>Content</p>
      </details>
    `)

    renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useFocusTrap(ref, true)
    })

    await vi.runAllTimersAsync()

    expect(document.activeElement).toBe(container.querySelector('#sum'))
  })
})
