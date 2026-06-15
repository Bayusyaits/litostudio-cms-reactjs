// apps/cms/src/modules/pages/PageSectionsManager.tsx
// CMS UI for managing which sections appear on a page and in what order.
// Uses the /pages/:pageId/sections endpoints via pageSectionsService.
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  GripVertical, Eye, EyeOff, Plus, Trash2, ChevronUp, ChevronDown, X, Check,
} from 'lucide-react'
import {
  pageSectionsService, SECTION_TYPES,
  type PageSection, type SectionType,
} from '@/services/pageSectionsService'

// ── Section type labels ───────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  hero:         'Hero',
  about:        'About',
  services:     'Services',
  stories:      'Stories',
  destinations: 'Destinations',
  gallery:      'Gallery',
  testimonials: 'Testimonials',
  pricing:      'Pricing',
  journal:      'Journal',
  contact:      'Contact',
  custom_html:  'Custom HTML',
}

// ── Row component ─────────────────────────────────────────────────────────────

interface SectionRowProps {
  section: PageSection
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onToggle: () => void
  onDelete: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  isDragOver: boolean
}

function SectionRow({
  section, isFirst, isLast, onMoveUp, onMoveDown, onToggle, onDelete,
  onDragStart, onDragOver, onDrop, isDragOver,
}: SectionRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e) }}
      onDrop={onDrop}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        background: isDragOver ? 'rgba(20,184,166,0.08)' : 'var(--cms-card-bg)',
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
      <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, cursor: 'grab' }} />

      {/* Sort order badge */}
      <span style={{
        minWidth: 22, textAlign: 'center',
        fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)',
      }}>
        {section.sort_order}
      </span>

      {/* Section type label */}
      <span style={{
        flex: 1, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
        color: section.is_visible ? 'var(--text-primary)' : 'var(--text-muted)',
      }}>
        {SECTION_LABELS[section.section_type] ?? section.section_type}
        {section.name && (
          <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
            — {section.name}
          </span>
        )}
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Move up */}
        <button
          type="button"
          disabled={isFirst}
          onClick={onMoveUp}
          title="Move up"
          style={{
            padding: '3px 5px', borderRadius: 5, border: '1px solid var(--lito-border)',
            background: 'transparent', cursor: isFirst ? 'not-allowed' : 'pointer',
            color: isFirst ? 'var(--text-muted)' : 'var(--text-secondary)',
            opacity: isFirst ? 0.4 : 1,
          }}
        >
          <ChevronUp size={12} />
        </button>
        {/* Move down */}
        <button
          type="button"
          disabled={isLast}
          onClick={onMoveDown}
          title="Move down"
          style={{
            padding: '3px 5px', borderRadius: 5, border: '1px solid var(--lito-border)',
            background: 'transparent', cursor: isLast ? 'not-allowed' : 'pointer',
            color: isLast ? 'var(--text-muted)' : 'var(--text-secondary)',
            opacity: isLast ? 0.4 : 1,
          }}
        >
          <ChevronDown size={12} />
        </button>

        {/* Visibility toggle */}
        <button
          type="button"
          onClick={onToggle}
          title={section.is_visible ? 'Hide section' : 'Show section'}
          style={{
            padding: '3px 5px', borderRadius: 5, border: '1px solid var(--lito-border)',
            background: 'transparent', cursor: 'pointer',
            color: section.is_visible ? 'var(--lito-teal)' : 'var(--text-muted)',
          }}
        >
          {section.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>

        {/* Delete */}
        {confirmDelete ? (
          <>
            <button
              type="button"
              onClick={() => { onDelete(); setConfirmDelete(false) }}
              title="Confirm delete"
              style={{
                padding: '3px 7px', borderRadius: 5, border: '1px solid #ef4444',
                background: '#ef4444', cursor: 'pointer', color: '#fff',
              }}
            >
              <Check size={12} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              title="Cancel"
              style={{
                padding: '3px 5px', borderRadius: 5, border: '1px solid var(--lito-border)',
                background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)',
              }}
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            title="Delete section"
            style={{
              padding: '3px 5px', borderRadius: 5, border: '1px solid var(--lito-border)',
              background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)',
              transition: 'color 150ms, border-color 150ms',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.color = '#ef4444'
              ;(e.currentTarget as HTMLElement).style.borderColor = '#ef4444'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--lito-border)'
            }}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface PageSectionsManagerProps {
  pageId: string
  pageTitle: string
  onClose: () => void
}

export function PageSectionsManager({ pageId, pageTitle, onClose }: PageSectionsManagerProps) {
  const qc = useQueryClient()
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [addType, setAddType] = useState<SectionType | ''>('')

  const queryKey = ['page-sections', pageId]

  const { data: sections = [], isLoading } = useQuery<PageSection[]>({
    queryKey,
    queryFn: () => pageSectionsService.list(pageId),
    enabled: !!pageId,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey })

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

  // ── Drag & drop reorder ────────────────────────────────────────────────────

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

  function moveSection(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sections.length) return
    const reordered = [...sections]
    ;[reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]]
    const order = reordered.map((s, i) => ({ id: s.id, sort_order: i }))
    reorderMutation.mutate(order)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--cms-bg)',
        border: '1px solid var(--lito-border)',
        borderRadius: 12,
        width: '100%', maxWidth: 560,
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--lito-border)',
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600,
              color: 'var(--text-primary)', margin: 0,
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
            style={{
              padding: '6px 8px', borderRadius: 7,
              border: '1px solid var(--lito-border)',
              background: 'transparent', cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Section list */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {isLoading && (
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0',
            }}>
              Loading sections…
            </p>
          )}
          {!isLoading && sections.length === 0 && (
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0',
            }}>
              No sections yet. Add one below.
            </p>
          )}
          {sections.map((section, idx) => (
            <SectionRow
              key={section.id}
              section={section}
              isFirst={idx === 0}
              isLast={idx === sections.length - 1}
              onMoveUp={() => moveSection(idx, 'up')}
              onMoveDown={() => moveSection(idx, 'down')}
              onToggle={() => toggleMutation.mutate({ id: section.id, is_visible: !section.is_visible })}
              onDelete={() => deleteMutation.mutate(section.id)}
              onDragStart={() => setDragIdx(idx)}
              onDragOver={() => setDragOverIdx(idx)}
              onDrop={() => handleDrop(idx)}
              isDragOver={dragOverIdx === idx && dragIdx !== idx}
            />
          ))}
        </div>

        {/* Add section footer */}
        <div style={{
          padding: '12px 20px 16px',
          borderTop: '1px solid var(--lito-border)',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <select
            value={addType}
            onChange={e => setAddType(e.target.value as SectionType | '')}
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 7,
              border: '1px solid var(--lito-border)',
              background: 'var(--cms-header-bg)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)', fontSize: 13,
              outline: 'none',
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
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 7,
              border: '1px solid var(--lito-teal)',
              background: addType ? 'var(--lito-teal)' : 'transparent',
              color: addType ? '#fff' : 'var(--lito-teal)',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
              cursor: addType && !addMutation.isPending ? 'pointer' : 'not-allowed',
              opacity: !addType || addMutation.isPending ? 0.5 : 1,
              transition: 'background 150ms, color 150ms',
            }}
          >
            <Plus size={13} />
            {addMutation.isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
