// TEST-011 (master-implementation-execution-plan-2026-09-04.md, Workstream G)
// Unit coverage for the shared FIND-043/ARCH-008 fix itself
// (packages/ui-cms/src/types/api.types.ts's isPublishedStatus), separate
// from PublishCard.test.tsx's component-level coverage of the same fix.
import { describe, expect, it } from 'vitest'
import { isPublishedStatus } from '@litostudio/ui-cms'

describe('isPublishedStatus (FIND-043/ARCH-008 shared helper)', () => {
  it('treats the legacy "active" DB value as published', () => {
    expect(isPublishedStatus('active')).toBe(true)
  })

  it('treats the literal "published" value as published', () => {
    expect(isPublishedStatus('published')).toBe(true)
  })

  it('does not treat draft/scheduled/archived as published', () => {
    expect(isPublishedStatus('draft')).toBe(false)
    expect(isPublishedStatus('scheduled')).toBe(false)
    expect(isPublishedStatus('archived')).toBe(false)
  })

  it('handles null/undefined safely (no crash on a not-yet-hydrated status)', () => {
    expect(isPublishedStatus(null)).toBe(false)
    expect(isPublishedStatus(undefined)).toBe(false)
  })
})
