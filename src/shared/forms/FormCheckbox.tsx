/**
 * FormCheckbox — checkbox wired to react-hook-form Controller.
 *
 * @example
 *   <FormCheckbox
 *     name="acceptTerms"
 *     control={form.control}
 *     label="I agree to the terms and conditions"
 *     required
 *   />
 */

import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { cn } from '@/lib/utils'

interface FormCheckboxProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label: React.ReactNode
  required?: boolean
  hint?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function FormCheckbox<T extends FieldValues>({
  name,
  control,
  label,
  required,
  hint,
  disabled,
  className,
  id,
}: FormCheckboxProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const fieldId = id ?? name
        return (
          <div className={cn('space-y-1', className)}>
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id={fieldId}
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                disabled={disabled}
                aria-describedby={
                  error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
                }
                aria-invalid={!!error}
                aria-required={required}
                className={cn(
                  'mt-0.5 h-4 w-4 rounded border-[var(--lito-border)] accent-[var(--lito-teal)]',
                  disabled && 'opacity-60 cursor-not-allowed',
                )}
              />
              <label
                htmlFor={fieldId}
                className={cn(
                  'font-body text-sm text-[var(--text-primary)] cursor-pointer leading-tight',
                  disabled && 'opacity-60 cursor-not-allowed',
                )}
              >
                {label}
                {required && (
                  <span className="text-[var(--s-danger)] ml-0.5" aria-hidden="true">*</span>
                )}
              </label>
            </div>

            {hint && !error && (
              <p id={`${fieldId}-hint`} className="ml-6.5 font-body text-xs text-[var(--text-muted)]">
                {hint}
              </p>
            )}
            {error && (
              <p
                id={`${fieldId}-error`}
                role="alert"
                className="ml-6.5 font-body text-xs text-[var(--s-danger)]"
              >
                {error.message}
              </p>
            )}
          </div>
        )
      }}
    />
  )
}
