/**
 * TagInput — comma or Enter-separated tag input.
 *
 * Controlled: value = string[] tags, onChange called on add/remove.
 */

import { useRef, useState, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { Tag } from '@/components/atoms/Tag'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
  maxTags?: number
  className?: string
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Add tag…',
  disabled,
  maxTags = 20,
  className,
}: TagInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (!tag || value.includes(tag) || value.length >= maxTags) return
    onChange([...value, tag])
    setInput('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const onBlur = () => {
    if (input.trim()) addTag(input)
  }

  return (
    <div
      className={cn(
        'flex flex-wrap gap-1.5 items-center w-full min-h-[38px]',
        'cms-input py-1.5 cursor-text',
        disabled && 'opacity-60 cursor-not-allowed',
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <Tag
          key={tag}
          label={tag}
          onRemove={disabled ? undefined : () => onChange(value.filter((t) => t !== tag))}
        />
      ))}
      {value.length < maxTags && (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[120px] bg-transparent outline-none font-body text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)]"
        />
      )}
    </div>
  )
}
