/**
 * editor.store.ts — Block editor state with undo/redo history.
 *
 * NOT persisted — editor state lives only for the duration of the session.
 * On save, the current `blockDoc` is serialised and sent to the backend.
 *
 * Note: the state key is `blockDoc` (not `document`) to avoid collision
 * with the DOM global `document`.
 */

import { create } from 'zustand'
import type {
  Block, BlockDocument, BlockData, BlockStyles,
  BlockVisibility, EditorTab, LeftPanelTab, PreviewMode, SaveStatus, EditorMode,
} from '@/types/editor.types'

const MAX_HISTORY = 50

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEmptyDoc(locale = 'id'): BlockDocument {
  return { version: '1.0', locale, blocks: [] }
}

// ── State ─────────────────────────────────────────────────────────────────────

interface EditorState {
  blockDoc: BlockDocument
  past:   BlockDocument[]
  future: BlockDocument[]
  selectedBlockId: string | null
  activeEditorTab:  EditorTab
  activeLeftTab:    LeftPanelTab
  previewMode:      PreviewMode
  editorMode:       EditorMode
  rightSidebarOpen: boolean
  leftSidebarOpen:  boolean
  aiPanelOpen:      boolean
  saveStatus: SaveStatus
  isDirty:    boolean
  pageId:     string | null
  locale:     string
  zoomLevel:  number
  pageSeo:    { metaTitle: string; metaDescription: string; ogImage?: string }
  /** Clipboard for copy/cut/paste block operations (session-only) */
  clipboardBlock:  Block | null
  /** Clipboard for copy/paste style operations */
  clipboardStyles: BlockStyles | null
}

interface EditorActions {
  init:  (doc: BlockDocument, pageId: string, locale?: string) => void
  reset: () => void

  addBlock:        (block: Block, afterId?: string | null) => void
  removeBlock:     (id: string) => void
  updateBlock:     (id: string, data: Partial<BlockData>) => void
  updateStyles:    (id: string, styles: Partial<BlockStyles>) => void
  updateVisibility:(id: string, v: Partial<BlockVisibility>) => void
  updateAnimation: (id: string, animation: Block['animation']) => void
  duplicateBlock:  (id: string) => void
  moveBlockUp:     (id: string) => void
  moveBlockDown:   (id: string) => void
  reorderBlocks:   (from: number, to: number) => void
  groupBlocks:     (ids: string[], groupId: string) => void
  ungroupBlocks:   (groupId: string) => void

  copyBlock:        (id: string) => void
  cutBlock:         (id: string) => void
  pasteBlock:       (afterId?: string | null) => void
  insertBlockBefore:(id: string, block: Block) => void
  lockBlock:        (id: string, locked: boolean) => void
  renameBlock:      (id: string, name: string) => void
  hideBlock:        (id: string) => void
  copyBlockStyles:  (id: string) => void
  pasteBlockStyles: (id: string) => void
  setFeaturedImage: (imageUrl: string) => void
  editBlockAsHTML:  (id: string) => void

  undo:     () => void
  redo:     () => void
  canUndo:  () => boolean
  canRedo:  () => boolean

  selectBlock:   (id: string | null) => void
  selectedBlock: () => Block | null

  setEditorTab:       (tab: EditorTab) => void
  setLeftTab:         (tab: LeftPanelTab) => void
  setPreviewMode:     (mode: PreviewMode) => void
  setEditorMode:      (mode: EditorMode) => void
  toggleRightSidebar: (open?: boolean) => void
  toggleLeftSidebar:  (open?: boolean) => void
  toggleAiPanel:      (open?: boolean) => void

  setSaveStatus: (s: SaveStatus) => void
  markClean:     () => void
  setZoomLevel:  (v: number) => void
  setPageSeo:    (patch: Partial<{ metaTitle: string; metaDescription: string }>) => void
}

type EditorStore = EditorState & EditorActions

// ── Snapshot helper ───────────────────────────────────────────────────────────

function snap(doc: BlockDocument): BlockDocument {
  return structuredClone(doc)
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorStore>((set, get) => ({
  blockDoc:         makeEmptyDoc(),
  past:             [],
  future:           [],
  selectedBlockId:  null,
  activeEditorTab:  'content',
  activeLeftTab:    'blocks',
  previewMode:      'desktop',
  editorMode:       'content',
  rightSidebarOpen: true,
  leftSidebarOpen:  true,
  aiPanelOpen:      false,
  saveStatus:       'idle',
  isDirty:          false,
  pageId:           null,
  locale:           'id',
  zoomLevel:        100,
  pageSeo:          { metaTitle: '', metaDescription: '', ogImage: '' },
  clipboardBlock:   null,
  clipboardStyles:  null,

  // ── Init / reset ──────────────────────────────────────────────────────────

  init: (doc, pageId, locale = 'id') => set({
    blockDoc:        doc,
    past:            [],
    future:          [],
    selectedBlockId: null,
    saveStatus:      'idle',
    isDirty:         false,
    pageId,
    locale,
  }),

  reset: () => set({
    blockDoc:        makeEmptyDoc(),
    past:            [],
    future:          [],
    selectedBlockId: null,
    saveStatus:      'idle',
    isDirty:         false,
    pageId:          null,
  }),

  // ── Block CRUD ────────────────────────────────────────────────────────────

  addBlock: (block, afterId) => {
    const { blockDoc, past } = get()
    const prev = snap(blockDoc)
    const blocks = [...blockDoc.blocks]
    const idx = afterId ? blocks.findIndex((b) => b.id === afterId) : -1
    if (idx >= 0) blocks.splice(idx + 1, 0, block)
    else blocks.push(block)
    set({
      blockDoc:         { ...blockDoc, blocks },
      past:             [...past.slice(-MAX_HISTORY), prev],
      future:           [],
      isDirty:          true,
      selectedBlockId:  block.id,
      rightSidebarOpen: true,
    })
  },

  removeBlock: (id) => {
    const { blockDoc, past, selectedBlockId } = get()
    const prev = snap(blockDoc)
    const blocks = blockDoc.blocks.filter((b) => b.id !== id)
    set({
      blockDoc:        { ...blockDoc, blocks },
      past:            [...past.slice(-MAX_HISTORY), prev],
      future:          [],
      isDirty:         true,
      selectedBlockId: selectedBlockId === id ? null : selectedBlockId,
    })
  },

  updateBlock: (id, data) => {
    const { blockDoc, past } = get()
    const prev = snap(blockDoc)
    const blocks = blockDoc.blocks.map((b) =>
      b.id === id ? { ...b, data: { ...b.data, ...data } as BlockData } : b,
    )
    set({
      blockDoc: { ...blockDoc, blocks },
      past:     [...past.slice(-MAX_HISTORY), prev],
      future:   [],
      isDirty:  true,
    })
  },

  updateStyles: (id, styles) => {
    const { blockDoc, past } = get()
    const prev = snap(blockDoc)
    const blocks = blockDoc.blocks.map((b) =>
      b.id === id ? { ...b, styles: { ...b.styles, ...styles } } : b,
    )
    set({
      blockDoc: { ...blockDoc, blocks },
      past:     [...past.slice(-MAX_HISTORY), prev],
      future:   [],
      isDirty:  true,
    })
  },

  updateVisibility: (id, v) => {
    const { blockDoc, past } = get()
    const prev = snap(blockDoc)
    const blocks = blockDoc.blocks.map((b) =>
      b.id === id ? { ...b, visibility: { ...b.visibility, ...v } } : b,
    )
    set({
      blockDoc: { ...blockDoc, blocks },
      past:     [...past.slice(-MAX_HISTORY), prev],
      future:   [],
      isDirty:  true,
    })
  },

  updateAnimation: (id, animation) => {
    const { blockDoc, past } = get()
    const prev = snap(blockDoc)
    const blocks = blockDoc.blocks.map((b) =>
      b.id === id ? { ...b, animation } : b,
    )
    set({
      blockDoc: { ...blockDoc, blocks },
      past:     [...past.slice(-MAX_HISTORY), prev],
      future:   [],
      isDirty:  true,
    })
  },

  duplicateBlock: (id) => {
    const { blockDoc, past } = get()
    const prev   = snap(blockDoc)
    const srcIdx = blockDoc.blocks.findIndex((b) => b.id === id)
    if (srcIdx < 0) return
    const clone: Block = {
      ...snap(blockDoc.blocks[srcIdx] as unknown as BlockDocument) as unknown as Block,
      id: Math.random().toString(36).slice(2, 10),
    }
    const blocks = [...blockDoc.blocks]
    blocks.splice(srcIdx + 1, 0, clone)
    set({
      blockDoc:        { ...blockDoc, blocks },
      past:            [...past.slice(-MAX_HISTORY), prev],
      future:          [],
      isDirty:         true,
      selectedBlockId: clone.id,
    })
  },

  moveBlockUp: (id) => {
    const { blockDoc, past } = get()
    const prev = snap(blockDoc)
    const idx  = blockDoc.blocks.findIndex((b) => b.id === id)
    if (idx <= 0) return
    const blocks = [...blockDoc.blocks]
    ;[blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]]
    set({
      blockDoc: { ...blockDoc, blocks },
      past:     [...past.slice(-MAX_HISTORY), prev],
      future:   [],
      isDirty:  true,
    })
  },

  moveBlockDown: (id) => {
    const { blockDoc, past } = get()
    const prev = snap(blockDoc)
    const idx  = blockDoc.blocks.findIndex((b) => b.id === id)
    if (idx < 0 || idx >= blockDoc.blocks.length - 1) return
    const blocks = [...blockDoc.blocks]
    ;[blocks[idx], blocks[idx + 1]] = [blocks[idx + 1], blocks[idx]]
    set({
      blockDoc: { ...blockDoc, blocks },
      past:     [...past.slice(-MAX_HISTORY), prev],
      future:   [],
      isDirty:  true,
    })
  },

  reorderBlocks: (from, to) => {
    const { blockDoc, past } = get()
    const prev   = snap(blockDoc)
    const blocks = [...blockDoc.blocks]
    const [moved] = blocks.splice(from, 1)
    blocks.splice(to, 0, moved)
    set({
      blockDoc: { ...blockDoc, blocks },
      past:     [...past.slice(-MAX_HISTORY), prev],
      future:   [],
      isDirty:  true,
    })
  },

  groupBlocks: (ids, groupId) => {
    const { blockDoc, past } = get()
    const prev = snap(blockDoc)
    const blocks = blockDoc.blocks.map((b) =>
      ids.includes(b.id) ? { ...b, groupId } : b,
    )
    set({
      blockDoc: { ...blockDoc, blocks },
      past:     [...past.slice(-MAX_HISTORY), prev],
      future:   [],
      isDirty:  true,
    })
  },

  ungroupBlocks: (groupId) => {
    const { blockDoc, past } = get()
    const prev = snap(blockDoc)
    const blocks = blockDoc.blocks.map((b) =>
      b.groupId === groupId ? { ...b, groupId: undefined } : b,
    )
    set({
      blockDoc: { ...blockDoc, blocks },
      past:     [...past.slice(-MAX_HISTORY), prev],
      future:   [],
      isDirty:  true,
    })
  },

  // ── Clipboard / context menu actions ─────────────────────────────────────

  copyBlock: (id) => {
    const { blockDoc } = get()
    const block = blockDoc.blocks.find((b) => b.id === id)
    if (!block) return
    set({ clipboardBlock: snap(block as unknown as BlockDocument) as unknown as Block })
  },

  cutBlock: (id) => {
    const { blockDoc, past, selectedBlockId } = get()
    const block = blockDoc.blocks.find((b) => b.id === id)
    if (!block) return
    const prev = snap(blockDoc)
    const blocks = blockDoc.blocks.filter((b) => b.id !== id)
    set({
      clipboardBlock:  snap(block as unknown as BlockDocument) as unknown as Block,
      blockDoc:        { ...blockDoc, blocks },
      past:            [...past.slice(-MAX_HISTORY), prev],
      future:          [],
      isDirty:         true,
      selectedBlockId: selectedBlockId === id ? null : selectedBlockId,
    })
  },

  pasteBlock: (afterId) => {
    const { clipboardBlock, blockDoc, past } = get()
    if (!clipboardBlock) return
    const clone: Block = {
      ...(snap(clipboardBlock as unknown as BlockDocument) as unknown as Block),
      id: Math.random().toString(36).slice(2, 10),
    }
    const prev   = snap(blockDoc)
    const blocks = [...blockDoc.blocks]
    const idx    = afterId ? blocks.findIndex((b) => b.id === afterId) : -1
    if (idx >= 0) blocks.splice(idx + 1, 0, clone)
    else blocks.push(clone)
    set({
      blockDoc:        { ...blockDoc, blocks },
      past:            [...past.slice(-MAX_HISTORY), prev],
      future:          [],
      isDirty:         true,
      selectedBlockId: clone.id,
    })
  },

  insertBlockBefore: (id, block) => {
    const { blockDoc, past } = get()
    const prev = snap(blockDoc)
    const idx  = blockDoc.blocks.findIndex((b) => b.id === id)
    const blocks = [...blockDoc.blocks]
    if (idx >= 0) blocks.splice(idx, 0, block)
    else blocks.push(block)
    set({
      blockDoc:        { ...blockDoc, blocks },
      past:            [...past.slice(-MAX_HISTORY), prev],
      future:          [],
      isDirty:         true,
      selectedBlockId: block.id,
    })
  },

  lockBlock: (id, locked) => {
    const { blockDoc, past } = get()
    const prev = snap(blockDoc)
    const blocks = blockDoc.blocks.map((b) =>
      b.id === id ? { ...b, locked } : b,
    )
    set({
      blockDoc: { ...blockDoc, blocks },
      past:     [...past.slice(-MAX_HISTORY), prev],
      future:   [],
      isDirty:  true,
    })
  },

  renameBlock: (id, name) => {
    const { blockDoc, past } = get()
    const prev = snap(blockDoc)
    const blocks = blockDoc.blocks.map((b) =>
      b.id === id ? { ...b, name } : b,
    )
    set({
      blockDoc: { ...blockDoc, blocks },
      past:     [...past.slice(-MAX_HISTORY), prev],
      future:   [],
      isDirty:  true,
    })
  },

  hideBlock: (id) => {
    const { blockDoc, past } = get()
    const prev = snap(blockDoc)
    const blocks = blockDoc.blocks.map((b) =>
      b.id === id
        ? { ...b, visibility: { desktop: false, tablet: false, mobile: false } }
        : b,
    )
    set({
      blockDoc: { ...blockDoc, blocks },
      past:     [...past.slice(-MAX_HISTORY), prev],
      future:   [],
      isDirty:  true,
    })
  },

  copyBlockStyles: (id) => {
    const { blockDoc } = get()
    const block = blockDoc.blocks.find((b) => b.id === id)
    if (!block) return
    set({ clipboardStyles: block.styles ?? {} })
  },

  pasteBlockStyles: (id) => {
    const { clipboardStyles, blockDoc, past } = get()
    if (!clipboardStyles) return
    const prev = snap(blockDoc)
    const blocks = blockDoc.blocks.map((b) =>
      b.id === id ? { ...b, styles: { ...clipboardStyles } } : b,
    )
    set({
      blockDoc: { ...blockDoc, blocks },
      past:     [...past.slice(-MAX_HISTORY), prev],
      future:   [],
      isDirty:  true,
    })
  },

  setFeaturedImage: (imageUrl) => {
    set((s) => ({ pageSeo: { ...s.pageSeo, ogImage: imageUrl } }))
  },

  editBlockAsHTML: (id) => {
    const { blockDoc, past } = get()
    const prev  = snap(blockDoc)
    const block = blockDoc.blocks.find((b) => b.id === id)
    if (!block) return
    // Convert block data to a minimal HTML representation
    const rawData = block.data as Record<string, unknown>
    const html =
      (rawData['html'] as string | undefined) ??
      `<!-- ${block.type} block -->`
    const blocks = blockDoc.blocks.map((b) =>
      b.id === id ? { ...b, type: 'html' as const, data: { html } } : b,
    )
    set({
      blockDoc: { ...blockDoc, blocks },
      past:     [...past.slice(-MAX_HISTORY), prev],
      future:   [],
      isDirty:  true,
    })
  },

  // ── Undo / redo ───────────────────────────────────────────────────────────

  undo: () => {
    const { past, blockDoc, future } = get()
    if (past.length === 0) return
    const prev    = past[past.length - 1]
    const newPast = past.slice(0, -1)
    set({
      blockDoc: prev,
      past:     newPast,
      future:   [snap(blockDoc), ...future],
      isDirty:  true,
    })
  },

  redo: () => {
    const { future, blockDoc, past } = get()
    if (future.length === 0) return
    const next      = future[0]
    const newFuture = future.slice(1)
    set({
      blockDoc: next,
      past:     [...past, snap(blockDoc)],
      future:   newFuture,
      isDirty:  true,
    })
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  // ── Selection ─────────────────────────────────────────────────────────────

  selectBlock: (id) => set({ selectedBlockId: id }),

  selectedBlock: () => {
    const { blockDoc, selectedBlockId } = get()
    return blockDoc.blocks.find((b) => b.id === selectedBlockId) ?? null
  },

  // ── UI ────────────────────────────────────────────────────────────────────

  setEditorTab:   (tab)  => set({ activeEditorTab: tab }),
  setLeftTab:     (tab)  => set({ activeLeftTab: tab }),
  setPreviewMode: (mode) => set({ previewMode: mode }),
  setEditorMode:  (mode) => set({ editorMode: mode }),

  toggleRightSidebar: (open) =>
    set((s) => ({ rightSidebarOpen: open !== undefined ? open : !s.rightSidebarOpen })),
  toggleLeftSidebar: (open) =>
    set((s) => ({ leftSidebarOpen: open !== undefined ? open : !s.leftSidebarOpen })),
  toggleAiPanel: (open) =>
    set((s) => ({ aiPanelOpen: open !== undefined ? open : !s.aiPanelOpen })),

  // ── Save ──────────────────────────────────────────────────────────────────

  setSaveStatus: (s) => set({ saveStatus: s }),
  markClean:     ()  => set({ isDirty: false, saveStatus: 'saved' }),

  setZoomLevel: (v) => set({ zoomLevel: Math.min(200, Math.max(25, v)) }),
  setPageSeo:   (patch) => set((s) => ({ pageSeo: { ...s.pageSeo, ...patch } })),
}))

// ── Factory ───────────────────────────────────────────────────────────────────

export function makeBlock(type: Block['type'], data: BlockData, styles?: BlockStyles): Block {
  return {
    id:         Math.random().toString(36).slice(2, 10),
    type,
    data,
    styles:     styles ?? {},
    visibility: { desktop: true, tablet: true, mobile: true },
  }
}
