'use client'
// apps/cms/src/app/(dashboard)/websites/[siteId]/settings/page.tsx
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PageHeader, Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@litostudio/ui'
import { api } from '@/lib/api'

const schema = z.object({ name: z.string().min(1), domain: z.string().optional().or(z.literal('')) })
type FormValues = z.infer<typeof schema>

export default function SiteSettingsPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const { data } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => api.get<FormValues>(`/api/v1/cms/organizations/sites/${siteId}`),
  })
  const { register, handleSubmit } = useForm<FormValues>({ resolver: zodResolver(schema), values: data })
  const save = useMutation({
    mutationFn: (v: FormValues) => api.patch(`/api/v1/cms/organizations/sites/${siteId}`, v),
    onSuccess: () => toast.success('Settings saved'),
    onError: () => toast.error('Save failed'),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure this website's settings." />
      <Card className="max-w-lg">
        <CardHeader><CardTitle className="text-sm font-semibold">General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label htmlFor="site-name">Site name</Label><Input id="site-name" {...register('name')} /></div>
          <div className="space-y-2"><Label htmlFor="site-domain">Custom domain</Label><Input id="site-domain" {...register('domain')} placeholder="example.com" /></div>
          <Button onClick={handleSubmit((v) => save.mutate(v))} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save settings'}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
