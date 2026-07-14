import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Tag, Trash2, Plus, FolderOpen } from 'lucide-react'
import { EnterpriseDataTable, FIELD_LIMITS } from '@litostudio/ui-cms'
import type { EDTColumn } from '@litostudio/ui-cms'
import type { Category, CategoryCreateRequest } from '@/services/taxonomy.service'

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(FIELD_LIMITS.CATEGORY_NAME, `Max ${FIELD_LIMITS.CATEGORY_NAME} characters`),
  slug: z.string().min(1, 'Slug is required').max(FIELD_LIMITS.CATEGORY_SLUG, `Max ${FIELD_LIMITS.CATEGORY_SLUG} characters`).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
})
type CategoryForm = z.infer<typeof categorySchema>

interface Props {
  categories: Category[]
  total: number
  isLoading: boolean
  onCreate: (payload: Omit<CategoryCreateRequest, 'site_id'>) => void
  creating: boolean
  createError: string | null
  onDelete: (id: string) => void
}

function buildCategoryColumns(onDelete: (id: string) => void): EDTColumn<Category>[] {
  return [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (cat) => (
        <div className="flex items-center gap-2">
          <FolderOpen size={14} className="text-[var(--text-muted)] shrink-0" />
          <span className="font-body text-[13px] text-[var(--text-primary)]">
            {cat.name ?? cat.slug}
          </span>
        </div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (cat) => (
        <code className="font-mono text-[11px] text-[var(--text-muted)] bg-[rgba(17,17,17,0.04)] px-[6px] py-[2px] rounded">
          {cat.slug}
        </code>
      ),
    },
    {
      key: 'parent_id',
      label: 'Type',
      render: (cat) => (
        <span className="text-xs text-[var(--text-muted)]">
          {cat.parent_id ? 'Sub-category' : 'Top-level'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (cat) => (
        <span className="font-body text-xs text-[var(--text-muted)]">
          {new Date(cat.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 40,
      render: (cat) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(cat.id) }}
          aria-label="Delete category"
          className="bg-transparent border-none cursor-pointer text-[var(--text-muted)] p-1 rounded flex hover:text-[var(--cms-danger)] hover:bg-[var(--cms-danger-bg)]"
        >
          <Trash2 size={13} />
        </button>
      ),
    },
  ]
}

function AddCategoryForm({ onCreate, creating, error }: {
  onCreate: (payload: Omit<CategoryCreateRequest, 'site_id'>) => void
  creating: boolean
  error: string | null
}) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isValid } } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    mode: 'onChange',
  })

  const nameVal = watch('name') ?? ''
  const slugVal = watch('slug') ?? ''

  function onSubmit(values: CategoryForm) {
    onCreate({ name: values.name, slug: values.slug })
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex gap-2 flex-wrap items-start">
      <div className="flex-1 min-w-[160px]">
        <div className="flex items-center justify-between">
          <label className="cms-label">Name</label>
          <span className={`font-body text-[11px] tabular-nums ${nameVal.length >= FIELD_LIMITS.CATEGORY_NAME ? 'text-[var(--s-danger)]' : nameVal.length >= Math.floor(FIELD_LIMITS.CATEGORY_NAME * 0.9) ? 'text-[var(--lito-gold-deep)]' : 'text-[var(--text-faint)]'}`}>
            {nameVal.length}/{FIELD_LIMITS.CATEGORY_NAME}
          </span>
        </div>
        <input
          {...register('name', {
            onChange: (e) => {
              const slug = e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
              setValue('slug', slug, { shouldValidate: true })
            },
          })}
          maxLength={FIELD_LIMITS.CATEGORY_NAME}
          className="cms-input h-[34px]"
          placeholder="Category name"
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="mt-1 text-[11px] text-[var(--s-danger)]" role="alert">{errors.name.message}</p>}
      </div>
      <div className="flex-1 min-w-[160px]">
        <div className="flex items-center justify-between">
          <label className="cms-label">Slug</label>
          <span className={`font-body text-[11px] tabular-nums ${slugVal.length >= FIELD_LIMITS.CATEGORY_SLUG ? 'text-[var(--s-danger)]' : slugVal.length >= Math.floor(FIELD_LIMITS.CATEGORY_SLUG * 0.9) ? 'text-[var(--lito-gold-deep)]' : 'text-[var(--text-faint)]'}`}>
            {slugVal.length}/{FIELD_LIMITS.CATEGORY_SLUG}
          </span>
        </div>
        <input
          {...register('slug')}
          maxLength={FIELD_LIMITS.CATEGORY_SLUG}
          className="cms-input h-[34px]"
          placeholder="category-slug"
          aria-invalid={!!errors.slug}
        />
        {errors.slug && <p className="mt-1 text-[11px] text-[var(--s-danger)]" role="alert">{errors.slug.message}</p>}
      </div>
      <div className="pt-5">
        <button type="submit" disabled={creating || !isValid} className="cms-btn cms-btn-primary cms-btn-sm h-[34px]">
          <Plus size={13} /> {creating ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error && <div className="w-full px-[10px] py-[6px] rounded bg-[var(--cms-danger-bg)] text-xs text-[var(--s-danger)]">{error}</div>}
    </form>
  )
}

export function CategoriesPageView({ categories, total, isLoading, onCreate, creating, createError, onDelete }: Props) {
  const columns = buildCategoryColumns(onDelete)

  return (
    <div className="cms-page p-8 overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-normal text-[var(--text-muted)]">Categories</h1>
        <p className="font-body text-xs text-[var(--text-muted)] mt-[3px]">
          {total} {total === 1 ? 'category' : 'categories'} across all content types
        </p>
      </div>

      <div className="cms-card px-6 py-5 mb-6">
        <h2 className="font-body text-[13px] font-medium mb-3 text-[var(--text-primary)]">Add category</h2>
        <AddCategoryForm onCreate={onCreate} creating={creating} error={createError} />
      </div>

      <EnterpriseDataTable<Category>
        skin="cms"
        columns={columns}
        data={categories}
        loading={isLoading}
        searchKeys={['name', 'slug']}
        searchPlaceholder="Search categories…"
        emptyIcon={<Tag className="w-6 h-6 text-[var(--lito-gold)]" aria-hidden />}
        emptyTitle="No categories"
        emptyDescription="Add your first category above"
      />
    </div>
  )
}
