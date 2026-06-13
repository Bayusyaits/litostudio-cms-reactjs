/**
 * FormFieldWrapper — base layout used by all shared form components.
 * Renders: label → field slot → helper text or error message.
 * Accessible: aria-describedby wires label → input → error.
 */

import { cn } from '@/lib/utils'

interface FormFieldWrapperProps {
  fieldId: string
  label?: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: React.ReactNode
}

export function FormFieldWrapper({
  fieldId, label, required, error, hint, className, children,
}: FormFieldWrapperProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={fieldId} className="cms-label">
          {label}
          {required && (
            <span className="text-[var(--s-danger)] ml-0.5" aria-hidden="true">*</span>
          )}
        </label>
      )}

      {children}

      {hint && !error && (
        <p id={`${fieldId}-hint`} className="font-body text-xs text-[var(--text-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${fieldId}-error`}
          role="alert"
          className="font-body text-xs text-[var(--s-danger)]"
        >
          {error}
        </p>
      )}
    </div>
  )
}
