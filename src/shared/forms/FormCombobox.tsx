/**
 * FormCombobox — searchable select/combobox wired to react-hook-form Controller.
 * Renders a text input + filterable dropdown list.
 * For large option sets (100+ items) consider a virtualised list.
 *
 * @example
 *   <FormCombobox
 *     name="category"
 *     control={form.control}
 *     label="Category"
 *     options={categories.map(c => ({ value: c.id, label: c.name }))}
 *     placeholder="Search categories…"
 *   />
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

  // Close on outside click
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
      <div ref={containerRef} style={{ position: 'relative' }}>
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
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0, right: 0,
              background: 'white',
              border: '1px solid var(--lito-border)',
              borderRadius: 8,
              zIndex: 50,
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
            }}
          >
            {/* Search input */}
            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--lito-border)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={placeholder}
                style={{
                  flex: 1, border: 'none', background: 'transparent', outline: 'none',
                  fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Options */}
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                  No results
                </div>
              ) : filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => handleSelect(opt)}
                  style={{
                    width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                    padding: '9px 14px',
                    background: opt.value === value ? 'var(--cms-surface-3)' : 'white',
                    borderBottom: '1px solid rgba(217,210,199,0.3)',
                    transition: 'background 100ms',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--cms-surface-3)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = opt.value === value ? 'var(--cms-surface-3)' : 'white' }}
                >
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)' }}>{opt.label}</div>
                  {opt.description && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{opt.description}</div>
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
