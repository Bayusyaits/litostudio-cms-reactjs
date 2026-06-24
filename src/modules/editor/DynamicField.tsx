/**
 * DynamicField — renders a single FieldSchema-driven form control.
 * Used by DynamicContentPanel to build inspectors from template manifests.
 */

import { Plus, Trash2, Globe } from 'lucide-react'
import { ImageUploader } from '@/components/molecules/ImageUploader'
import { RichTextEditor } from '@/components/molecules/RichTextEditor'
import type { FieldSchema } from '@litostudio/templates'

interface DynamicFieldProps {
  schema:   FieldSchema
  value:    unknown
  onChange: (value: unknown) => void
}

// ── Primitive field inputs ────────────────────────────────────────────────────

function FieldLabel({ children, translatable }: { children: React.ReactNode; translatable?: boolean }) {
  return (
    <p className="font-body text-[11px] font-medium text-[var(--text-secondary)] mt-0 mb-1 flex items-center gap-1">
      {children}
      {translatable && (
        <span title="This field changes per locale" className="inline-flex shrink-0">
          <Globe size={10} className="text-[var(--lito-teal)]" />
        </span>
      )}
    </p>
  )
}

function fieldWrap(children: React.ReactNode, hint?: string) {
  return (
    <div className="mb-3">
      {children}
      {hint && (
        <p className="font-body text-[10px] text-[var(--text-muted)] mt-[3px] mb-0">
          {hint}
        </p>
      )}
    </div>
  )
}

const inputCls = 'w-full px-[10px] py-[6px] border border-[var(--lito-border)] rounded-[6px] font-body text-xs text-[var(--cms-field-text)] bg-[var(--cms-surface-2)] outline-none box-border transition-colors placeholder:text-[var(--text-muted)]'

// ── DynamicField ──────────────────────────────────────────────────────────────

export function DynamicField({ schema, value, onChange }: DynamicFieldProps) {
  const str = typeof value === 'string' ? value : ''
  const num = typeof value === 'number' ? value : 0
  const bool = typeof value === 'boolean' ? value : false

  switch (schema.type) {

    case 'text':
      return fieldWrap(
        <>
          <FieldLabel translatable={schema.translatable}>{schema.label}</FieldLabel>
          <input
            type="text"
            value={str}
            placeholder={schema.hint}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls}
          />
        </>,
        schema.hint,
      )

    case 'richtext':
      return fieldWrap(
        <>
          <FieldLabel translatable={schema.translatable}>{schema.label}</FieldLabel>
          <RichTextEditor
            value={str}
            onChange={(html) => onChange(html)}
            placeholder={schema.hint ?? 'Write content here…'}
            minHeight={160}
          />
        </>,
      )

    case 'number':
      return fieldWrap(
        <>
          <FieldLabel translatable={schema.translatable}>{schema.label}</FieldLabel>
          <input
            type="number"
            value={num}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className={inputCls}
          />
        </>,
      )

    case 'boolean':
      return fieldWrap(
        <label className="flex items-center gap-2 cursor-pointer font-body text-xs text-[var(--cms-field-text)]">
          <input
            type="checkbox"
            checked={bool}
            onChange={(e) => onChange(e.target.checked)}
            className="w-[14px] h-[14px] cursor-pointer"
          />
          {schema.label}
        </label>,
      )

    case 'select': {
      const opts = schema.options ?? []
      return fieldWrap(
        <>
          <FieldLabel translatable={schema.translatable}>{schema.label}</FieldLabel>
          <select
            value={str}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputCls} appearance-auto`}
          >
            <option value="">— Select —</option>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </>,
      )
    }

    case 'color':
      return fieldWrap(
        <>
          <FieldLabel translatable={schema.translatable}>{schema.label}</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={str || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-9 h-7 border border-[var(--lito-border)] rounded cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={str}
              placeholder="#000000"
              onChange={(e) => onChange(e.target.value)}
              className={`${inputCls} flex-1`}
            />
          </div>
        </>,
      )

    case 'media':
      return fieldWrap(
        <>
          <FieldLabel translatable={schema.translatable}>{schema.label}</FieldLabel>
          <ImageUploader
            value={str || undefined}
            folder="blocks"
            onChange={(url) => onChange(url ?? '')}
          />
        </>,
      )

    case 'link':
      return fieldWrap(
        <>
          <FieldLabel translatable={schema.translatable}>{schema.label}</FieldLabel>
          <input
            type="url"
            value={str}
            placeholder="https://..."
            onChange={(e) => onChange(e.target.value)}
            className={inputCls}
          />
        </>,
      )

    case 'repeater': {
      const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : []
      const subFields = schema.fields ?? []

      const updateItem = (idx: number, key: string, val: unknown) => {
        const next = items.map((item, i) =>
          i === idx ? { ...item, [key]: val } : item,
        )
        onChange(next)
      }

      const addItem = () => {
        const empty: Record<string, unknown> = {}
        subFields.forEach((f) => { empty[f.key] = '' })
        onChange([...items, empty])
      }

      const removeItem = (idx: number) => {
        onChange(items.filter((_, i) => i !== idx))
      }

      return (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <FieldLabel>{schema.label} ({items.length})</FieldLabel>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 px-2 py-[3px] rounded-[5px] border border-[var(--lito-teal)] bg-transparent cursor-pointer font-body text-[11px] text-[var(--lito-teal)]"
            >
              <Plus size={11} /> Add
            </button>
          </div>

          {items.length === 0 && (
            <p className="font-body text-[11px] text-[var(--text-muted)] m-0">
              No items yet. Click Add.
            </p>
          )}

          {items.map((item, idx) => (
            <div key={idx} className="p-[10px] mb-2 border border-[var(--lito-border)] rounded-lg bg-[var(--cms-surface-2)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-[11px] text-[var(--text-muted)]">
                  Item {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="bg-transparent border-none cursor-pointer p-0.5"
                >
                  <Trash2 size={12} className="text-[#f87171]" />
                </button>
              </div>
              {subFields.map((subField) => (
                <DynamicField
                  key={subField.key}
                  schema={subField}
                  value={item[subField.key]}
                  onChange={(val) => updateItem(idx, subField.key, val)}
                />
              ))}
            </div>
          ))}
        </div>
      )
    }

    default:
      return null
  }
}
