import { cn } from '@/lib/utils'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

const POSITION_CLS: Record<TooltipPosition, string> = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left:   'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right:  'left-full top-1/2 -translate-y-1/2 ml-1.5',
}

interface TooltipProps {
  content: string
  position?: TooltipPosition
  children: React.ReactNode
  className?: string
}

export function Tooltip({ content, position = 'top', children, className }: TooltipProps) {
  return (
    <span className={cn('relative inline-flex group', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'absolute z-50 pointer-events-none whitespace-nowrap',
          'px-2 py-1 rounded-[var(--radius-sm)]',
          'font-body text-[11px] font-medium',
          'bg-[var(--text-primary)] text-[var(--cms-card-bg)]',
          'opacity-0 scale-95 transition-all duration-120',
          'group-hover:opacity-100 group-hover:scale-100',
          POSITION_CLS[position],
        )}
      >
        {content}
      </span>
    </span>
  )
}
