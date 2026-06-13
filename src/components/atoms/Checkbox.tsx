import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
      <label
        htmlFor={inputId}
        className={cn(
          'inline-flex items-center gap-2 cursor-pointer select-none font-body text-sm text-[var(--text-primary)]',
          props.disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={cn(
            'w-4 h-4 rounded border-[var(--lito-border)] accent-[var(--lito-teal)]',
            'focus-visible:ring-2 focus-visible:ring-[var(--lito-teal)] focus-visible:ring-offset-1',
          )}
          {...props}
        />
        {label && <span>{label}</span>}
      </label>
    )
  },
)
Checkbox.displayName = 'Checkbox'
