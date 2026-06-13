import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required, children, className, ...props }, ref) => (
    <label ref={ref} className={cn('cms-label', className)} {...props}>
      {children}
      {required && <span className="text-[var(--s-danger)] ml-0.5">*</span>}
    </label>
  ),
)
Label.displayName = 'Label'
