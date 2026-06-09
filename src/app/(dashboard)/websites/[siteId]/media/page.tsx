'use client'
// apps/cms/src/app/(dashboard)/websites/[siteId]/media/page.tsx
import { PageHeader } from '@litostudio/ui'
import { MediaLibrary } from '@/components/media/media-library'

export default function SiteMediaPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Media" description="Upload and manage media files for this website." />
      <MediaLibrary />
    </div>
  )
}
