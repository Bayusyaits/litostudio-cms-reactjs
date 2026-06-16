// apps/cms/src/modules/pages/PageSectionsManager.tsx
// CMS UI for managing which sections appear on a page and in what order.
// Uses the /pages/:pageId/sections endpoints via pageSectionsService.
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  GripVertical, Eye, EyeOff, Plus, Trash2, ChevronUp, ChevronDown, X, Check, AlertCircle,
} from 'lucide-react'
import {
  pageSectionsService, SECTION_TYPES,
  type PageSection, type SectionType,
} from '@/services/pageSectionsService'

// ── Section type labels ───────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  // ── Generic ──────────────────────────────────────────────────────────────
  hero:              'Hero',
  about:             'About',
  services:          'Services',
  stories:           'Stories',
  destinations:      'Destinations',
  gallery:           'Gallery',
  testimonials:      'Testimonials',
  pricing:           'Pricing',
  journal:           'Journal',
  contact:           'Contact',
  custom_html:       'Custom HTML',
  faq:               'FAQ',
  team:              'Team',
  timeline:          'Timeline',
  map:               'Map',

  // ── Lito ─────────────────────────────────────────────────────────────────
  featured_stories:  'Featured Stories',
  featured_content:  'Featured Content',
  selected_works:    'Selected Works',
  story_map:         'Story Map',
  story_categories:  'Story Categories',
  offerings:         'Offerings',
  client_reviews:    'Client Reviews',
  campaign:          'Campaign Banner',
  latest_journal:    'Latest Journal',

  // ── Fashion ───────────────────────────────────────────────────────────────
  new_arrival:       'New Arrival',
  promo_banners:     'Promo Banners',
  campaign_banner:   'Campaign Banner',
  product_carousel:  'Product Carousel',
  marquee:           'Marquee',
  brand_story:       'Brand Story',
  lookbook:          'Lookbook',
  about_cta:         'About CTA',
  collaborations:    'Collaborations',
  social_grid:       'Social Grid',
  philosophy:        'Philosophy',

  // ── Beauty ────────────────────────────────────────────────────────────────
  collection_banner: 'Collection Banner',
  product_benefits:  'Product Benefits',
  product_categories:'Product Categories',
  founder_quote:     'Founder Quote',
  blog_highlight:    'Blog Highlight',
  newsletter:        'Newsletter',
  featured_products: 'Featured Products',
}

// ── Shared button style ───────────────────────────────────────────────────────

const iconBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '4px 6px', borderRadius: 6,
  border: '1px solid var(--lito-border)',
  background: 'transparent', cursor: 'pointer',
  color: 'var(--text-secondary)',
  transition: 'color 120ms, border-color 120ms, background 120ms',
  lineHeight: 1,
}

const iconBtnDisabled: React.CSSProperties = {
  ...iconBtn,
  opacity: 0.35,
  cursor: 'not-allowed',
}

// ── Row component ─────────────────────────────────────────────────────────────

interface SectionRowProps {
  section:     PageSection
  isFirst:     boolean
  isLast:      boolean
  isDeleting:  boolean
  isToggling:  boolean
  onMoveUp:    () => void
  onMoveDown:  () => void
  onToggle:    () => void
  onDelete:    () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver:  (e: React.DragEvent) => void
  onDrop:      (e: React.DragEvent) => void
  isDragOver:  boolean
}

function SectionRow({
  section, isFirst, isLast, isDeleting, isToggling,
  onMoveUp, onMoveDown, onToggle, onDelete,
  onDragStart, onDragOver, onDrop, isDragOver,
}: SectionRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div
      role="listitem"
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e) }}
      onDrop={onDrop}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        background: isDragOver
          ? 'rgba(26,74,90,0.08)'
          : 'var(--cms-surface-2)',
        border: isDragOver
          ? '1px solid var(--lito-teal)'
          : '1px solid var(--lito-border)',
        borderRadius: 8,
        cursor: 'grab',
        transition: 'background 150ms, border-color 150ms',
        opacity: section.is_visible ? 1 : 0.55,
      }}
    >
      {/* Grip */}
      <span aria-hidden="true" style={{ display: 'flex', flexShrink: 0 }}>
        <GripVertical size={14} style={{ color: 'var(--text-muted)', cursor: 'grab' }} />
      </span>

      {/* Sort order badge */}
      <span aria-hidden="true" style={{
        minWidth: 22, textAlign: 'center',
        fontFamily: 'monospace', fontSize: 11,
        color: 'var(--text-muted)', flexShrink: 0,
      }}>
        {section.sort_order + 1}
      </span>

      {/* Section label */}
      <span style={{
        flex: 1,
        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
        color: section.is_visible ? 'var(--text-primary)' : 'var(--text-muted)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {SECTION_LABELS[section.section_type] ?? section.section_type}
        {section.name && (
          <span style={{
            marginLeft: 6, fontSize: 11,
            color: 'var(--text-muted)', fontWeight: 400,
          }}>
            — {section.name}
          </span>
        )}
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>

        {/* Move up */}
        <button
          type="button"
          disabled={isFirst}
          onClick={onMoveUp}
          aria-label="Move section up"
          title="Move up"
          style={isFirst ? iconBtnDisabled : iconBtn}
        >
          <ChevronUp size={12} aria-hidden="true" />
        </button>

        {/* Move down */}
        <button
          type="button"
          disabled={isLast}
          onClick={onMoveDown}
          aria-label="Move section down"
          title="Move down"
          style={isLast ? iconBtnDisabled : iconBtn}
        >
          <ChevronDown size={12} aria-hidden="true" />
        </button>

        {/* Visibility toggle */}
        <button
          type="button"
          onClick={onToggle}
          disabled={isToggling}
          aria-label={section.is_visible ? 'Hide section' : 'Show section'}
          aria-pressed={section.is_visible}
          title={section.is_visible ? 'Hide section' : 'Show section'}
          style={{
            ...iconBtn,
            color: section.is_visible ? 'var(--lito-teal)' : 'var(--text-muted)',
            borderColor: section.is_visible ? 'var(--lito-teal)' : 'var(--lito-border)',
            opacity: isToggling ? 0.5 : 1,
            cursor: isToggling ? 'wait' : 'pointer',
          }}
        >
          {section.is_visible
            ? <Eye size={12} aria-hidden="true" />
            : <EyeOff size={12} aria-hidden="true" />
          }
        </button>

        {/* Delete / confirm */}
        {confirmDelete ? (
          <>
            <button
              type="button"
              onClick={() => { onDelete(); setConfirmDelete(false) }}
              disabled={isDeleting}
              aria-label="Confirm delete section"
              title="Confirm delete"
              style={{
                ...iconBtn,
                borderColor: 'var(--lito-teal)',
                background: 'var(--lito-teal)',
                color: '#fff',
                opacity: isDeleting ? 0.6 : 1,
                cursor: isDeleting ? 'wait' : 'pointer',
              }}
            >
              <Check size={12} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              aria-label="Cancel delete"
              title="Cancel"
              style={iconBtn}
            >
              <X size={12} aria-hidden="true" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete section"
            title="Delete section"
            style={iconBtn}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.color = '#dc2626'
              el.style.borderColor = '#dc2626'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.color = 'var(--text-secondary)'
              el.style.borderColor = 'var(--lito-border)'
            }}
          >
            <Trash2 size={12} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface PageSectionsManagerProps {
  pageId:    string
  pageTitle: string
  onClose:   () => void
}

export function PageSectionsManager({ pageId, pageTitle, onClose }: PageSectionsManagerProps) {
  const qc = useQueryClient()
  const [dragIdx,    setDragIdx]    = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [addType,    setAddType]    = useState<SectionType | ''>('')

  const queryKey = ['page-sections', pageId]

  const { data: sections = [], isLoading, isError } = useQuery<PageSection[]>({
    queryKey,
    queryFn:  () => pageSectionsService.list(pageId),
    enabled:  !!pageId,
  })

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey }),
    [qc, pageId], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_visible }: { id: string; is_visible: boolean }) =>
      pageSectionsService.toggleVisibility(pageId, id, is_visible),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pageSectionsService.remove(pageId, id),
    onSuccess: invalidate,
  })

  const reorderMutation = useMutation({
    mutationFn: (order: Array<{ id: string; sort_order: number }>) =>
      pageSectionsService.reorder(pageId, order),
    onSuccess: invalidate,
  })

  const addMutation = useMutation({
    mutationFn: (section_type: string) =>
      pageSectionsService.create(pageId, {
        section_type,
        sort_order: sections.length,
        is_visible: true,
      }),
    onSuccess: () => { invalidate(); setAddType('') },
  })

  // ── Drag & drop ────────────────────────────────────────────────────────────

  const handleDrop = useCallback((targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return
    const reordered = [...sections]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    const order = reordered.map((s, i) => ({ id: s.id, sort_order: i }))
    reorderMutation.mutate(order)
    setDragIdx(null)
    setDragOverIdx(null)
  }, [dragIdx, sections, reorderMutation])

  // ── Move up / down ─────────────────────────────────────────────────────────

  const moveSection = useCallback((idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sections.length) return
    const reordered = [...sections]
    ;[reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]]
    const order = reordered.map((s, i) => ({ id: s.id, sort_order: i }))
    reorderMutation.mutate(order)
  }, [sections, reorderMutation])

  // ── Keyboard close ─────────────────────────────────────────────────────────

  const handleBackdropKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Section Manager"
      onKeyDown={handleBackdropKey}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal panel */}
      <div
        role="document"
        style={{
          background: 'var(--cms-card-bg)',
          border: '1px solid var(--lito-border)',
          borderRadius: 12,
          width: '100%', maxWidth: 560,
          maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.30)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--lito-border)',
          flexShrink: 0,
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600,
              color: 'var(--text-primary)', margin: 0, lineHeight: 1.3,
            }}>
              Section Manager
            </p>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 12,
              color: 'var(--text-muted)', margin: '2px 0 0',
            }}>
              {pageTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close section manager"
            title="Close"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px 8px', borderRadius: 7,
              border: '1px solid var(--lito-border)',
              background: 'transparent', cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'color 120ms, background 120ms',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'var(--cms-surface-3)'
              el.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'transparent'
              el.style.color = 'var(--text-muted)'
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        {/* ── Section list ── */}
        <div
          role="list"
          aria-label="Page sections"
          style={{
            flex: 1, overflowY: 'auto', padding: '16px 20px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}
        >
          {/* Loading */}
          {isLoading && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 8, padding: '32px 0',
            }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  height: 44, borderRadius: 8, width: '100%',
                  background: 'var(--cms-surface-3)',
                  animation: 'pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }} />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 14px', borderRadius: 8,
              border: '1px solid var(--lito-border)',
              background: 'var(--cms-surface-3)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: 13,
            }}>
              <AlertCircle size={14} aria-hidden="true" />
              Failed to load sections. Check your connection and try again.
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && sections.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 6, padding: '32px 0',
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--text-muted)', textAlign: 'center',
            }}>
              <Plus size={20} style={{ opacity: 0.4 }} aria-hidden="true" />
              No sections yet. Add one below.
            </div>
          )}

          {/* Rows */}
          {!isLoading && sections.map((section, idx) => (
            <SectionRow
              key={section.id}
              section={section}
              isFirst={idx === 0}
              isLast={idx === sections.length - 1}
              isDeleting={deleteMutation.isPending}
              isToggling={toggleMutation.isPending}
              onMoveUp={() => moveSection(idx, 'up')}
              onMoveDown={() => moveSection(idx, 'down')}
              onToggle={() =>
                toggleMutation.mutate({ id: section.id, is_visible: !section.is_visible })
              }
              onDelete={() => deleteMutation.mutate(section.id)}
              onDragStart={() => setDragIdx(idx)}
              onDragOver={() => setDragOverIdx(idx)}
              onDrop={() => handleDrop(idx)}
              isDragOver={dragOverIdx === idx && dragIdx !== idx}
            />
          ))}
        </div>

        {/* ── Add section footer ── */}
        <div style={{
          padding: '12px 20px 16px',
          borderTop: '1px solid var(--lito-border)',
          display: 'flex', gap: 8, alignItems: 'center',
          flexShrink: 0,
        }}>
          <select
            value={addType}
            onChange={e => setAddType(e.target.value as SectionType | '')}
            aria-label="Select section type to add"
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 7,
              border: '1px solid var(--lito-border)',
              background: 'var(--cms-surface-3)',
              color: addType ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: 13,
              outline: 'none',
              cursor: 'pointer',
              // force dark-mode-aware text in native select
              colorScheme: 'light dark',
            }}
          >
            <option value="">— Add section type —</option>
            {SECTION_TYPES.map(t => (
              <option key={t} value={t}>{SECTION_LABELS[t] ?? t}</option>
            ))}
          </select>

          <button
            type="button"
            disabled={!addType || addMutation.isPending}
            onClick={() => addType && addMutation.mutate(addType)}
            aria-label="Add selected section type"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 7,
              border: '1px solid var(--lito-teal)',
              background: addType && !addMutation.isPending ? 'var(--lito-teal)' : 'transparent',
              color: addType && !addMutation.isPending ? '#fff' : 'var(--lito-teal)',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
              cursor: addType && !addMutation.isPending ? 'pointer' : 'not-allowed',
              opacity: !addType || addMutation.isPending ? 0.5 : 1,
              transition: 'background 150ms, color 150ms, opacity 150ms',
              flexShrink: 0,
            }}
          >
            <Plus size={13} aria-hidden="true" />
            {addMutation.isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
