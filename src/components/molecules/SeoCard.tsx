/**
 * SeoCard — collapsible SEO meta fields panel.
 *
 * Controlled: pass metaTitle / metaDescription strings + onChange handlers.
 * Shows a Google SERP preview at the bottom.
 *
 * Limits are hard-capped (not soft) via maxLength — aligned with FIELD_LIMITS.
 * Counter turns amber at ≥90% usage, red at limit.
 */

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FIELD_LIMITS } from '@/lib/fieldLimits'

interface SeoCardProps {
  metaTitle: string
  metaDescription: string
  slug?: string
  siteDomain?: string
  onMetaTitleChange: (v: string) => void
  onMetaDescriptionChange: (v: string) => void
  disabled?: boolean
  className?: string
}

function counterColor(len: number, max: number): string {
  if (len >= max)                     return 'text-[var(--s-danger)]'
  if (len >= Math.floor(max * 0.9))   return 'text-[var(--lito-gold-deep)]'
  return 'text-[var(--text-faint)]'
}

export function SeoCard({
  metaTitle,
  metaDescription,
  slug,
  siteDomain = 'yoursite.com',
  onMetaTitleChange,
  onMetaDescriptionChange,
  disabled,
  className,
}: SeoCardProps) {
  const [open, setOpen] = useState(false)

  const TITLE_MAX = FIELD_LIMITS.META_TITLE
  const DESC_MAX  = FIELD_LIMITS.META_DESCRIPTION

  const previewUrl   = slug ? `${siteDomain}/${slug}` : siteDomain
  const titleDisplay = metaTitle.trim() || 'Page title'
  const descDisplay  = metaDescription.trim() || 'Page description will appear here…'

  return (
    <div className={cn('cms-card overflow-hidden', className)}>
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[rgba(0,0,0,0.02)] transition-colors"
        aria-expanded={open}
      >
        <div>
          <span className="font-body text-sm font-semibold text-[var(--text-primary)]">SEO</span>
          {!open && (metaTitle || metaDescription) && (
            <p className="font-body text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-[200px]">
              {metaTitle || metaDescription}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn('w-4 h-4 text-[var(--text-muted)] transition-transform duration-180', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-[var(--lito-border)]">
          {/* Meta title */}
          <div className="space-y-1.5 pt-4">
            <div className="flex items-center justify-between">
              <label className="cms-label">Meta Title</label>
              <span className={cn('font-body text-[11px] tabular-nums', counterColor(metaTitle.length, TITLE_MAX))}>
                {metaTitle.length}/{TITLE_MAX}
              </span>
            </div>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => onMetaTitleChange(e.target.value)}
              placeholder="Leave blank to use page title"
              maxLength={TITLE_MAX}
              disabled={disabled}
              className={cn(
                'cms-input w-full',
                metaTitle.length >= TITLE_MAX && 'border-[var(--s-danger)]',
              )}
            />
          </div>

          {/* Meta description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="cms-label">Meta Description</label>
              <span className={cn('font-body text-[11px] tabular-nums', counterColor(metaDescription.length, DESC_MAX))}>
                {metaDescription.length}/{DESC_MAX}
              </span>
            </div>
            <textarea
              value={metaDescription}
              onChange={(e) => onMetaDescriptionChange(e.target.value)}
              placeholder="Leave blank to use page excerpt"
              maxLength={DESC_MAX}
              rows={3}
              disabled={disabled}
              className={cn(
                'cms-input w-full resize-none',
                metaDescription.length >= DESC_MAX && 'border-[var(--s-danger)]',
              )}
            />
          </div>

          {/* SERP preview */}
          <div className="rounded-[var(--radius-md)] border border-[var(--lito-border)] p-3 bg-[rgba(0,0,0,0.02)]">
            <p className="font-body text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wide mb-2">
              Search preview
            </p>
            <p className="font-body text-xs text-[var(--text-faint)] truncate">{previewUrl}</p>
            <p className="font-body text-sm text-[#1a0dab] font-medium truncate mt-0.5">
              {titleDisplay.slice(0, TITLE_MAX)}
            </p>
            <p className="font-body text-xs text-[#4d5156] mt-0.5 line-clamp-2">
              {descDisplay.slice(0, DESC_MAX)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
