import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type Size    = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?:    Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantCls: Record<Variant, string> = {
  primary:   'bg-ink text-cream hover:bg-[#2B2B2B] focus-visible:ring-ink',
  secondary: 'border border-ink text-ink bg-transparent hover:bg-ink hover:text-cream',
  ghost:     'border border-border text-ink-light bg-transparent hover:bg-cream-alt hover:text-ink',
  danger:    'bg-[var(--s-danger-bg)] text-[var(--s-danger)] border border-[rgba(163,48,40,0.2)] hover:bg-[rgba(163,48,40,0.14)]',
  gold:      'bg-gold text-ink hover:bg-gold-deep',
}

const sizeCls: Record<Size, string> = {
  sm:   'px-3 py-1.5 text-xs gap-1.5',
  md:   'px-4 py-[7px] text-sm gap-2',
  lg:   'px-5 py-2.5 text-base gap-2',
  icon: 'p-[7px] min-w-[34px] justify-center',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center font-body font-medium rounded-pill transition-all text-center justify-center duration-180 cursor-pointer select-none whitespace-nowrap',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:opacity-45 disabled:cursor-not-allowed',
        variantCls[variant],
        sizeCls[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner size={14} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  ),
)
Button.displayName = 'Button'

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="animate-spin"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
