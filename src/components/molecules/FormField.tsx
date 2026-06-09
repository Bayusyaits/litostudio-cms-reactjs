import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  required?: boolean
}

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
  required?: boolean
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="cms-label">
          {label}
          {required && <span className="text-[var(--s-danger)] ml-0.5">*</span>}
        </label>
        <input
          ref={ref}
          id={fieldId}
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

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="cms-label">
          {label}
          {required && <span className="text-[var(--s-danger)] ml-0.5">*</span>}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          rows={4}
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
