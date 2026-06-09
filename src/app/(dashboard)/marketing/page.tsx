'use client'
// apps/cms/src/app/(dashboard)/marketing/page.tsx
import Link from 'next/link'
import { BarChart3, Mail, Globe, ArrowRight } from 'lucide-react'
import { PageHeader, Card, CardContent } from '@litostudio/ui'

const sections = [
  { label: 'Email Campaigns', description: 'Newsletters and drip sequences', href: '/marketing/emails', icon: Mail },
  { label: 'Analytics', description: 'Traffic and conversion data', href: '/marketing/analytics', icon: BarChart3 },
  { label: 'SEO Overview', description: 'Sitewide SEO health', href: '/marketing/seo', icon: Globe },
]

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Marketing" description="Campaigns, analytics, and SEO." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(({ label, description, href, icon: Icon }) => (
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
