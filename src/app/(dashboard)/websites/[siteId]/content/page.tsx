'use client'
// apps/cms/src/app/(dashboard)/websites/[siteId]/content/page.tsx
import { useParams } from 'next/navigation'
import { PageHeader } from '@litostudio/ui'
import { ContentBuilder } from '@/components/content/content-builder'

export default function SiteContentPage() {
  const { siteId } = useParams<{ siteId: string }>()
  return (
    <div className="space-y-6">
      <PageHeader title="Content" description="Build and arrange your site sections." />
      <ContentBuilder siteId={siteId} />
    </div>
  )
}
