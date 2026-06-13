import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagProps {
  label: string
  onRemove?: () => void
  className?: string
}

export function Tag({ label, onRemove, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-pill font-body text-xs',
        'bg-[rgba(26,74,90,0.1)] text-[var(--lito-teal)]',
        'border border-[rgba(26,74,90,0.15)]',
        className,
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full hover:bg-[rgba(26,74,90,0.2)] p-0.5 transition-colors"
          aria-label={`Remove ${label}`}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  )
}
