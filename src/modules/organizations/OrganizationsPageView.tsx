// apps/cms/src/modules/organizations/OrganizationsPageView.tsx
import { useState } from 'react'
import { Plus, Building2, Pencil, Trash2, Globe, CheckCircle2, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/atoms/Skeleton'
import type { Organization } from '@/types/auth.types'

interface Props {
  orgs: Organization[]
  isLoading: boolean
  activeOrgId: string | null
  onSelect: (org: Organization) => void
  onCreate: () => void
  onEdit: (org: Organization) => void
  onDelete: (org: Organization) => void
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, { label: string; fg: string; bg: string }> = {
    free:    { label: 'Free',    fg: 'var(--text-muted)',     bg: 'var(--lito-cream-alt)' },
    starter: { label: 'Starter', fg: 'var(--lito-teal)',      bg: 'rgba(26,74,90,0.10)' },
    pro:     { label: 'Pro',     fg: 'var(--lito-gold-deep)', bg: 'rgba(212,168,83,0.14)' },
    agency:  { label: 'Agency',  fg: '#7C3AED',               bg: 'rgba(124,58,237,0.10)' },
  }
  const cfg = map[plan] ?? map.free!
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 999,
      fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
      color: cfg.fg, background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  )
}

export function OrganizationsPageView({ orgs, isLoading, activeOrgId, onSelect, onCreate, onEdit, onDelete }: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  function handleDeleteClick(org: Organization) {
    if (deleteConfirm === org.id) {
      onDelete(org)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(org.id)
    }
  }

  return (
    <div className="cms-page" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 4 }}>
            Organizations
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
            Manage your organizations and their associated websites.
            {orgs.length === 0 && !isLoading && (
              <span style={{ color: 'var(--lito-gold-deep)', fontWeight: 500 }}>
                {' '}Create one to unlock content management.
              </span>
            )}
          </p>
        </div>
        <button type="button" onClick={onCreate} className="cms-btn cms-btn-primary">
          <Plus size={14} /> New Organization
        </button>
      </div>

      {/* Empty state — no org yet */}
      {!isLoading && orgs.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, padding: '64px 0',
          border: '1.5px dashed var(--lito-border)',
          borderRadius: 12, background: 'var(--cms-card-bg)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: 'rgba(212,168,83,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={24} style={{ color: 'var(--lito-gold-deep)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 6 }}>
              No organizations yet
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 340 }}>
              An organization is your workspace. Create one to start managing stories, pages, products and more.
            </p>
          </div>
          <button type="button" onClick={onCreate} className="cms-btn cms-btn-primary">
            <Plus size={14} /> Create your first organization
          </button>
        </div>
      )}

      {/* Skeleton */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="cms-card" style={{ padding: '20px 24px' }}>
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          ))}
        </div>
      )}

      {/* Org cards */}
      {!isLoading && orgs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orgs.map(org => {
            const isActive = org.id === activeOrgId
            return (
              <div
                key={org.id}
                className="cms-card"
                style={{
                  padding: '18px 20px',
                  borderColor: isActive ? 'rgba(212,168,83,0.4)' : undefined,
                  background: isActive ? 'rgba(212,168,83,0.03)' : undefined,
                  transition: 'border-color 150ms, background 150ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                    background: isActive ? 'rgba(212,168,83,0.15)' : 'var(--lito-cream-alt)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Building2 size={18} style={{ color: isActive ? 'var(--lito-gold-deep)' : 'var(--text-muted)' }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {org.name}
                      </span>
                      <PlanBadge plan={org.plan} />
                      {isActive && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--lito-gold-deep)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          <CheckCircle2 size={11} /> Active
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
                        slug: <code style={{ fontFamily: 'monospace' }}>{org.slug}</code>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)' }}>
                        <Globe size={10} />
                        {org.status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => onSelect(org)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 999,
                          border: '1px solid var(--lito-border)',
                          background: 'transparent', color: 'var(--text-muted)',
                          fontSize: 11, fontWeight: 500, cursor: 'pointer',
                          fontFamily: 'var(--font-body)', transition: 'all 150ms',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lito-gold)'; e.currentTarget.style.color = 'var(--lito-gold-deep)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--lito-border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                      >
                        Switch <ChevronRight size={11} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(org)}
                      title="Edit organization"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 30, height: 30, borderRadius: 6,
                        border: '1px solid var(--lito-border)',
                        background: 'transparent', color: 'var(--text-muted)',
                        cursor: 'pointer', transition: 'all 150ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--lito-cream-alt)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(org)}
                      title={deleteConfirm === org.id ? 'Click again to confirm delete' : 'Delete organization'}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: deleteConfirm === org.id ? 'auto' : 30,
                        height: 30, borderRadius: 6,
                        border: `1px solid ${deleteConfirm === org.id ? 'rgba(163,48,40,0.5)' : 'var(--lito-border)'}`,
                        background: deleteConfirm === org.id ? 'var(--cms-danger-bg)' : 'transparent',
                        color: deleteConfirm === org.id ? 'var(--cms-danger)' : 'var(--text-muted)',
                        cursor: 'pointer', transition: 'all 150ms',
                        fontSize: 10, fontWeight: 600, gap: 3,
                        whiteSpace: 'nowrap', padding: deleteConfirm === org.id ? '0 8px' : undefined,
                      } as React.CSSProperties}
                      onMouseEnter={e => {
                        if (deleteConfirm !== org.id) {
                          e.currentTarget.style.borderColor = 'rgba(163,48,40,0.5)'
                          e.currentTarget.style.color = 'var(--cms-danger)'
                        }
                      }}
                      onMouseLeave={e => {
                        if (deleteConfirm !== org.id) {
                          e.currentTarget.style.borderColor = 'var(--lito-border)'
                          e.currentTarget.style.color = 'var(--text-muted)'
                        }
                        setDeleteConfirm(null)
                      }}
                    >
                      <Trash2 size={12} />
                      {deleteConfirm === org.id && <span>Confirm?</span>}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Help note */}
      {!isLoading && orgs.length > 0 && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-faint)', marginTop: 16, textAlign: 'center' }}>
          Switch organizations using the workspace switcher in the sidebar, or click "Switch" above.
        </p>
      )}
    </div>
  )
}
