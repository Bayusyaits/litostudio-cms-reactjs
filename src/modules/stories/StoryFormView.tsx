import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { FormField, TextAreaField } from '@/components/molecules/FormField'
import { FormSkeleton } from '@/components/atoms/Skeleton'
import { getTitle } from '@/types/content.types'
import type { Story } from '@/types/content.types'
import type { StoryCreateRequest } from '@/types/content.types'

const storySchema = z.object({
  title:       z.string().min(1, 'Title is required').max(200),
  slug:        z.string().min(1, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Lowercase, numbers and hyphens only'),
  excerpt:     z.string().max(500).optional(),
  content:     z.string().optional(),
  location:    z.string().max(200).optional(),
  cover_image: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  status:      z.enum(['published', 'draft', 'scheduled', 'archived']).default('draft'),
  is_featured: z.boolean().default(false),
  sort_order:  z.number().int().min(0).default(0),
})

type StoryForm = z.infer<typeof storySchema>

interface StoryFormViewProps {
  story?: Story
  isLoading: boolean
  isSubmitting: boolean
  isEdit: boolean
  serverError: string | null
  onSubmit: (values: StoryCreateRequest) => void
  onCancel: () => void
}

export function StoryFormView({
  story,
  isLoading,
  isSubmitting,
  isEdit,
  serverError,
  onSubmit,
  onCancel,
}: StoryFormViewProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StoryForm>({
    resolver: zodResolver(storySchema),
    defaultValues: story
      ? {
          title:       getTitle(story),
          slug:        story.slug,
          excerpt:     story.translations?.[0]?.excerpt ?? '',
          content:     '',
          location:    story.location ?? '',
          cover_image: story.cover_image ?? '',
          status:      story.status,
          is_featured: story.is_featured,
          sort_order:  story.sort_order ?? 0,
        }
      : { status: 'draft', is_featured: false, sort_order: 0 },
  })

  void watch('title') // kept for slug auto-gen side effect

  // Auto-generate slug from title (only on create)
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!isEdit) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
      setValue('slug', slug)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl">
        <FormSkeleton />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          aria-label="Back to stories"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            {isEdit ? 'Edit Story' : 'New Story'}
          </h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {isEdit ? `Editing: ${story ? getTitle(story) : ''}` : 'Create a new travel story'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => onSubmit(data as unknown as StoryCreateRequest))} noValidate className="space-y-5">
        <div className="cms-card p-5 space-y-4">
          <FormField
            label="Title"
            required
            placeholder="A Journey Through Yogyakarta"
            error={errors.title?.message}
            {...register('title', { onChange: handleTitleChange })}
          />
          <FormField
            label="Slug"
            required
            placeholder="a-journey-through-yogyakarta"
            hint="URL-friendly identifier. Auto-generated from title."
            error={errors.slug?.message}
            {...register('slug')}
          />
          <TextAreaField
            label="Excerpt"
            placeholder="A short summary shown in listings…"
            hint="Max 500 characters"
            error={errors.excerpt?.message}
            {...register('excerpt')}
          />
          <FormField
            label="Location"
            placeholder="Yogyakarta, Indonesia"
            error={errors.location?.message}
            {...register('location')}
          />
          <FormField
            label="Cover Image URL"
            type="url"
            placeholder="https://..."
            hint="Direct URL to the cover image"
            error={errors.cover_image?.message}
            {...register('cover_image')}
          />
        </div>

        {/* Publishing */}
        <div className="cms-card p-5 space-y-4">
          <h2 className="font-body text-sm font-semibold text-[var(--text-primary)]">Publishing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="cms-label" htmlFor="status">Status</label>
              <select id="status" className="cms-input" {...register('status')}>
                <option value="draft">Draft</option>
                <option value="active">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="cms-label" htmlFor="sort_order">Sort Order</label>
              <input
                id="sort_order"
                type="number"
                min={0}
                className="cms-input"
                {...register('sort_order', { valueAsNumber: true })}
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" {...register('is_featured')} className="rounded" />
            <span className="font-body text-sm text-[var(--text-primary)]">Featured story</span>
          </label>
        </div>

        {serverError && (
          <div
            className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-[var(--s-danger)]/20"
            role="alert"
          >
            <p className="font-body text-xs text-[var(--s-danger)]">{serverError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            leftIcon={<Save className="w-4 h-4" />}
            loading={isSubmitting}
          >
            {isEdit ? 'Save Changes' : 'Create Story'}
          </Button>
        </div>
      </form>
    </div>
  )
}
