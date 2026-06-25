/**
 * FormFieldWrapper — base layout used by all shared form components.
 * Renders: label (+ optional char counter) → field slot → helper / error.
 * Accessible: aria-describedby wires label → input → error.
 */

import { cn } from '@/lib/utils'

interface CounterProps {
  current: number
  max: number
}

interface FormFieldWrapperProps {
  fieldId: string
  label?: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: React.ReactNode
  /** When set, renders a live "x / max" counter next to the label */
  counter?: CounterProps
}

function counterColor(current: number, max: number): string {
  if (current >= max)                     return 'text-[var(--s-danger)]'
  if (current >= Math.floor(max * 0.9))   return 'text-[var(--lito-gold-deep)]'
  return 'text-[var(--text-faint)]'
}

export function FormFieldWrapper({
  fieldId, label, required, error, hint, className, children, counter,
}: FormFieldWrapperProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || counter) && (
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={fieldId} className="cms-label">
              {label}
              {required && (
                <span className="text-[var(--s-danger)] ml-0.5" aria-hidden="true">*</span>
              )}
            </label>
          )}
          {counter && (
            <span
              className={cn(
                'font-body text-[11px] tabular-nums',
                counterColor(counter.current, counter.max),
              )}
              aria-live="polite"
              aria-label={`${counter.current} of ${counter.max} characters used`}
            >
              {counter.current}/{counter.max}
            </span>
          )}
        </div>
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
