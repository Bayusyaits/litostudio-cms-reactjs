'use client'
// apps/cms/src/app/(dashboard)/content/page.tsx — Content hub
import Link from 'next/link'
import { FileText, MapPin, BookOpen, Image, Star, HelpCircle, Layers, ArrowRight } from 'lucide-react'
import { PageHeader, Card, CardContent } from '@litostudio/ui'

const contentTypes = [
  { label: 'Pages', description: 'Static website pages', href: '/content/pages', icon: FileText },
  { label: 'Stories', description: 'Articles and blog posts', href: '/content/stories', icon: BookOpen },
  { label: 'Destinations', description: 'Travel destinations', href: '/content/destinations', icon: MapPin },
  { label: 'Journal', description: 'Photography journals', href: '/content/journal', icon: FileText },
  { label: 'Gallery', description: 'Photo galleries', href: '/content/gallery', icon: Image },
  { label: 'Testimonials', description: 'Client testimonials', href: '/content/testimonials', icon: Star },
  { label: 'FAQs', description: 'Frequently asked questions', href: '/content/faqs', icon: HelpCircle },
  { label: 'Reusable Sections', description: 'Shared section components', href: '/content/reusable-sections', icon: Layers },
]

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Content" description="Manage all your content types." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {contentTypes.map(({ label, description, href, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center">
                    <Icon className="h-4.5 w-4.5 text-stone-600" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
