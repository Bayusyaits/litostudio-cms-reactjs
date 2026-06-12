import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { FormField, TextAreaField } from '@/components/molecules/FormField'
import { FormSkeleton } from '@/components/atoms/Skeleton'
import { getTitle } from '@/types/content.types'
import type { JournalPost, JournalCreateRequest } from '@/types/content.types'

const schema = z.object({
  title:       z.string().min(1, 'Required').max(200),
  slug:        z.string().min(1, 'Required').regex(/^[a-z0-9-]+$/, 'Lowercase, numbers and hyphens only'),
  excerpt:     z.string().max(500).optional(),
  content:     z.string().optional(),
  cover_image: z.string().url().or(z.literal('')).optional(),
  status:      z.enum(['published', 'draft', 'scheduled', 'archived']).default('draft'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  post?: JournalPost
  isLoading: boolean
  isSubmitting: boolean
  isEdit: boolean
  serverError: string | null
  onSubmit: (values: JournalCreateRequest) => void
  onCancel: () => void
}

export function JournalFormView({ post, isLoading, isSubmitting, isEdit, serverError, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: post
      ? { title: getTitle(post), slug: post.slug, excerpt: post.translations?.[0]?.excerpt ?? '', cover_image: post.cover_image ?? '', status: post.status }
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
          {isEdit ? 'Edit Post' : 'New Journal Post'}
        </h1>
      </div>

      <form onSubmit={handleSubmit((data) => onSubmit(data as unknown as JournalCreateRequest))} noValidate className="space-y-5">
        <div className="cms-card p-5 space-y-4">
          <FormField
            label="Title" required placeholder="Journal post title…"
            error={errors.title?.message}
            {...register('title', {
              onChange: (e) => {
                if (!isEdit) setValue('slug', e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'))
              }
            })}
          />
          <FormField
            label="Slug" required placeholder="journal-post-slug"
            error={errors.slug?.message}
            {...register('slug')}
          />
          <TextAreaField label="Excerpt" placeholder="Short description…" error={errors.excerpt?.message} {...register('excerpt')} />
          <FormField label="Cover Image URL" type="url" placeholder="https://..." error={errors.cover_image?.message} {...register('cover_image')} />
        </div>

        <div className="cms-card p-5 space-y-3">
          <h2 className="font-body text-sm font-semibold text-[var(--text-primary)]">Publishing</h2>
          <div className="space-y-1.5">
            <label className="cms-label" htmlFor="status">Status</label>
            <select id="status" className="cms-input w-48" {...register('status')}>
              <option value="draft">Draft</option>
              <option value="active">Published</option>
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
            {isEdit ? 'Save Changes' : 'Create Post'}
          </Button>
        </div>
      </form>
    </div>
  )
}
