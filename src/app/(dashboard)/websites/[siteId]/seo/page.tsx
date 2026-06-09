'use client'
// apps/cms/src/app/(dashboard)/websites/[siteId]/seo/page.tsx
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { PageHeader, Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@litostudio/ui'
import { api } from '@/lib/api'

const schema = z.object({
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(160).optional(),
  og_image_url: z.string().url().optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

export default function SiteSeoPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const { data } = useQuery({
    queryKey: ['site-seo', siteId],
    queryFn: () => api.get<FormValues>(`/api/v1/cms/sites/${siteId}/seo`),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: data,
  })

  const save = useMutation({
    mutationFn: (v: FormValues) => api.put(`/api/v1/cms/sites/${siteId}/seo`, v),
    onSuccess: () => toast.success('SEO settings saved'),
    onError: () => toast.error('Save failed'),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="SEO" description="Manage search engine and social metadata." />
      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="text-sm font-semibold">Meta tags</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meta-title">Meta title <span className="text-muted-foreground text-xs">(max 70 chars)</span></Label>
            <Input id="meta-title" {...register('meta_title')} placeholder="My Awesome Site" />
            {errors.meta_title && <p className="text-xs text-destructive">{errors.meta_title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta-desc">Meta description <span className="text-muted-foreground text-xs">(max 160 chars)</span></Label>
            <Input id="meta-desc" {...register('meta_description')} placeholder="A brief description…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-image">OG image URL</Label>
            <Input id="og-image" {...register('og_image_url')} placeholder="https://…" />
          </div>
          <Button onClick={handleSubmit((v) => save.mutate(v))} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save SEO'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
