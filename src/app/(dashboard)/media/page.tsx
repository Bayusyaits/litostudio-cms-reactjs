'use client'
// apps/cms/src/app/(dashboard)/media/page.tsx
import { PageHeader } from '@litostudio/ui'
import { MediaLibrary } from '@/components/media/media-library'

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Media" description="Upload and manage your media files." />
      <MediaLibrary />
    </div>
  )
}
