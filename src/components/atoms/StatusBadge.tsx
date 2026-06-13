import { cn } from '@/lib/utils'
import type { ContentStatus } from '@/types/api.types'

interface StatusBadgeProps {
  status: ContentStatus | string
  className?: string
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Published', cls: 'text-[var(--s-pub-fg)] bg-[var(--s-pub-bg)]' },
  draft:     { label: 'Draft',     cls: 'text-[var(--s-draft-fg)] bg-[var(--s-draft-bg)]' },
  scheduled: { label: 'Scheduled', cls: 'text-[var(--s-sched-fg)] bg-[var(--s-sched-bg)]' },
  archived:  { label: 'Archived',  cls: 'text-[var(--s-arch-fg)] bg-[var(--s-arch-bg)]' },
  inactive:  { label: 'Inactive',  cls: 'text-[var(--s-arch-fg)] bg-[var(--s-arch-bg)]' },
  pending:   { label: 'Pending',   cls: 'text-[var(--s-draft-fg)] bg-[var(--s-draft-bg)]' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: 'text-ink-light bg-[rgba(107,101,96,0.1)]' }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-pill font-body text-[11px] font-medium',
        cfg.cls,
        className,
      )}
    >
      {cfg.label}
    </span>
  )
}
