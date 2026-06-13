/**
 * FormInput — text/email/number/password input wired to react-hook-form Controller.
 *
 * @example
 *   <FormInput
 *     name="email"
 *     control={form.control}
 *     label="Email address"
 *     type="email"
 *     required
 *     placeholder="you@example.com"
 *   />
 */

import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { FormFieldWrapper } from './FormFieldWrapper'

interface FormInputProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label?: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
  required?: boolean
  hint?: string
  disabled?: boolean
  loading?: boolean
  className?: string
  inputClassName?: string
  id?: string
  autoComplete?: string
  autoFocus?: boolean
  min?: number | string
  max?: number | string
  step?: number | string
  /** Callback fired on change (in addition to RHF's own handler) */
  onValueChange?: (value: string) => void
}

export function FormInput<T extends FieldValues>({
  name,
  control,
  label,
  type = 'text',
  placeholder,
  required,
  hint,
  disabled,
  loading,
  className,
  inputClassName,
  id,
  autoComplete,
  autoFocus,
  min,
  max,
  step,
  onValueChange,
}: FormInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const fieldId = id ?? name
        return (
          <FormFieldWrapper
            fieldId={fieldId}
            label={label}
            required={required}
            error={error?.message}
            hint={hint}
            className={className}
          >
            <input
              {...field}
              id={fieldId}
              type={type}
              placeholder={placeholder}
              disabled={disabled || loading}
              autoComplete={autoComplete}
              autoFocus={autoFocus}
              min={min}
              max={max}
              step={step}
              value={field.value ?? ''}
              onChange={(e) => {
                field.onChange(e)
                onValueChange?.(e.target.value)
              }}
              aria-describedby={
                error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
              }
              aria-invalid={!!error}
              aria-required={required}
              className={cn(
                'cms-input',
                error && 'border-[var(--s-danger)] focus:border-[var(--s-danger)]',
                (disabled || loading) && 'opacity-60 cursor-not-allowed',
                inputClassName,
              )}
            />
          </FormFieldWrapper>
        )
      }}
    />
  )
}
