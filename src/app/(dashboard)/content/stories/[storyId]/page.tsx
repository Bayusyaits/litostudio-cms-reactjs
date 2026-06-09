'use client'
// apps/cms/src/app/(dashboard)/content/stories/[storyId]/page.tsx
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
  SelectItem, SelectTrigger, SelectValue, Separator, slugify,
} from '@litostudio/ui'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { api } from '@/lib/api'
import type { JSONContent } from '@tiptap/react'

const LOCALES = [
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'en', label: 'English' },
] as const
type LocaleCode = (typeof LOCALES)[number]['code']

const CATEGORIES = ['travel', 'family', 'wedding', 'culture', 'documentary', 'branding', 'commercial', 'community']

const schema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  category: z.string().optional(),
  cover_image_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['draft', 'active', 'inactive', 'archived']),
  translations: z.record(z.object({
    title: z.string().min(1, 'Title is required'),
    excerpt: z.string().max(300).optional(),
    meta_title: z.string().max(70).optional(),
    meta_description: z.string().max(160).optional(),
  })),
})
type FormValues = z.infer<typeof schema>

interface Story {
  id: string
  slug: string
  category?: string
  cover_image_url?: string
  status: string
  translations: Record<string, {
    title: string
    excerpt?: string
    body: JSONContent | null
    meta_title?: string
    meta_description?: string
  }>
}

export default function StoryEditorPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const isNew = storyId === 'new'

  const [bodies, setBodies] = useState<Record<LocaleCode, JSONContent | undefined>>({ id: undefined, en: undefined })

  const { data: story, isLoading } = useQuery({
    queryKey: ['story', storyId],
    queryFn: () => api.get<Story>(`/api/v1/cms/content/stories/${storyId}`),
    enabled: !isNew,
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: '', category: '', cover_image_url: '', status: 'draft',
      translations: Object.fromEntries(LOCALES.map((l) => [l.code, { title: '', excerpt: '', meta_title: '', meta_description: '' }])),
    },
  })

  useEffect(() => {
    if (!story) return
    reset({
      slug: story.slug,
      category: story.category ?? '',
      cover_image_url: story.cover_image_url ?? '',
      status: story.status as FormValues['status'],
      translations: Object.fromEntries(
        LOCALES.map((l) => [l.code, {
          title: story.translations[l.code]?.title ?? '',
          excerpt: story.translations[l.code]?.excerpt ?? '',
          meta_title: story.translations[l.code]?.meta_title ?? '',
          meta_description: story.translations[l.code]?.meta_description ?? '',
        }])
      ),
    })
    setBodies({ id: story.translations['id']?.body ?? undefined, en: story.translations['en']?.body ?? undefined })
  }, [story, reset])

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const payload = {
        ...v,
        translations: Object.fromEntries(
          LOCALES.map((l) => [l.code, { ...v.translations[l.code], body: bodies[l.code] ?? null }])
        ),
      }
      return isNew
        ? api.post<Story>('/api/v1/cms/content/stories', payload)
        : api.patch<Story>(`/api/v1/cms/content/stories/${storyId}`, payload)
    },
    onSuccess: (data) => {
      toast.success(isNew ? 'Story created' : 'Story saved')
      queryClient.invalidateQueries({ queryKey: ['content-stories'] })
      if (isNew) router.push(`/content/stories/${data.id}`)
    },
    onError: () => toast.error('Failed to save story'),
  })

  const currentTitle = story?.translations?.id?.title ?? story?.translations?.en?.title ?? 'Edit story'

  return (
    <div className="space-y-6">
      <PageHeader title={isNew ? 'New story' : currentTitle} description={isNew ? 'Write a new story.' : `/${watch('slug')}`}>
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
          {save.isPending ? 'Saving…' : isNew ? 'Create story' : 'Save changes'}
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
                      placeholder="Story title"
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
                    <Label>Excerpt <span className="text-muted-foreground text-xs">(max 300)</span></Label>
                    <Input {...register(`translations.${l.code}.excerpt`)} placeholder="Brief summary…" />
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
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SEO — {l.label}</CardTitle>
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
              <CardHeader><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">URL slug</Label>
                  <Input {...register('slug')} className="font-mono text-xs" placeholder="my-story" />
                  {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select value={watch('category')} onValueChange={(v) => setValue('category', v)}>
                    <SelectTrigger className="text-sm h-8"><SelectValue placeholder="Choose category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs">Cover image URL</Label>
                  <Input {...register('cover_image_url')} className="text-xs" placeholder="https://…" />
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  )
}
