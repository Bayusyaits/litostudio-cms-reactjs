// TEST-011 (master-implementation-execution-plan-2026-09-04.md, Workstream G)
// Regression test for FIND-043/ARCH-008: the CMS's generic content backend
// and the products backend both store the live-content value as the
// literal string 'active' (StatusBadge.tsx documents 'active' -> "Published"
// as the established legacy-naming convention), but PublishCard used to only
// recognize the literal string 'published' as "live". A record whose real
// status was 'active' therefore showed correctly as "Published" on the list
// page (StatusBadge) while the editor's PublishCard treated it as an
// unpublished draft — offering a "Publish" button instead of "Unpublish",
// and rendering no status label at all (STATUS_OPTIONS had no 'active'
// entry). This test fails red against the pre-ARCH-008 code and must stay
// green afterward, per this workstream's own sequencing convention.
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PublishCard } from '@/components/molecules/PublishCard'
import { StatusBadge } from '@litostudio/ui-cms'
import type { ContentStatus } from '@litostudio/ui-cms'

describe('PublishCard — FIND-043/ARCH-008 status-parity regression (TEST-011)', () => {
  it('shows "Published" (not blank/unset) for a record whose real status is the legacy "active" value, matching the list page\'s StatusBadge', () => {
    render(
      <PublishCard
        status={'active' as ContentStatus}
        onStatusChange={vi.fn()}
        onSave={vi.fn()}
        onPublish={vi.fn()}
      />,
    )

    // The editor's own rendered label...
    expect(screen.getByText('Published')).toBeInTheDocument()

    // ...must be the same word the list page's StatusBadge renders for the
    // exact same underlying value — this is the actual "list and editor
    // agree" acceptance criterion, not just "PublishCard shows some text".
    render(<StatusBadge skin="cms" status="active" />)
    expect(screen.getAllByText('Published').length).toBeGreaterThanOrEqual(2)
  })

  it('offers "Unpublish", not "Publish", for a record whose real status is "active" — it must not be treated as an unpublished draft', () => {
    const onPublish = vi.fn()
    render(
      <PublishCard
        status={'active' as ContentStatus}
        onStatusChange={vi.fn()}
        onSave={vi.fn()}
        onPublish={onPublish}
      />,
    )

    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument()
  })

  it('still offers "Publish" (not "Unpublish") for an actual draft, unaffected by the "active" fix', () => {
    render(
      <PublishCard
        status={'draft' as ContentStatus}
        onStatusChange={vi.fn()}
        onSave={vi.fn()}
        onPublish={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Unpublish' })).not.toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('recognizes literal "published" exactly as before (no regression for the non-legacy value)', () => {
    render(
      <PublishCard
        status={'published' as ContentStatus}
        onStatusChange={vi.fn()}
        onSave={vi.fn()}
        onPublish={vi.fn()}
      />,
    )

    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument()
  })
})
