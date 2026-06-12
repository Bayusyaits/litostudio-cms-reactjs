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
  BlockVisibility, EditorTab, LeftPanelTab, PreviewMode, SaveStatus,
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
  rightSidebarOpen: boolean
  leftSidebarOpen:  boolean
  aiPanelOpen:      boolean
  saveStatus: SaveStatus
  isDirty:    boolean
  pageId:     string | null
  locale:     string
}

interface EditorActions {
  init:  (doc: BlockDocument, pageId: string, locale?: string) => void
  reset: () => void

  addBlock:        (block: Block, afterId?: string | null) => void
  removeBlock:     (id: string) => void
  updateBlock:     (id: string, data: Partial<BlockData>) => void
  updateStyles:    (id: string, styles: Partial<BlockStyles>) => void
  updateVisibility:(id: string, v: Partial<BlockVisibility>) => void
  duplicateBlock:  (id: string) => void
  moveBlockUp:     (id: string) => void
  moveBlockDown:   (id: string) => void
  reorderBlocks:   (from: number, to: number) => void
  groupBlocks:     (ids: string[], groupId: string) => void
  ungroupBlocks:   (groupId: string) => void

  undo:     () => void
  redo:     () => void
  canUndo:  () => boolean
  canRedo:  () => boolean

  selectBlock:   (id: string | null) => void
  selectedBlock: () => Block | null

  setEditorTab:       (tab: EditorTab) => void
  setLeftTab:         (tab: LeftPanelTab) => void
  setPreviewMode:     (mode: PreviewMode) => void
  toggleRightSidebar: (open?: boolean) => void
  toggleLeftSidebar:  (open?: boolean) => void
  toggleAiPanel:      (open?: boolean) => void

  setSaveStatus: (s: SaveStatus) => void
  markClean:     () => void
}

type EditorStore = EditorState & EditorActions

// ── Snapshot helper ───────────────────────────────────────────────────────────

function snap(doc: BlockDocument): BlockDocument {
  return JSON.parse(JSON.stringify(doc)) as BlockDocument
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
  rightSidebarOpen: true,
  leftSidebarOpen:  true,
  aiPanelOpen:      false,
  saveStatus:       'idle',
  isDirty:          false,
  pageId:           null,
  locale:           'id',

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
      blockDoc:        { ...blockDoc, blocks },
      past:            [...past.slice(-MAX_HISTORY), prev],
      future:          [],
      isDirty:         true,
      selectedBlockId: block.id,
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

  toggleRightSidebar: (open) =>
    set((s) => ({ rightSidebarOpen: open !== undefined ? open : !s.rightSidebarOpen })),
  toggleLeftSidebar: (open) =>
    set((s) => ({ leftSidebarOpen: open !== undefined ? open : !s.leftSidebarOpen })),
  toggleAiPanel: (open) =>
    set((s) => ({ aiPanelOpen: open !== undefined ? open : !s.aiPanelOpen })),

  // ── Save ──────────────────────────────────────────────────────────────────

  setSaveStatus: (s) => set({ saveStatus: s }),
  markClean:     ()  => set({ isDirty: false, saveStatus: 'saved' }),
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
