/**
 * DynamicContentPanel — manifest-driven content inspector.
 */

import { Lock } from 'lucide-react'
import { useEditorStore }     from '@/stores/editor.store'
import { useTemplateManifest } from '@/hooks/useTemplateManifest'
import { DynamicField }       from './DynamicField'
import type { Block }         from '@/types/editor.types'

interface Props { block: Block }

export function DynamicContentPanel({ block }: Props) {
  const { updateBlock } = useEditorStore()
  const { manifest }    = useTemplateManifest()

  if (!manifest) return null

  const section = manifest.sections.find((s) => s.id === block.type)
  if (!section) return null

  if (!section.editable) {
    return (
      <div className="px-4 py-5 text-center">
        <Lock size={20} className="text-[var(--lito-gold)] mb-2 mx-auto" />
        <p className="font-body text-xs text-[var(--text-muted)] m-0">
          This section is managed by the <strong>{manifest.name}</strong> template and cannot be edited here.
        </p>
      </div>
    )
  }

  const d      = block.data as Record<string, unknown>
  const update = (key: string, val: unknown) => updateBlock(block.id, { [key]: val })

  return (
    <div className="px-[14px] py-2">
      {/* Template context badge */}
      <div className="flex items-center gap-[6px] px-2 py-[5px] mb-3 rounded-md bg-[rgba(15,118,110,0.06)] border border-[rgba(15,118,110,0.15)]">
        <span className="font-body text-[10px] font-semibold text-[var(--lito-teal)]">
          {manifest.name} — {section.label}
        </span>
      </div>

      {section.fields.length === 0 && (
        <p className="font-body text-xs text-[var(--text-muted)]">
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
