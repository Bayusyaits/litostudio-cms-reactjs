// apps/cms/src/modules/pages/PageSectionsManager.tsx
import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  GripVertical, Eye, EyeOff, Plus, Trash2, ChevronUp, ChevronDown, X, Check, AlertCircle,
} from 'lucide-react'
import {
  pageSectionsService,
  type PageSection, type SectionType,
} from '@/services/pageSectionsService'
import { getTemplate, getPageManifest } from '@litostudio/template-registry'
import { getSectionLabel } from '@litostudio/section-schema'

const iconBtnCls = 'inline-flex items-center justify-center px-[6px] py-1 rounded-md border border-[var(--lito-border)] bg-transparent cursor-pointer text-[var(--text-secondary)] transition-[color,border-color,background] duration-[120ms] leading-none'
const iconBtnDisabledCls = `${iconBtnCls} opacity-35 cursor-not-allowed`

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
      className={`flex items-center gap-2 px-3 py-[10px] rounded-lg border cursor-grab transition-[background,border-color] duration-150 ${
        isDragOver
          ? 'bg-[rgba(26,74,90,0.08)] border-[var(--lito-teal)]'
          : 'bg-[var(--cms-surface-2)] border-[var(--lito-border)]'
      } ${section.is_visible ? 'opacity-100' : 'opacity-55'}`}
    >
      {/* Grip */}
      <span aria-hidden="true" className="flex shrink-0">
        <GripVertical size={14} className="text-[var(--text-muted)] cursor-grab" />
      </span>

      {/* Sort order badge */}
      <span aria-hidden="true" className="min-w-[22px] text-center font-mono text-[11px] text-[var(--text-muted)] shrink-0">
        {section.sort_order + 1}
      </span>

      {/* Section label */}
      <span className={`flex-1 font-body text-[13px] font-medium overflow-hidden text-ellipsis whitespace-nowrap ${section.is_visible ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
        {getSectionLabel(section.section_type)}
        {section.name && (
          <span className="ml-[6px] text-[11px] text-[var(--text-muted)] font-normal">
            — {section.name}
          </span>
        )}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">

        {/* Move up */}
        <button
          type="button"
          disabled={isFirst}
          onClick={onMoveUp}
          aria-label="Move section up"
          title="Move up"
          className={isFirst ? iconBtnDisabledCls : iconBtnCls}
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
          className={isLast ? iconBtnDisabledCls : iconBtnCls}
        >
          <ChevronDown size={12} aria-hidden="true" />
        </button>

        {/* Visibility toggle — color changes based on is_visible, keep as conditional class */}
        <button
          type="button"
          onClick={onToggle}
          disabled={isToggling}
          aria-label={section.is_visible ? 'Hide section' : 'Show section'}
          aria-pressed={section.is_visible}
          title={section.is_visible ? 'Hide section' : 'Show section'}
          className={`${iconBtnCls} ${
            section.is_visible
              ? 'text-[var(--lito-teal)] border-[var(--lito-teal)]'
              : 'text-[var(--text-muted)] border-[var(--lito-border)]'
          } ${isToggling ? 'opacity-50 cursor-wait' : ''}`}
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
              className={`${iconBtnCls} border-[var(--lito-teal)] bg-[var(--lito-teal)] text-white ${isDeleting ? 'opacity-60 cursor-wait' : ''}`}
            >
              <Check size={12} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              aria-label="Cancel delete"
              title="Cancel"
              className={iconBtnCls}
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
            className={`${iconBtnCls} hover:text-[#dc2626] hover:border-[#dc2626]`}
          >
            <Trash2 size={12} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

interface PageSectionsManagerProps {
  pageId:       string
  pageTitle:    string
  pageSlug:     string
  templateSlug: string
  onClose:      () => void
}

export function PageSectionsManager({ pageId, pageTitle, pageSlug, templateSlug, onClose }: PageSectionsManagerProps) {
  const qc = useQueryClient()
  const [dragIdx,     setDragIdx]     = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [addType,     setAddType]     = useState<SectionType | ''>('')

  // Allowed section types come from template-registry, not a hardcoded list.
  // Priority: page-specific allowedTypes → template globalSections → empty (block add).
  const allowedSectionTypes = useMemo<string[]>(() => {
    try {
      const tmpl = getTemplate(templateSlug)
      // Try page-specific allowed list first
      try {
        const page = getPageManifest(templateSlug, `/${pageSlug.replace(/^\//, '')}`)
        if (page.allowedTypes && page.allowedTypes.length > 0) return page.allowedTypes
      } catch { /* page slug not in registry — fall through to globalSections */ }
      return tmpl.globalSections ?? []
    } catch {
      return [] // unknown template — no add allowed
    }
  }, [templateSlug, pageSlug])

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

  const toggleMutation  = useMutation({ mutationFn: ({ id, is_visible }: { id: string; is_visible: boolean }) => pageSectionsService.toggleVisibility(pageId, id, is_visible), onSuccess: invalidate })
  const deleteMutation  = useMutation({ mutationFn: (id: string) => pageSectionsService.remove(pageId, id), onSuccess: invalidate })
  const reorderMutation = useMutation({ mutationFn: (order: Array<{ id: string; sort_order: number }>) => pageSectionsService.reorder(pageId, order), onSuccess: invalidate })
  const addMutation     = useMutation({ mutationFn: (section_type: string) => pageSectionsService.create(pageId, { section_type, sort_order: sections.length, is_visible: true }), onSuccess: () => { invalidate(); setAddType('') } })

  const handleDrop = useCallback((targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return
    const reordered = [...sections]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    reorderMutation.mutate(reordered.map((s, i) => ({ id: s.id, sort_order: i })))
    setDragIdx(null); setDragOverIdx(null)
  }, [dragIdx, sections, reorderMutation])

  const moveSection = useCallback((idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sections.length) return
    const reordered = [...sections];
    [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]]
    reorderMutation.mutate(reordered.map((s, i) => ({ id: s.id, sort_order: i })))
  }, [sections, reorderMutation])

  const handleBackdropKey = (e: React.KeyboardEvent) => { if (e.key === 'Escape') onClose() }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Section Manager"
      onKeyDown={handleBackdropKey}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.55)] backdrop-blur-[4px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="document"
        className="bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-xl w-full max-w-[560px] max-h-[85vh] flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.30)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--lito-border)] shrink-0">
          <div>
            <p className="font-display text-base font-semibold text-[var(--text-primary)] m-0 leading-[1.3]">
              Section Manager
            </p>
            <p className="font-body text-xs text-[var(--text-muted)] mt-0.5 mb-0">
              {pageTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close section manager"
            title="Close"
            className={`${iconBtnCls} px-2 py-[6px] rounded-[7px] hover:bg-[var(--cms-surface-3)] hover:text-[var(--text-primary)]`}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        {/* Section list */}
        <div
          role="list"
          aria-label="Page sections"
          className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-[6px]"
        >
          {isLoading && (
            <div className="flex flex-col items-center gap-2 py-8">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-11 rounded-lg w-full bg-[var(--cms-surface-3)] animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 px-[14px] py-3 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-3)] text-[var(--text-muted)] font-body text-[13px]">
              <AlertCircle size={14} aria-hidden="true" />
              Failed to load sections. Check your connection and try again.
            </div>
          )}

          {!isLoading && !isError && sections.length === 0 && (
            <div className="flex flex-col items-center gap-[6px] py-8 font-body text-[13px] text-[var(--text-muted)] text-center">
              <Plus size={20} className="opacity-40" aria-hidden="true" />
              No sections yet. Add one below.
            </div>
          )}

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
        <div className="px-5 pt-3 pb-4 border-t border-[var(--lito-border)] flex gap-2 items-center shrink-0">
          <select
            value={addType}
            onChange={e => setAddType(e.target.value as SectionType | '')}
            aria-label="Select section type to add"
            className={`flex-1 px-[10px] py-[7px] rounded-[7px] border border-[var(--lito-border)] bg-[var(--cms-surface-3)] font-body text-[13px] outline-none cursor-pointer ${addType ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
            style={{ colorScheme: 'light dark' }}
          >
            <option value="">— Add section type —</option>
            {allowedSectionTypes.map(t => (
              <option key={t} value={t}>{getSectionLabel(t)}</option>
            ))}
          </select>

          <button
            type="button"
            disabled={!addType || addMutation.isPending}
            onClick={() => addType && addMutation.mutate(addType)}
            aria-label="Add selected section type"
            className={`inline-flex items-center gap-[5px] px-[14px] py-[7px] rounded-[7px] border border-[var(--lito-teal)] font-body text-[13px] font-medium shrink-0 transition-[background,color,opacity] duration-150 ${
              addType && !addMutation.isPending
                ? 'bg-[var(--lito-teal)] text-white cursor-pointer'
                : 'bg-transparent text-[var(--lito-teal)] cursor-not-allowed opacity-50'
            }`}
          >
            <Plus size={13} aria-hidden="true" />
            {addMutation.isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
