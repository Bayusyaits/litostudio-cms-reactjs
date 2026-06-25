/**
 * FormInput — text/email/number/password input wired to react-hook-form Controller.
 *
 * Pass `maxLength` to enable:
 *   • Hard character cap on the HTML element
 *   • Live "x / max" counter shown beside the label
 *   • Counter turns amber at ≥90% usage, red when at limit
 *
 * @example
 *   <FormInput name="title" control={form.control} label="Title" maxLength={255} />
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
  /** Hard character cap — also shows live x/max counter next to the label */
  maxLength?: number
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
  maxLength,
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
        const currentLen = String(field.value ?? '').length
        const showCounter = maxLength !== undefined && !!label

        return (
          <FormFieldWrapper
            fieldId={fieldId}
            label={label}
            required={required}
            error={error?.message}
            hint={hint}
            className={className}
            counter={showCounter ? { current: currentLen, max: maxLength! } : undefined}
          >
            <input
              {...field}
              id={fieldId}
              type={type}
              placeholder={placeholder}
              disabled={disabled || loading}
              autoComplete={autoComplete}
              autoFocus={autoFocus}
              maxLength={maxLength}
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
