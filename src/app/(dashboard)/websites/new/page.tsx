'use client'
// apps/cms/src/app/(dashboard)/websites/new/page.tsx
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { PageHeader, Button, Input, Label, Card, CardContent, CardHeader, CardTitle, slugify } from '@litostudio/ui'
import { api } from '@/lib/api'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only').max(50),
  domain: z.string().optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

export default function NewWebsitePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', domain: '' },
  })

  const create = useMutation({
    mutationFn: (v: FormValues) => api.post<{ id: string }>('/api/v1/cms/organizations/sites', v),
    onSuccess: (data) => {
      toast.success('Website created')
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      router.push(`/websites/${data.id}`)
    },
    onError: () => toast.error('Failed to create website'),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Add website" description="Create a new website to manage content.">
        <Button variant="outline" onClick={() => router.push('/websites')}>Cancel</Button>
        <Button onClick={handleSubmit((v) => create.mutate(v))} disabled={create.isPending}>
          {create.isPending ? 'Creating…' : 'Create website'}
        </Button>
      </PageHeader>

      <Card className="max-w-lg">
        <CardHeader><CardTitle className="text-sm font-semibold">Website details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="My Portfolio"
              onChange={(e) => { register('name').onChange(e); setValue('slug', slugify(e.target.value)) }}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...register('slug')} placeholder="my-portfolio" className="font-mono text-xs" />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Custom domain <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="domain" {...register('domain')} placeholder="example.com" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
