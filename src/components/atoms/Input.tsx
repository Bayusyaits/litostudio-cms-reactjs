import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'cms-input w-full',
        error && 'border-[var(--s-danger)] focus:border-[var(--s-danger)]',
        className,
      )}
      aria-invalid={error}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
