'use client'
// apps/cms/src/app/(dashboard)/content/testimonials/page.tsx
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Button, Card, CardContent, Badge, StatusBadge } from '@litostudio/ui'
import { api } from '@/lib/api'
import type { ContentStatus } from '@litostudio/ui'

interface Testimonial {
  id: string
  client_name: string
  service_type?: string
  rating: number
  status: ContentStatus
  translations: Record<string, { quote: string }>
}

export default function TestimonialsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['content-testimonials'],
    queryFn: () => api.get<{ data: Testimonial[] }>('/api/v1/cms/content/testimonials'),
  })
  const items = data?.data ?? []

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/cms/content/testimonials/${id}`),
    onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries({ queryKey: ['content-testimonials'] }) },
    onError: () => toast.error('Failed to delete'),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Testimonials" description="Client testimonials and reviews.">
        <Button asChild><Link href="/content/testimonials/new"><Plus className="h-4 w-4" /> New testimonial</Link></Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5 h-28 animate-pulse bg-muted/40" /></Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Star className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-sm font-medium mb-1">No testimonials yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your first client testimonial.</p>
          <Button asChild><Link href="/content/testimonials/new"><Plus className="h-4 w-4" /> New testimonial</Link></Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{t.client_name}</p>
                    {t.service_type && <p className="text-xs text-muted-foreground capitalize">{t.service_type}</p>}
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 italic">
                  "{t.translations?.id?.quote ?? t.translations?.en?.quote ?? ''}"
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                    <Link href={`/content/testimonials/${t.id}`}>Edit</Link>
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => remove.mutate(t.id)} disabled={remove.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
