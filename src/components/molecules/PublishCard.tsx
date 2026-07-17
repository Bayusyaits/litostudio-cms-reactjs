/**
 * PublishCard — sidebar publish action panel (Shopify-style).
 *
 * Shows status selector, save draft button, and publish/unpublish button.
 * Emits onSave(status) — caller handles the API call.
 */

import { Globe, FileText, Archive, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Select } from '@litostudio/ui-cms'
import type { ContentStatus } from '@litostudio/ui-cms'

const STATUS_OPTIONS: { value: ContentStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'draft',     label: 'Draft',     icon: <FileText className="w-3.5 h-3.5" /> },
  { value: 'published', label: 'Published', icon: <Globe    className="w-3.5 h-3.5" /> },
  { value: 'scheduled', label: 'Scheduled', icon: <Clock    className="w-3.5 h-3.5" /> },
  { value: 'archived',  label: 'Archived',  icon: <Archive  className="w-3.5 h-3.5" /> },
]

interface PublishCardProps {
  status: ContentStatus
  onStatusChange: (status: ContentStatus) => void
  onSave: () => void
  onPublish?: () => void
  isSaving?: boolean
  isPublishing?: boolean
  /** show "Publish" button only when status !== 'published' */
  className?: string
  lastSaved?: string | null
}

export function PublishCard({
  status,
  onStatusChange,
  onSave,
  onPublish,
  isSaving,
  isPublishing,
  className,
  lastSaved,
}: PublishCardProps) {
  return (
    <div className={cn('cms-card overflow-hidden', className)}>
      <div className="px-4 py-3 border-b border-[var(--lito-border)]">
        <span className="font-body text-sm font-semibold text-[var(--text-primary)]">Publishing</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Status selector */}
        <div className="space-y-1.5">
          <label className="cms-label">Visibility</label>
          <Select
            className="w-full"
            value={status}
            onChange={(v) => onStatusChange(v as ContentStatus)}
            disabled={isSaving || isPublishing}
            options={STATUS_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
          />
        </div>

        {/* Status badge row */}
        <div className="flex items-center gap-2">
          {STATUS_OPTIONS.find((o) => o.value === status)?.icon}
          <span className={cn(
            'font-body text-xs font-medium',
            status === 'published' && 'text-[var(--s-pub-fg)]',
            status === 'draft'     && 'text-[var(--s-draft-fg)]',
            status === 'archived'  && 'text-[var(--s-arch-fg)]',
          )}>
            {STATUS_OPTIONS.find((o) => o.value === status)?.label}
          </span>
          {lastSaved && (
            <span className="ml-auto font-body text-[10px] text-[var(--text-faint)]">
              Saved {lastSaved}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button skin="cms"
            type="button"
            variant="secondary"
            size="sm"
            loading={isSaving}
            onClick={onSave}
            className="w-full justify-center"
          >
            Save Draft
          </Button>

          {status !== 'published' && onPublish && (
            <Button skin="cms"
              type="button"
              variant="primary"
              size="sm"
              loading={isPublishing}
              onClick={onPublish}
              className="w-full justify-center"
            >
              Publish
            </Button>
          )}

          {status === 'published' && onPublish && (
            <Button skin="cms"
              type="button"
              variant="ghost"
              size="sm"
              onClick={onPublish}
              className="w-full justify-center text-[var(--s-danger)]"
            >
              Unpublish
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
