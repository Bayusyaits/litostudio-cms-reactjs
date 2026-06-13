import { cn } from '@/lib/utils'

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

const VARIANT_CLS: Record<Variant, string> = {
  default: 'text-[var(--text-muted)] bg-[rgba(107,101,96,0.1)]',
  primary: 'text-[var(--lito-teal)] bg-[rgba(26,74,90,0.1)]',
  success: 'text-[var(--s-pub-fg)] bg-[var(--s-pub-bg)]',
  warning: 'text-[var(--s-draft-fg)] bg-[var(--s-draft-bg)]',
  danger:  'text-[var(--s-danger)] bg-[rgba(163,48,40,0.08)]',
  info:    'text-[var(--lito-teal-soft)] bg-[rgba(46,102,117,0.1)]',
}

interface BadgeProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-pill font-body text-[11px] font-medium',
        VARIANT_CLS[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
