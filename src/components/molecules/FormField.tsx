/**
 * FormField / TextAreaField — uncontrolled base input components.
 *
 * Pass `maxLength` to enable:
 *   • Hard character cap on the HTML element
 *   • Live "x / max" counter in the label row
 *   • Counter turns amber at ≥90% usage, red when at limit
 */

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ── Shared counter helper ──────────────────────────────────────────────────

function counterColor(len: number, max: number): string {
  if (len >= max)                       return 'text-[var(--s-danger)]'
  if (len >= Math.floor(max * 0.9))     return 'text-[var(--lito-gold-deep)]'
  return 'text-[var(--text-faint)]'
}

// ── FormField ──────────────────────────────────────────────────────────────

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  required?: boolean
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, required, className, id, maxLength, value, defaultValue, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
    const currentLen = String(value ?? defaultValue ?? '').length
    const showCounter = maxLength !== undefined

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={fieldId} className="cms-label">
            {label}
            {required && <span className="text-[var(--s-danger)] ml-0.5">*</span>}
          </label>
          {showCounter && (
            <span className={cn('font-body text-[11px] tabular-nums', counterColor(currentLen, maxLength!))}>
              {currentLen}/{maxLength}
            </span>
          )}
        </div>
        <input
          ref={ref}
          id={fieldId}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          className={cn(
            'cms-input',
            error && 'border-[var(--s-danger)] focus:border-[var(--s-danger)]',
            className,
          )}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          aria-invalid={!!error}
          {...props}
        />
        {hint && !error && (
          <p id={`${fieldId}-hint`} className="font-body text-xs text-[var(--text-muted)]">{hint}</p>
        )}
        {error && (
          <p id={`${fieldId}-error`} className="font-body text-xs text-[var(--s-danger)]" role="alert">{error}</p>
        )}
      </div>
    )
  },
)
FormField.displayName = 'FormField'

// ── TextAreaField ──────────────────────────────────────────────────────────

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
  required?: boolean
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, hint, required, className, id, maxLength, value, defaultValue, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
    const currentLen = String(value ?? defaultValue ?? '').length
    const showCounter = maxLength !== undefined

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={fieldId} className="cms-label">
            {label}
            {required && <span className="text-[var(--s-danger)] ml-0.5">*</span>}
          </label>
          {showCounter && (
            <span className={cn('font-body text-[11px] tabular-nums', counterColor(currentLen, maxLength!))}>
              {currentLen}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={fieldId}
          rows={4}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          className={cn(
            'cms-input resize-y min-h-[80px]',
            error && 'border-[var(--s-danger)]',
            className,
          )}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          aria-invalid={!!error}
          {...props}
        />
        {hint && !error && (
          <p id={`${fieldId}-hint`} className="font-body text-xs text-[var(--text-muted)]">{hint}</p>
        )}
        {error && (
          <p id={`${fieldId}-error`} className="font-body text-xs text-[var(--s-danger)]" role="alert">{error}</p>
        )}
      </div>
    )
  },
)
TextAreaField.displayName = 'TextAreaField'
