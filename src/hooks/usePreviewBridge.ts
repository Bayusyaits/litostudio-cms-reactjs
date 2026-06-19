/**
 * usePreviewBridge — CMS side of the iframe postMessage protocol.
 *
 * Usage: call once inside IframeCanvas, pass the iframe ref.
 *
 * Responsibilities:
 *  1. Wait for `preview:ready` from iframe, then send `cms:init`.
 *  2. Whenever `blockDoc` or `selectedBlockId` changes, forward to iframe.
 *  3. Listen for `preview:section-click` → selectBlock().
 *  4. Listen for `preview:section-hover` → update hovered state.
 *  5. Listen for `preview:section-bounds` → store for overlay positioning.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore }   from '@/stores/editor.store'
import { useWebsiteStore }  from '@/stores/website.store'
import type { CmsToPreviewMessage, PreviewToCmsMessage, SectionRect } from '@litostudio/template-system'

export interface SectionBound {
  blockId: string
  rect:    SectionRect
}

interface UsePreviewBridgeOptions {
  iframeRef:         React.RefObject<HTMLIFrameElement | null>
  onBoundsChange?:   (bounds: SectionBound[]) => void
  onHoveredChange?:  (blockId: string | null) => void
}

export function usePreviewBridge({
  iframeRef,
  onBoundsChange,
  onHoveredChange,
}: UsePreviewBridgeOptions) {
  const { blockDoc, selectedBlockId, selectBlock } = useEditorStore()
  const { activeSite } = useWebsiteStore()
  const iframeReadyRef = useRef(false)

  // ── Post to iframe ─────────────────────────────────────────────────────────

  const post = useCallback((msg: CmsToPreviewMessage) => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.postMessage(msg, '*')
  }, [iframeRef])

  // ── Send full init when iframe becomes ready ───────────────────────────────

  const sendInit = useCallback(() => {
    const settings     = activeSite?.settings as Record<string, unknown> | null | undefined
    const templateSlug = (settings?.template_slug as string | undefined) ?? 'lito'
    post({
      type:     'cms:init',
      blocks:   blockDoc.blocks,
      template: templateSlug,
      locale:   blockDoc.locale ?? 'id',
    })
  }, [post, blockDoc, activeSite])

  // ── Incoming postMessage from iframe ──────────────────────────────────────

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data as PreviewToCmsMessage
      if (!msg?.type?.startsWith('preview:')) return

      switch (msg.type) {
        case 'preview:ready':
          iframeReadyRef.current = true
          sendInit()
          break
        case 'preview:section-click':
          selectBlock(msg.blockId)
          break
        case 'preview:section-hover':
          onHoveredChange?.(msg.blockId)
          break
        case 'preview:section-bounds':
          onBoundsChange?.(msg.sections)
          break
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [sendInit, selectBlock, onBoundsChange, onHoveredChange])

  // ── Forward block updates to iframe ───────────────────────────────────────

  const sentDocRef = useRef<string>('')

  useEffect(() => {
    if (!iframeReadyRef.current) return
    const serial = JSON.stringify(blockDoc.blocks)
    if (serial === sentDocRef.current) return
    sentDocRef.current = serial
    // Re-init to sync full block array (handles add/remove/reorder)
    sendInit()
  }, [blockDoc.blocks, sendInit])

  // ── Forward selection to iframe ───────────────────────────────────────────

  useEffect(() => {
    if (!iframeReadyRef.current) return
    post({ type: 'cms:select', blockId: selectedBlockId })
  }, [selectedBlockId, post])

  return { post, sendInit }
}
