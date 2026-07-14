/**
 * FaqEditorPage — dedicated create/edit page for a single FAQ.
 *
 * Not built on SimpleContentEditorPage: that editor is hardcoded to a fixed
 * SimpleModule union (stories/journal/gallery/services/destinations/brands/
 * products/collections/campaigns), all of which share the content_items +
 * content_translations (title/excerpt/body) shape. FAQs are a dedicated
 * table (`faqs` + `faq_translations`, question/answer only, no body/excerpt/
 * cover image/slug) — trying to force it into that shared editor would mean
 * threading a lot of FAQ-only branches through code that otherwise assumes
 * a uniform entity shape. A small dedicated page is more honest here.
 *
 * Routes: /faqs/new (create) and /faqs/:id/edit (edit) — previously
 * unregistered (FaqsPageContainer already navigated here, but the routes
 * 404'd; see router.tsx).
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { faqsService, faqCategoriesService } from '@/services/content.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { ContentEditorLayout } from '@/components/organisms/ContentEditorLayout'
import { TagInput } from '@/components/molecules/TagInput'
import { Switch } from '@/components/atoms/Switch'
import { DashboardSkeleton, TextAreaField } from '@litostudio/ui-cms'

const LOCALE = 'id'

// Matches the real `faqs.status` CHECK constraint (draft/active/inactive/
// archived/suspended) — deliberately not reusing PublishCard/ContentStatus
// ('published'/'draft'/'scheduled'/'archived'), whose vocabulary doesn't
// match this table's real status values.
const STATUS_OPTIONS = [
  { value: 'draft',    label: 'Draft' },
  { value: 'active',   label: 'Published' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
]

export default function FaqEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeSite } = useWebsiteStore()
  const isNew = !id

  const { data: faq, isLoading, error } = useQuery({
    queryKey: ['faq', id],
    queryFn: () => faqsService.getById(id!),
    enabled: !isNew && !!id,
    staleTime: 0,
  })

  const { data: categories } = useQuery({
    queryKey: ['faq-categories', activeSite?.id],
    queryFn: () => faqCategoriesService.getList(activeSite!.id),
    enabled: !!activeSite,
    staleTime: 5 * 60 * 1000,
  })

  const [question, setQuestion]     = useState('')
  const [answer, setAnswer]         = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [tags, setTags]             = useState<string[]>([])
  const [isFeatured, setIsFeatured] = useState(false)
  const [status, setStatus]         = useState('draft')
  const [sortOrder, setSortOrder]   = useState(0)

  const [isSaving, setIsSaving]   = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!faq) return
    const tr = faq.faq_translations?.find((t) => t.locale === LOCALE) ?? faq.faq_translations?.[0]
    setQuestion(tr?.question ?? '')
    setAnswer(tr?.answer ?? '')
    setCategoryId(faq.category_id ?? '')
    setTags(faq.tags ?? [])
    setIsFeatured(faq.is_featured)
    setStatus(faq.status)
    setSortOrder(faq.sort_order)
  }, [faq])

  const doSave = useCallback(async () => {
    setSaveError(null)
    if (!question.trim()) { setSaveError('Question is required'); return }
    if (!answer.trim())   { setSaveError('Answer is required'); return }

    setIsSaving(true)
    try {
      if (isNew) {
        if (!activeSite?.id) throw new Error('No active site selected')
        const created = await faqsService.create({
          site_id: activeSite.id,
          category_id: categoryId || null,
          tags,
          is_featured: isFeatured,
          status: status as 'draft',
          sort_order: sortOrder,
          translations: [{ locale: LOCALE, question: question.trim(), answer: answer.trim() }],
        })
        void queryClient.invalidateQueries({ queryKey: ['faqs'] })
        navigate(`/faqs/${created.id}/edit`, { replace: true })
      } else {
        await faqsService.update(id!, {
          category_id: categoryId || null,
          tags,
          is_featured: isFeatured,
          status: status as 'draft',
          sort_order: sortOrder,
          translations: [{ locale: LOCALE, question: question.trim(), answer: answer.trim() }],
        })
        void queryClient.invalidateQueries({ queryKey: ['faqs'] })
        void queryClient.invalidateQueries({ queryKey: ['faq', id] })
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [isNew, question, answer, categoryId, tags, isFeatured, status, sortOrder, activeSite, id, navigate, queryClient])

  if (!isNew && isLoading) return <DashboardSkeleton />
  if (!isNew && error) {
    return (
      <div className="p-8 text-center text-[var(--s-danger)] font-body">
        Failed to load this FAQ. Please go back and try again.
      </div>
    )
  }

  return (
    <ContentEditorLayout
      title={isNew ? 'New FAQ' : 'Edit FAQ'}
      subtitle={isNew ? 'FAQs › New' : `FAQs › ${question || id}`}
      onBack={() => navigate('/faqs')}
      sidebarContent={
        <>
          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Publish</h3>
            <div className="space-y-1.5">
              <label className="cms-label">Status</label>
              <select
                className="cms-input w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isSaving}
              >
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <button
              type="button"
              className="cms-btn cms-btn-primary w-full justify-center"
              onClick={doSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : isNew ? 'Create FAQ' : 'Save changes'}
            </button>
            {saveError && (
              <p className="font-body text-xs text-[var(--s-danger)]">{saveError}</p>
            )}
          </div>

          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Details</h3>
            <div className="space-y-1.5">
              <label className="cms-label">Category</label>
              <select
                className="cms-input w-full"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">— No category —</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="cms-label">Sort order</label>
              <input
                type="number"
                className="cms-input w-full"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-[var(--text-primary)]">
                Featured
                <span className="block font-body text-[11px] text-[var(--text-muted)] font-normal">
                  Shown first / highlighted on the site
                </span>
              </span>
              <Switch checked={isFeatured} onChange={setIsFeatured} />
            </div>
          </div>

          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Tags</h3>
            <TagInput value={tags} onChange={setTags} placeholder="Add tag…" />
          </div>
        </>
      }
    >
      <div className="cms-card p-5 space-y-4">
        <TextAreaField
          label="Question"
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What is your refund policy?"
        />
        <TextAreaField
          label="Answer"
          rows={6}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Write the answer here. You can use {{variables}} like {{contact.email}} — they're resolved automatically when the FAQ is shown on the site."
          hint="Supports the same {{variable}} placeholders as Legal Center documents (e.g. {{contact.email}}, {{legal.jurisdiction}})."
        />
      </div>

      {saveError && (
        <div className="px-3 py-2 rounded-lg border border-[var(--cms-danger)] bg-[var(--cms-danger-bg)]" role="alert">
          <p className="font-body text-xs text-[var(--cms-danger)]">{saveError}</p>
        </div>
      )}
    </ContentEditorLayout>
  )
}
