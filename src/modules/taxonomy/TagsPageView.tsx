import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Hash, Trash2, Plus } from 'lucide-react'
import { Skeleton } from '@litostudio/ui-cms'
import { SearchInput } from '@/components/molecules/SearchInput'
import { EmptyState } from '@/components/molecules/EmptyState'
import { FIELD_LIMITS } from '@litostudio/ui-cms'
import type { Tag } from '@/services/taxonomy.service'

const tagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(FIELD_LIMITS.TAG_NAME, `Max ${FIELD_LIMITS.TAG_NAME} characters`),
})
type TagForm = z.infer<typeof tagSchema>

interface Props {
  tags: Tag[]
  total: number
  isLoading: boolean
  search: string
  onSearch: (v: string) => void
  onCreate: (name: string) => void
  creating: boolean
  createError: string | null
  onDelete: (id: string) => void
}

export function TagsPageView({ tags, total, isLoading, search, onSearch, onCreate, creating, createError, onDelete }: Props) {
  const { register, handleSubmit, reset, watch, formState: { errors, isValid } } = useForm<TagForm>({
    resolver: zodResolver(tagSchema),
    mode: 'onChange',
  })

  const nameVal = watch('name') ?? ''

  function handleAdd(values: TagForm) {
    onCreate(values.name)
    reset()
  }

  return (
    <div className="cms-page p-8 overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-normal text-[var(--text-muted)]">Tags</h1>
        <p className="font-body text-xs text-[var(--text-muted)] mt-[3px]">
          {total} {total === 1 ? 'tag' : 'tags'}
        </p>
      </div>

      {/* Add tag */}
      <div className="cms-card px-6 py-5 mb-6">
        <h2 className="font-body text-[13px] font-medium mb-3 text-[var(--text-primary)]">Add tag</h2>
        <form onSubmit={handleSubmit(handleAdd)} noValidate className="flex gap-2 items-start">
          <div className="flex-1 max-w-[320px]">
            <div className="flex items-center justify-between mb-1">
              <span />
              <span className={`font-body text-[11px] tabular-nums ${nameVal.length >= FIELD_LIMITS.TAG_NAME ? 'text-[var(--s-danger)]' : nameVal.length >= Math.floor(FIELD_LIMITS.TAG_NAME * 0.9) ? 'text-[var(--lito-gold-deep)]' : 'text-[var(--text-faint)]'}`}>
                {nameVal.length}/{FIELD_LIMITS.TAG_NAME}
              </span>
            </div>
            <input
              {...register('name')}
              maxLength={FIELD_LIMITS.TAG_NAME}
              className="cms-input h-[34px] w-full"
              placeholder="Tag name"
              aria-invalid={!!errors.name}
            />
          </div>
          <button type="submit" disabled={creating || !isValid} className="cms-btn cms-btn-primary cms-btn-sm mt-[22px]">
            <Plus size={13} /> {creating ? 'Adding…' : 'Add'}
          </button>
        </form>
        {errors.name && <p className="mt-[6px] text-xs text-[var(--s-danger)]" role="alert">{errors.name.message}</p>}
        {createError && <div className="mt-2 px-[10px] py-[6px] rounded bg-[var(--cms-danger-bg)] text-xs text-[var(--s-danger)]">{createError}</div>}
      </div>

      <div className="flex justify-between mb-[14px]">
        <SearchInput value={search} onChange={onSearch} placeholder="Search tags…" className="w-64" />
      </div>

      {/* Tag cloud */}
      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-full" style={{ width: `${60 + (i % 4) * 20}px` }} />)}
        </div>
      ) : tags.length === 0 ? (
        <EmptyState icon={Hash} title="No tags" description="Add your first tag above" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <div
              key={tag.id}
              className="flex items-center gap-[6px] pl-3 pr-[10px] py-[5px] rounded-full border border-[var(--lito-border)] bg-[var(--cms-card-bg)] font-body text-xs text-[var(--text-primary)]"
            >
              <Hash size={11} className="text-[var(--text-muted)]" />
              {tag.name}
              {tag.post_count > 0 && (
                <span className="text-[10px] text-[var(--text-muted)] bg-[rgba(17,17,17,0.05)] rounded-full px-[6px] py-[1px]">
                  {tag.post_count}
                </span>
              )}
              <button
                type="button"
                onClick={() => onDelete(tag.id)}
                aria-label={`Remove ${tag.name}`}
                className="bg-transparent border-none cursor-pointer text-[var(--text-muted)] p-[2px] flex rounded-full ml-0.5 hover:text-[var(--cms-danger)]"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
