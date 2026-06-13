/**
 * FormSelect — native <select> wired to react-hook-form Controller.
 *
 * @example
 *   <FormSelect
 *     name="status"
 *     control={form.control}
 *     label="Status"
 *     options={[
 *       { value: 'draft',     label: 'Draft' },
 *       { value: 'published', label: 'Published' },
 *     ]}
 *     required
 *   />
 */

import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { FormFieldWrapper } from './FormFieldWrapper'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface FormSelectProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label?: string
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  hint?: string
  disabled?: boolean
  loading?: boolean
  className?: string
  selectClassName?: string
  id?: string
  onValueChange?: (value: string) => void
}

export function FormSelect<T extends FieldValues>({
  name,
  control,
  label,
  options,
  placeholder,
  required,
  hint,
  disabled,
  loading,
  className,
  selectClassName,
  id,
  onValueChange,
}: FormSelectProps<T>) {
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
            <select
              {...field}
              id={fieldId}
              disabled={disabled || loading}
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
                'cms-input pr-8',
                error && 'border-[var(--s-danger)] focus:border-[var(--s-danger)]',
                (disabled || loading) && 'opacity-60 cursor-not-allowed',
                selectClassName,
              )}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormFieldWrapper>
        )
      }}
    />
  )
}
