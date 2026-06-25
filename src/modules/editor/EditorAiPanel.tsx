/**
 * EditorAiPanel — AI content assistant panel for the block editor.
 *
 * Architecture:
 *   1. User picks content type, fills in topic + description + tone.
 *   2. On "Generate": calls backend POST /ai-assistant/generate (which uses
 *      template-based generation — no paid API required).
 *   3. If the backend call fails (offline, error), falls back to
 *      generateLocalBlocks() from aiTemplates.ts (fully client-side).
 *   4. Preview shows generated blocks as labelled chips with their type.
 *   5. "Insert All" inserts every block into the editor at the current cursor.
 *      Individual blocks can be inserted one at a time.
 *
 * No external AI key is needed to generate content.
 */

import { useState, useCallback } from 'react'
import {
  X, Sparkles, ChevronDown, ChevronRight, Plus, Loader2, RotateCcw,
  CheckCircle2, AlertCircle,
} from 'lucide-react'
import { useEditorStore, makeBlock } from '@/stores/editor.store'
import { useOrgStore }               from '@/stores/org.store'
import { aiAssistantService }        from '@/services/ai-assistant.service'
import {
  generateLocalBlocks,
  CONTENT_TYPE_OPTIONS,
  type AiTone,
} from '@/lib/aiTemplates'
import type { Block } from '@/types/editor.types'

// ── Tone options ──────────────────────────────────────────────────────────────

const TONES: Array<{ value: AiTone; label: string; emoji: string }> = [
  { value: 'professional', label: 'Professional', emoji: '💼' },
  { value: 'friendly',     label: 'Friendly',     emoji: '😊' },
  { value: 'casual',       label: 'Casual',        emoji: '✌️' },
  { value: 'luxury',       label: 'Luxury',        emoji: '✨' },
  { value: 'modern',       label: 'Modern',        emoji: '🚀' },
]

// ── Block type display labels ─────────────────────────────────────────────────

const BLOCK_LABELS: Record<string, string> = {
  hero:         'Hero',    heading:    'Heading',  text:        'Text',
  image:        'Image',   gallery:    'Gallery',  video:       'Video',
  button:       'Button',  spacer:     'Spacer',   divider:     'Divider',
  cta:          'CTA',     services:   'Services', pricing:     'Pricing',
  testimonials: 'Testimonials', faq:  'FAQ',       team:        'Team',
  statistics:   'Statistics',   products: 'Products', collections: 'Collections',
  journal:      'Journal', story:      'Story',    contact_form:'Contact Form',
  newsletter:   'Newsletter', map:     'Map',      social_links: 'Social',
  html:         'HTML',
}

const BLOCK_COLORS: Record<string, string> = {
  hero:         'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  heading:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  text:         'bg-[var(--cms-surface-2)] text-[var(--text-muted)]',
  spacer:       'bg-[var(--cms-surface-3)] text-[var(--text-faint)]',
  divider:      'bg-[var(--cms-surface-3)] text-[var(--text-faint)]',
  cta:          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  services:     'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  pricing:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  testimonials: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  faq:          'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  team:         'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  statistics:   'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  products:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  collections:  'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
  journal:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  newsletter:   'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  default:      'bg-[var(--cms-surface-2)] text-[var(--text-muted)]',
}

function blockColor(type: string) {
  return BLOCK_COLORS[type] ?? BLOCK_COLORS.default
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditorAiPanel() {
  const { toggleAiPanel, addBlock, selectedBlockId, locale } = useEditorStore()
  const { org } = useOrgStore()

  // Form state
  const [contentType, setContentType] = useState('landing_page')
  const [topic,       setTopic]       = useState(org?.name ?? '')
  const [description, setDescription] = useState('')
  const [tone,        setTone]        = useState<AiTone>('professional')

  // Generation state
  const [blocks,      setBlocks]      = useState<Block[] | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [insertedIds, setInsertedIds] = useState<Set<string>>(new Set())
  const [source,      setSource]      = useState<'api' | 'local' | null>(null)

  // ── Generate ────────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setBlocks(null)
    setInsertedIds(new Set())
    setSource(null)

    try {
      if (org?.id) {
        // Try backend (template generation with optional knowledge base)
        const res = await aiAssistantService.generate(org.id, {
          content_type: contentType,
          topic,
          description,
          tone,
          locale,
          use_knowledge_base: true,
        })
        const rawBlocks = res.data?.blocks ?? []
        // Ensure each block has a fresh id so they don't collide with existing blocks
        const typed = rawBlocks.map((b) => {
          const raw = b as Record<string, unknown>
          return makeBlock(
            raw.type as Block['type'],
            (raw.data ?? {}) as Block['data'],
            (raw.styles ?? {}) as Record<string, unknown>,
          )
        })
        setBlocks(typed)
        setSource('api')
      } else {
        throw new Error('No org — using local generation')
      }
    } catch {
      // Fallback: client-side template generation (no network needed)
      const localBlocks = generateLocalBlocks({ contentType, topic, description, tone, locale })
      setBlocks(localBlocks)
      setSource('local')
    } finally {
      setLoading(false)
    }
  }, [org, contentType, topic, description, tone, locale])

  // ── Insert ───────────────────────────────────────────────────────────────────

  const insertBlock = useCallback((b: Block) => {
    addBlock(b, selectedBlockId)
    setInsertedIds((prev) => new Set(prev).add(b.id))
  }, [addBlock, selectedBlockId])

  const insertAll = useCallback(() => {
    if (!blocks) return
    let afterId = selectedBlockId
    for (const b of blocks) {
      addBlock(b, afterId)
      afterId = b.id
    }
    setInsertedIds(new Set(blocks.map((b) => b.id)))
  }, [blocks, addBlock, selectedBlockId])

  // ── Selected content type meta ───────────────────────────────────────────────

  const selectedOption = CONTENT_TYPE_OPTIONS.find((o) => o.value === contentType)

  return (
    <div
      className="fixed inset-y-0 right-0 z-[60] flex flex-col w-[360px] bg-[var(--cms-sidebar-bg)] border-l border-[var(--lito-border)] shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--lito-border)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--lito-gold)]" />
          <span className="font-display text-sm font-semibold text-[var(--text-primary)]">AI Content Assistant</span>
        </div>
        <button
          type="button"
          onClick={() => toggleAiPanel(false)}
          className="p-1 rounded-lg hover:bg-[var(--cms-surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* Generator form */}
        <div className="p-4 space-y-4 border-b border-[var(--lito-border)]">

          {/* Content type */}
          <div>
            <label className="block font-body text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Content Type
            </label>
            <div className="relative">
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-lg bg-[var(--cms-surface-2)] border border-[var(--lito-border)] font-body text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--lito-teal)] appearance-none"
              >
                {CONTENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
            </div>
            {selectedOption && (
              <p className="mt-1 font-body text-[10px] text-[var(--text-muted)] leading-relaxed">
                {selectedOption.description} · ~{selectedOption.blockCount} blocks
              </p>
            )}
          </div>

          {/* Topic */}
          <div>
            <label className="block font-body text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Brand / Page Name
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Lito Studio, My Shop, Your Brand"
              className="w-full px-3 py-2 rounded-lg bg-[var(--cms-surface-2)] border border-[var(--lito-border)] font-body text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--lito-teal)]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-body text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Description <span className="text-[var(--text-muted)]">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what you do, your products, or what makes you unique…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[var(--cms-surface-2)] border border-[var(--lito-border)] font-body text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--lito-teal)] resize-none"
            />
          </div>

          {/* Tone */}
          <div>
            <label className="block font-body text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Tone
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-[10px] font-medium border transition-all ${
                    tone === t.value
                      ? 'bg-[var(--lito-teal)] text-white border-[var(--lito-teal)]'
                      : 'bg-[var(--cms-surface-2)] text-[var(--text-secondary)] border-[var(--lito-border)] hover:border-[var(--lito-teal)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[var(--lito-teal)] to-[var(--lito-teal)]/80 text-white font-body text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              : <><Sparkles className="w-4 h-4" /> Generate Content</>
            }
          </button>

          {/* Source badge */}
          {source === 'local' && !loading && (
            <p className="font-body text-[10px] text-[var(--text-muted)] text-center">
              ✦ Generated locally — no API key needed
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="m-4 flex items-start gap-2 p-3 rounded-lg bg-[var(--cms-danger-bg)] border border-[var(--cms-danger)]">
            <AlertCircle className="w-4 h-4 text-[var(--cms-danger)] mt-0.5 flex-shrink-0" />
            <p className="font-body text-xs text-[var(--cms-danger)]">{error}</p>
          </div>
        )}

        {/* Generated block preview */}
        {blocks && blocks.length > 0 && !loading && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="font-body text-xs font-semibold text-[var(--text-primary)]">
                  {blocks.length} block{blocks.length !== 1 ? 's' : ''} ready
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="p-1 rounded hover:bg-[var(--cms-surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  title="Regenerate"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={insertAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--lito-teal)] text-white font-body text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Insert All
                </button>
              </div>
            </div>

            {/* Block list */}
            <div className="space-y-1.5">
              {blocks.map((b) => {
                const inserted = insertedIds.has(b.id)
                const label    = BLOCK_LABELS[b.type] ?? b.type

                // Extract a preview text from common data fields
                const data = b.data as Record<string, unknown>
                const preview =
                  (data.heading as string) ??
                  (data.text as string) ??
                  (data.content as string) ??
                  (data.title as string) ??
                  ''

                return (
                  <div
                    key={b.id}
                    className={`group flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                      inserted
                        ? 'bg-green-50 border-green-200 opacity-60'
                        : 'bg-[var(--cms-surface-2)] border-[var(--lito-border)] hover:border-[var(--lito-teal)]/50'
                    }`}
                  >
                    {/* Type badge */}
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full font-body text-[10px] font-semibold ${blockColor(b.type)}`}>
                      {label}
                    </span>

                    {/* Preview text */}
                    <span className="flex-1 min-w-0 font-body text-[11px] text-[var(--text-muted)] truncate">
                      {preview
                        ? preview.slice(0, 50) + (preview.length > 50 ? '…' : '')
                        : <span className="italic">{label} block</span>
                      }
                    </span>

                    {/* Insert / inserted */}
                    {inserted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => insertBlock(b)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 rounded-lg bg-[var(--lito-teal)]/10 text-[var(--lito-teal)] hover:bg-[var(--lito-teal)] hover:text-white"
                        title="Insert this block"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!blocks && !loading && (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-[var(--lito-teal)]/10 to-[var(--lito-gold)]/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[var(--lito-teal)]" />
            </div>
            <p className="font-body text-xs text-[var(--text-muted)] leading-relaxed max-w-[200px] mx-auto">
              Choose a content type, fill in your brand details, and click Generate.
            </p>
            <p className="font-body text-[10px] text-[var(--text-muted)]">
              No API key required ✦ Works offline
            </p>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--lito-border)] flex-shrink-0">
        <p className="font-body text-[10px] text-[var(--text-muted)] text-center">
          AI Assistant · Template-based generation · No paid API required
        </p>
      </div>
    </div>
  )
}
