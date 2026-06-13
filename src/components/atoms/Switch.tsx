import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  id?: string
  className?: string
}

export function Switch({ checked, onChange, disabled, label, id, className }: SwitchProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  return (
    <label
      htmlFor={inputId}
      className={cn(
        'inline-flex items-center gap-2 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <span className="relative inline-flex">
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
          aria-checked={checked}
        />
        {/* Track */}
        <span
          className={cn(
            'w-9 h-5 rounded-full transition-colors duration-180',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-[var(--lito-teal)]',
            checked ? 'bg-[var(--lito-teal)]' : 'bg-[var(--lito-border)]',
          )}
        />
        {/* Thumb */}
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-180',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </span>
      {label && (
        <span className="font-body text-sm text-[var(--text-primary)]">{label}</span>
      )}
    </label>
  )
}
