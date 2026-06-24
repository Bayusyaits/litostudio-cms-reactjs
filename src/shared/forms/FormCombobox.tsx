/**
 * FormCombobox — searchable select/combobox wired to react-hook-form Controller.
 */

import { useState, useRef, useEffect, useId } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Search, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormFieldWrapper } from './FormFieldWrapper'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
}

interface FormComboboxProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label?: string
  options: ComboboxOption[]
  placeholder?: string
  required?: boolean
  hint?: string
  disabled?: boolean
  className?: string
  id?: string
  onValueChange?: (value: string) => void
}

export function FormCombobox<T extends FieldValues>({
  name,
  control,
  label,
  options,
  placeholder = 'Search…',
  required,
  hint,
  disabled,
  className,
  id,
  onValueChange,
}: FormComboboxProps<T>) {
  const uid = useId()
  const fieldId = id ?? uid

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        return (
          <ComboboxInner
            fieldId={fieldId}
            value={field.value ?? ''}
            onChange={(v) => {
              field.onChange(v)
              onValueChange?.(v)
            }}
            onBlur={field.onBlur}
            label={label}
            options={options}
            placeholder={placeholder}
            required={required}
            hint={hint}
            disabled={disabled}
            error={error?.message}
            className={className}
          />
        )
      }}
    />
  )
}

// ── Internal controlled combobox ──────────────────────────────────────────────

interface ComboboxInnerProps {
  fieldId: string
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  label?: string
  options: ComboboxOption[]
  placeholder: string
  required?: boolean
  hint?: string
  disabled?: boolean
  error?: string
  className?: string
}

function ComboboxInner({
  fieldId, value, onChange, onBlur, label, options, placeholder,
  required, hint, disabled, error, className,
}: ComboboxInnerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find(o => o.value === value)

  const filtered = search.trim()
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
        onBlur()
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onBlur])

  function handleOpen() {
    if (disabled) return
    setOpen(true)
    setSearch('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function handleSelect(opt: ComboboxOption) {
    onChange(opt.value)
    setOpen(false)
    setSearch('')
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  return (
    <FormFieldWrapper
      fieldId={fieldId}
      label={label}
      required={required}
      error={error}
      hint={hint}
      className={className}
    >
      <div ref={containerRef} className="relative">
        {/* Trigger */}
        <button
          type="button"
          id={fieldId}
          onClick={handleOpen}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={!!error}
          aria-required={required}
          className={cn(
            'cms-input w-full text-left flex items-center justify-between gap-2',
            error && 'border-[var(--s-danger)]',
            disabled && 'opacity-60 cursor-not-allowed',
          )}
        >
          <span className={cn(
            'truncate font-body text-sm',
            selectedOption ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]',
          )}>
            {selectedOption?.label ?? placeholder}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => { if (e.key === 'Enter') handleClear(e as unknown as React.MouseEvent) }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={12} />
              </span>
            )}
            <ChevronDown
              size={13}
              className={cn(
                'text-[var(--text-muted)] transition-transform',
                open && 'rotate-180',
              )}
            />
          </div>
        </button>

        {/* Dropdown */}
        {open && (
          <div
            role="listbox"
            aria-label={label}
            className="absolute top-[calc(100%+4px)] left-0 right-0 bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-lg z-50 shadow-[var(--shadow-lg)] overflow-hidden"
          >
            {/* Search input */}
            <div className="px-[10px] py-2 border-b border-[var(--lito-border)] flex items-center gap-1.5">
              <Search size={12} className="text-[var(--text-muted)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={placeholder}
                className="flex-1 border-none bg-transparent outline-none font-body text-xs text-[var(--text-primary)]"
              />
            </div>

            {/* Options */}
            <div className="max-h-[200px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3.5 py-3 font-body text-xs text-[var(--text-muted)] text-center">
                  No results
                </div>
              ) : filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left border-none cursor-pointer px-3.5 py-[9px] border-b border-[rgba(217,210,199,0.3)] transition-[background] duration-100 hover:bg-[var(--cms-surface-3)] ${opt.value === value ? 'bg-[var(--cms-surface-3)]' : 'bg-[var(--cms-card-bg)]'}`}
                >
                  <div className="font-body text-[13px] text-[var(--text-primary)]">{opt.label}</div>
                  {opt.description && (
                    <div className="font-body text-[11px] text-[var(--text-muted)] mt-px">{opt.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </FormFieldWrapper>
  )
}
