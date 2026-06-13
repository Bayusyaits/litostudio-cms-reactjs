/**
 * draftMediaStore — deferred upload for CMS image fields.
 *
 * Problem: ImageUploader previously uploaded to R2 on every file selection,
 * even when the user cancelled the form. This wastes bandwidth and storage quota.
 *
 * Solution:
 *   1. On file select → URL.createObjectURL() for instant preview + register here.
 *   2. On form save  → call resolveUrl(blobUrl) to upload and get the real CDN URL.
 *   3. If the user cancels → revokeDraft() cleans up the object URL.
 *
 * Usage in a form save handler:
 *
 *   import { draftMediaStore } from '@/stores/draftMedia.store'
 *
 *   const resolvedImageUrl = await draftMediaStore.resolveUrl(imageUrl)
 *   // resolvedImageUrl is now a real CDN URL; use it in the API payload
 */

import { create } from 'zustand'
import { mediaService } from '@/services/media.service'

// ── Internal types ─────────────────────────────────────────────────────────────

interface DraftEntry {
  file:   File
  folder: string
}

interface DraftMediaState {
  /** blob URL → file entry */
  drafts: Map<string, DraftEntry>

  /**
   * Register a file: create a preview blob URL and store the file.
   * Returns the blob URL to use as the image preview src.
   */
  registerDraft: (file: File, folder: string) => string

  /**
   * Resolve a URL:
   * - blob: URL with a draft entry → upload the file, return the CDN URL
   * - blob: URL without a draft entry → throw (stale / already resolved)
   * - any other URL → return unchanged (already a real CDN URL)
   */
  resolveUrl: (url: string) => Promise<string>

  /** Resolve multiple URLs in parallel */
  resolveUrls: (urls: string[]) => Promise<string[]>

  /**
   * Revoke a blob URL and remove its draft entry.
   * Call when the user removes an image before saving, or on modal close.
   */
  revokeDraft: (blobUrl: string) => void
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useDraftMediaStore = create<DraftMediaState>((set, get) => ({
  drafts: new Map(),

  registerDraft(file: File, folder: string): string {
    const blobUrl = URL.createObjectURL(file)
    set((state) => {
      const next = new Map(state.drafts)
      next.set(blobUrl, { file, folder })
      return { drafts: next }
    })
    return blobUrl
  },

  async resolveUrl(url: string): Promise<string> {
    // Not a draft — already a real URL (CDN, https://, etc.)
    if (!url.startsWith('blob:')) return url

    const entry = get().drafts.get(url)
    if (!entry) {
      // Could be a stale blob URL that was already resolved (race-safe)
      console.warn('[draftMediaStore] resolveUrl: no draft entry for', url)
      throw new Error('Draft file not found. Please re-select the image.')
    }

    const media = await mediaService.upload(entry.file, { folder: entry.folder })

    if (!media.cdn_url) {
      throw new Error('Upload succeeded but no CDN URL was returned.')
    }

    // Clean up the blob URL and remove the draft entry
    URL.revokeObjectURL(url)
    set((state) => {
      const next = new Map(state.drafts)
      next.delete(url)
      return { drafts: next }
    })

    return media.cdn_url
  },

  async resolveUrls(urls: string[]): Promise<string[]> {
    return Promise.all(urls.map((u) => get().resolveUrl(u)))
  },

  revokeDraft(blobUrl: string) {
    if (blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl)
    }
    set((state) => {
      const next = new Map(state.drafts)
      next.delete(blobUrl)
      return { drafts: next }
    })
  },
}))

// ── Convenience singleton (usable outside React components) ───────────────────

/**
 * Non-hook accessor for use in service methods, form save handlers, etc.
 * Mirrors the store API exactly.
 */
export const draftMediaStore = {
  registerDraft: (file: File, folder: string) =>
    useDraftMediaStore.getState().registerDraft(file, folder),

  resolveUrl: (url: string) =>
    useDraftMediaStore.getState().resolveUrl(url),

  resolveUrls: (urls: string[]) =>
    useDraftMediaStore.getState().resolveUrls(urls),

  revokeDraft: (url: string) =>
    useDraftMediaStore.getState().revokeDraft(url),
}
