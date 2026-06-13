/**
 * FormTextarea — multi-line text area wired to react-hook-form Controller.
 */

import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { FormFieldWrapper } from './FormFieldWrapper'

interface FormTextareaProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label?: string
  placeholder?: string
  required?: boolean
  hint?: string
  disabled?: boolean
  rows?: number
  className?: string
  textareaClassName?: string
  id?: string
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
  onValueChange?: (value: string) => void
}

export function FormTextarea<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  required,
  hint,
  disabled,
  rows = 4,
  className,
  textareaClassName,
  id,
  resize = 'vertical',
  onValueChange,
}: FormTextareaProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const fieldId = id ?? name
        const resizeClass =
          resize === 'none'       ? 'resize-none' :
          resize === 'horizontal' ? 'resize-x' :
          resize === 'both'       ? 'resize' :
          'resize-y'

        return (
          <FormFieldWrapper
            fieldId={fieldId}
            label={label}
            required={required}
            error={error?.message}
            hint={hint}
            className={className}
          >
            <textarea
              {...field}
              id={fieldId}
              rows={rows}
              placeholder={placeholder}
              disabled={disabled}
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
                'cms-input min-h-[80px]',
                resizeClass,
                error && 'border-[var(--s-danger)] focus:border-[var(--s-danger)]',
                disabled && 'opacity-60 cursor-not-allowed',
                textareaClassName,
              )}
            />
          </FormFieldWrapper>
        )
      }}
    />
  )
}
