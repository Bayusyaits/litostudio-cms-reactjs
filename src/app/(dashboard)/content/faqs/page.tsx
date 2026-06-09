'use client'
// apps/cms/src/app/(dashboard)/content/faqs/page.tsx
import Link from 'next/link'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, HelpCircle, ChevronDown, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Button, Card, CardContent, Badge, cn, StatusBadge } from '@litostudio/ui'
import { api } from '@/lib/api'
import type { ContentStatus } from '@litostudio/ui'

interface FAQ {
  id: string
  category?: string
  sort_order: number
  status: ContentStatus
  translations: Record<string, { question: string; answer: string }>
}

export default function FAQsPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['content-faqs'],
    queryFn: () => api.get<{ data: FAQ[] }>('/api/v1/cms/content/faqs'),
  })
  const items = data?.data ?? []

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/cms/content/faqs/${id}`),
    onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries({ queryKey: ['content-faqs'] }) },
    onError: () => toast.error('Failed to delete'),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="FAQs" description="Frequently asked questions.">
        <Button asChild><Link href="/content/faqs/new"><Plus className="h-4 w-4" /> New FAQ</Link></Button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse bg-muted/40 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <HelpCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-sm font-medium mb-1">No FAQs yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your first frequently asked question.</p>
          <Button asChild><Link href="/content/faqs/new"><Plus className="h-4 w-4" /> New FAQ</Link></Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((faq) => {
            const q = faq.translations?.id?.question ?? faq.translations?.en?.question ?? 'Untitled'
            const a = faq.translations?.id?.answer ?? faq.translations?.en?.answer ?? ''
            const isOpen = open === faq.id
            return (
              <Card key={faq.id}>
                <CardContent className="p-0">
                  <button
                    onClick={() => setOpen(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left gap-3"
                  >
                    <span className="font-medium text-sm flex-1">{q}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={faq.status} />
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3 border-t border-border space-y-3">
                      <p className="text-sm text-muted-foreground pt-3">{a}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <Link href={`/content/faqs/${faq.id}`}>Edit</Link>
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); remove.mutate(faq.id) }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
