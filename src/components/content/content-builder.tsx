'use client'
// apps/cms/src/components/content/content-builder.tsx
// Content type list + quick-access for a specific site
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { FileText, MapPin, BookOpen, Image, Star, HelpCircle, Layers, ArrowRight, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, formatRelative } from '@litostudio/ui'
import { api } from '@/lib/api'

interface ContentSummary {
  type: string
  count: number
  draft_count: number
  last_updated_at: string | null
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType; href: string }> = {
  pages:             { label: 'Pages',            icon: FileText,    href: 'pages' },
  stories:           { label: 'Stories',          icon: BookOpen,    href: 'stories' },
  destinations:      { label: 'Destinations',     icon: MapPin,      href: 'destinations' },
  journal:           { label: 'Journal',          icon: FileText,    href: 'journal' },
  gallery:           { label: 'Gallery',          icon: Image,       href: 'gallery' },
  testimonials:      { label: 'Testimonials',     icon: Star,        href: 'testimonials' },
  faqs:              { label: 'FAQs',             icon: HelpCircle,  href: 'faqs' },
  reusable_sections: { label: 'Reusable Sections',icon: Layers,      href: 'reusable-sections' },
}

interface Props {
  siteId: string
}

export function ContentBuilder({ siteId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['site-content-summary', siteId],
    queryFn: () => api.get<{ data: ContentSummary[] }>(`/api/v1/cms/sites/${siteId}/content/summary`),
    enabled: !!siteId,
  })

  const summary = data?.data ?? []

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="p-5 h-24 animate-pulse bg-muted/40" /></Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(TYPE_META).map(([type, meta]) => {
          const Icon = meta.icon
          const stat = summary.find((s) => s.type === type)
          const basePath = `/websites/${siteId}/content/${meta.href}`

          return (
            <Card key={type} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-stone-600" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{meta.label}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <Link href={`${basePath}/new`}><Plus className="h-3.5 w-3.5" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-semibold">{stat?.count ?? 0}</span>
                  {(stat?.draft_count ?? 0) > 0 && (
                    <Badge variant="warning" className="text-xs">{stat!.draft_count} draft</Badge>
                  )}
                </div>
                {stat?.last_updated_at && (
                  <p className="text-xs text-muted-foreground">
                    Updated {formatRelative(stat.last_updated_at)}
                  </p>
                )}
                <Link
                  href={basePath}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
