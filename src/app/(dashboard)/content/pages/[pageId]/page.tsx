'use client'
// apps/cms/src/app/(dashboard)/content/pages/[pageId]/page.tsx
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  PageHeader, Button, Input, Label, Card, CardContent, CardHeader, CardTitle,
  Tabs, TabsList, TabsTrigger, TabsContent, Select, SelectContent,
  SelectItem, SelectTrigger, SelectValue, slugify,
} from '@litostudio/ui'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { api } from '@/lib/api'
import type { JSONContent } from '@tiptap/react'

const LOCALES = [
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'en', label: 'English' },
] as const

type LocaleCode = (typeof LOCALES)[number]['code']

const schema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-/]+$/),
  status: z.enum(['draft', 'active', 'inactive', 'archived']),
  translations: z.record(z.object({
    title: z.string().min(1, 'Title is required'),
    meta_title: z.string().max(70).optional(),
    meta_description: z.string().max(160).optional(),
  })),
})
type FormValues = z.infer<typeof schema>

interface PageContent {
  id: string
  slug: string
  status: string
  translations: Record<string, {
    title: string
    body: JSONContent | null
    meta_title?: string
    meta_description?: string
  }>
}

const defaultTranslations = () =>
  Object.fromEntries(LOCALES.map((l) => [l.code, { title: '', meta_title: '', meta_description: '' }]))

export default function PageEditorPage() {
  const { pageId } = useParams<{ pageId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const isNew = pageId === 'new'

  const [bodies, setBodies] = useState<Record<LocaleCode, JSONContent | undefined>>({
    id: undefined,
    en: undefined,
  })

  const { data: page, isLoading } = useQuery({
    queryKey: ['page', pageId],
    queryFn: () => api.get<PageContent>(`/api/v1/cms/content/pages/${pageId}`),
    enabled: !isNew,
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { slug: '', status: 'draft', translations: defaultTranslations() },
  })

  useEffect(() => {
    if (!page) return
    reset({
      slug: page.slug,
      status: page.status as FormValues['status'],
      translations: Object.fromEntries(
        LOCALES.map((l) => [l.code, {
          title: page.translations[l.code]?.title ?? '',
          meta_title: page.translations[l.code]?.meta_title ?? '',
          meta_description: page.translations[l.code]?.meta_description ?? '',
        }])
      ),
    })
    setBodies({
      id: page.translations['id']?.body ?? undefined,
      en: page.translations['en']?.body ?? undefined,
    })
  }, [page, reset])

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const payload = {
        ...v,
        translations: Object.fromEntries(
          LOCALES.map((l) => [l.code, { ...v.translations[l.code], body: bodies[l.code] ?? null }])
        ),
      }
      return isNew
        ? api.post<PageContent>('/api/v1/cms/content/pages', payload)
        : api.patch<PageContent>(`/api/v1/cms/content/pages/${pageId}`, payload)
    },
    onSuccess: (data) => {
      toast.success(isNew ? 'Page created' : 'Page saved')
      queryClient.invalidateQueries({ queryKey: ['content-pages'] })
      if (isNew) router.push(`/content/pages/${data.id}`)
    },
    onError: () => toast.error('Failed to save page'),
  })

  const currentTitle = page?.translations?.id?.title ?? page?.translations?.en?.title ?? 'Edit page'

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? 'New page' : currentTitle}
        description={isNew ? 'Create a new static page.' : `/${watch('slug')}`}
      >
        <Select value={watch('status')} onValueChange={(v) => setValue('status', v as FormValues['status'])}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSubmit((v) => save.mutate(v))} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : isNew ? 'Create page' : 'Save changes'}
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="h-64 animate-pulse bg-muted/40 rounded-lg" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <Tabs defaultValue="id">
              <TabsList>
                {LOCALES.map((l) => (
                  <TabsTrigger key={l.code} value={l.code}>{l.label}</TabsTrigger>
                ))}
              </TabsList>

              {LOCALES.map((l) => (
                <TabsContent key={l.code} value={l.code} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      {...register(`translations.${l.code}.title`)}
                      placeholder="Page title"
                      onChange={(e) => {
                        register(`translations.${l.code}.title`).onChange(e)
                        if (l.code === 'id' && isNew) setValue('slug', slugify(e.target.value))
                      }}
                    />
                    {errors.translations?.[l.code]?.title && (
                      <p className="text-xs text-destructive">{errors.translations[l.code]!.title!.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Body</Label>
                    <RichTextEditor
                      value={bodies[l.code]}
                      onChange={(v) => setBodies((prev) => ({ ...prev, [l.code]: v }))}
                      placeholder="Start writing…"
                    />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        SEO — {l.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Meta title <span className="text-muted-foreground">(max 70)</span></Label>
                        <Input {...register(`translations.${l.code}.meta_title`)} className="text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Meta description <span className="text-muted-foreground">(max 160)</span></Label>
                        <Input {...register(`translations.${l.code}.meta_description`)} className="text-sm" />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  URL slug
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input {...register('slug')} className="font-mono text-xs" placeholder="about-us" />
                {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  )
}
