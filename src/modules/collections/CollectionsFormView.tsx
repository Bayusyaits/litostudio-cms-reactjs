import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { FormField } from '@/components/molecules/FormField'
import { FormSkeleton } from '@/components/atoms/Skeleton'
import type { Collection, CollectionCreateRequest } from '@/types/content.types'

const schema = z.object({
  name:   z.string().min(1, 'Required').max(200),
  slug:   z.string().min(1, 'Required').regex(/^[a-z0-9-]+$/, 'Lowercase, numbers and hyphens only'),
  status: z.enum(['published', 'draft', 'scheduled', 'archived']).default('draft'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  collection?: Collection
  isLoading: boolean
  isSubmitting: boolean
  isEdit: boolean
  serverError: string | null
  onSubmit: (values: CollectionCreateRequest) => void
  onCancel: () => void
}

export function CollectionsFormView({ collection, isLoading, isSubmitting, isEdit, serverError, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: collection
      ? { name: collection.name, slug: collection.slug, status: collection.status }
      : { status: 'draft' },
  })

  if (isLoading) return <div className="p-6 max-w-2xl"><FormSkeleton /></div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          {isEdit ? 'Edit Collection' : 'New Collection'}
        </h1>
      </div>

      <form onSubmit={handleSubmit((data) => onSubmit(data as unknown as CollectionCreateRequest))} noValidate className="space-y-5">
        <div className="cms-card p-5 space-y-4">
          <FormField
            label="Name" required placeholder="Collection name…"
            error={errors.name?.message}
            {...register('name', {
              onChange: (e) => {
                if (!isEdit) setValue('slug', e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'))
              },
            })}
          />
          <FormField
            label="Slug" required placeholder="collection-slug"
            error={errors.slug?.message}
            {...register('slug')}
          />
        </div>

        <div className="cms-card p-5 space-y-3">
          <h2 className="font-body text-sm font-semibold text-[var(--text-primary)]">Publishing</h2>
          <div className="space-y-1.5">
            <label className="cms-label" htmlFor="status">Status</label>
            <select id="status" className="cms-input w-48" {...register('status')}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {serverError && (
          <div className="px-3 py-2 rounded-lg border border-[var(--s-danger)]/20 bg-red-50" role="alert">
            <p className="font-body text-xs text-[var(--s-danger)]">{serverError}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
          <Button type="submit" leftIcon={<Save className="w-4 h-4" />} loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Collection'}
          </Button>
        </div>
      </form>
    </div>
  )
}
