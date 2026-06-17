/**
 * DynamicField — renders a single FieldSchema-driven form control.
 * Used by DynamicContentPanel to build inspectors from template manifests.
 */

import { Plus, Trash2, Globe } from 'lucide-react'
import { ImageUploader } from '@/components/molecules/ImageUploader'
import type { FieldSchema } from '@litostudio/templates'

interface DynamicFieldProps {
  schema:   FieldSchema
  value:    unknown
  onChange: (value: unknown) => void
}

// ── Primitive field inputs ────────────────────────────────────────────────────

function FieldLabel({ children, translatable }: { children: React.ReactNode; translatable?: boolean }) {
  return (
    <p style={{
      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
      color: 'var(--text-secondary)', margin: '0 0 4px',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {children}
      {translatable && (
        <span title="This field changes per locale" style={{ display: 'inline-flex', flexShrink: 0 }}>
          <Globe size={10} style={{ color: 'var(--lito-teal)' }} />
        </span>
      )}
    </p>
  )
}

function fieldWrap(children: React.ReactNode, hint?: string) {
  return (
    <div style={{ marginBottom: 12 }}>
      {children}
      {hint && (
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 10,
          color: 'var(--text-muted)', margin: '3px 0 0',
        }}>
          {hint}
        </p>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 10px',
  border: '1px solid var(--lito-border)', borderRadius: 6,
  fontFamily: 'var(--font-body)', fontSize: 12,
  color: 'var(--text-primary)',
  background: 'var(--cms-surface-2)', outline: 'none',
  boxSizing: 'border-box',
}

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
            style={inputStyle}
          />
        </>,
        schema.hint,
      )

    case 'richtext':
      return fieldWrap(
        <>
          <FieldLabel translatable={schema.translatable}>{schema.label}</FieldLabel>
          <textarea
            value={str}
            placeholder={schema.hint ?? '<p>Content...</p>'}
            rows={5}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
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
            style={inputStyle}
          />
        </>,
      )

    case 'boolean':
      return fieldWrap(
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)',
        }}>
          <input
            type="checkbox"
            checked={bool}
            onChange={(e) => onChange(e.target.checked)}
            style={{ width: 14, height: 14, cursor: 'pointer' }}
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
            style={{ ...inputStyle, appearance: 'auto' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={str || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: 36, height: 28, border: '1px solid var(--lito-border)', borderRadius: 4, cursor: 'pointer', padding: 2 }}
            />
            <input
              type="text"
              value={str}
              placeholder="#000000"
              onChange={(e) => onChange(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
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
            style={inputStyle}
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
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <FieldLabel>{schema.label} ({items.length})</FieldLabel>
            <button
              type="button"
              onClick={addItem}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 5,
                border: '1px solid var(--lito-teal)',
                background: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 11,
                color: 'var(--lito-teal)',
              }}
            >
              <Plus size={11} /> Add
            </button>
          </div>

          {items.length === 0 && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              No items yet. Click Add.
            </p>
          )}

          {items.map((item, idx) => (
            <div key={idx} style={{
              padding: 10, marginBottom: 8,
              border: '1px solid var(--lito-border)', borderRadius: 8,
              background: 'var(--cms-surface-2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
                  Item {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                >
                  <Trash2 size={12} style={{ color: '#f87171' }} />
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
