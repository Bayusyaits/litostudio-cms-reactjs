/**
 * DynamicContentPanel — manifest-driven content inspector.
 *
 * When the active template's manifest defines a SectionSchema matching
 * the selected block's type, this panel renders each FieldSchema as a
 * live form control backed by the block's data object.
 *
 * Falls back to null (caller should render the hardcoded ContentPanel).
 */

import { Lock } from 'lucide-react'
import { useEditorStore }     from '@/stores/editor.store'
import { useTemplateManifest } from '@/hooks/useTemplateManifest'
import { DynamicField }       from './DynamicField'
import type { Block }         from '@/types/editor.types'

interface Props {
  block: Block
}

export function DynamicContentPanel({ block }: Props) {
  const { updateBlock }      = useEditorStore()
  const { manifest }         = useTemplateManifest()

  if (!manifest) return null

  const section = manifest.sections.find((s) => s.id === block.type)
  if (!section) return null

  // If section is not editable, show a lock notice
  if (!section.editable) {
    return (
      <div style={{ padding: '20px 16px', textAlign: 'center' }}>
        <Lock size={20} style={{ color: 'var(--lito-gold)', marginBottom: 8 }} />
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'var(--text-muted)', margin: 0,
        }}>
          This section is managed by the <strong>{manifest.name}</strong> template and cannot be edited here.
        </p>
      </div>
    )
  }

  const d    = block.data as Record<string, unknown>
  const update = (key: string, val: unknown) => updateBlock(block.id, { [key]: val })

  return (
    <div style={{ padding: '8px 14px' }}>
      {/* Template context badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 8px', marginBottom: 12,
        borderRadius: 6,
        background: 'rgba(15,118,110,0.06)',
        border: '1px solid rgba(15,118,110,0.15)',
      }}>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
          color: 'var(--lito-teal)',
        }}>
          {manifest.name} — {section.label}
        </span>
      </div>

      {section.fields.length === 0 && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
          No editable fields for this section.
        </p>
      )}

      {section.fields.map((fieldSchema) => (
        <DynamicField
          key={fieldSchema.key}
          schema={fieldSchema}
          value={d[fieldSchema.key]}
          onChange={(val) => update(fieldSchema.key, val)}
        />
      ))}
    </div>
  )
}
