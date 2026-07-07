// apps/cms/src/modules/organizations/OrganizationsPageView.tsx
import { useState } from 'react'
import { Plus, Building2, Pencil, Trash2, Globe, CheckCircle2, ChevronRight } from 'lucide-react'
import { Skeleton } from '@litostudio/ui-cms'
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
    <span
      className="px-2 py-[2px] rounded-full text-[10px] font-semibold uppercase tracking-[0.07em]"
      style={{ color: cfg.fg, background: cfg.bg }}
    >
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
    <div className="cms-page flex-1 overflow-y-auto px-7 py-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] font-normal text-[var(--text-muted)] mb-1">
            Organizations
          </h1>
          <p className="font-body text-[13px] text-[var(--text-muted)]">
            Manage your organizations and their associated websites.
            {orgs.length === 0 && !isLoading && (
              <span className="text-[var(--lito-gold-deep)] font-medium">
                {' '}Create one to unlock content management.
              </span>
            )}
          </p>
        </div>
        <button type="button" onClick={onCreate} className="cms-btn cms-btn-primary">
          <Plus size={14} /> New Organization
        </button>
      </div>

      {/* Empty state */}
      {!isLoading && orgs.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 border-[1.5px] border-dashed border-[var(--lito-border)] rounded-xl bg-[var(--cms-card-bg)]">
          <div className="w-14 h-14 rounded-xl bg-[rgba(212,168,83,0.10)] flex items-center justify-center">
            <Building2 size={24} className="text-[var(--lito-gold-deep)]" />
          </div>
          <div className="text-center">
            <p className="font-display text-[20px] font-normal text-[var(--text-primary)] mb-1.5">
              No organizations yet
            </p>
            <p className="font-body text-[13px] text-[var(--text-muted)] max-w-[340px]">
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
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="cms-card px-6 py-5">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          ))}
        </div>
      )}

      {/* Org cards */}
      {!isLoading && orgs.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {orgs.map(org => {
            const isActive = org.id === activeOrgId
            const isConfirm = deleteConfirm === org.id
            return (
              <div
                key={org.id}
                className={`cms-card px-5 py-[18px] transition-[border-color,background] duration-150 ${
                  isActive ? 'border-[rgba(212,168,83,0.4)] bg-[rgba(212,168,83,0.03)]' : ''
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${
                    isActive ? 'bg-[rgba(212,168,83,0.15)]' : 'bg-[var(--lito-cream-alt)]'
                  }`}>
                    <Building2 size={18} className={isActive ? 'text-[var(--lito-gold-deep)]' : 'text-[var(--text-muted)]'} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-[3px]">
                      <span className="font-body text-sm font-medium text-[var(--text-muted)]">
                        {org.name}
                      </span>
                      <PlanBadge plan={org.plan} />
                      {isActive && (
                        <span className="flex items-center gap-[3px] text-[10px] text-[var(--lito-gold-deep)] font-semibold uppercase tracking-[0.07em]">
                          <CheckCircle2 size={11} /> Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-body text-[11px] text-[var(--text-muted)]">
                        slug: <code className="font-mono">{org.slug}</code>
                      </span>
                      <span className="flex items-center gap-[3px] text-[11px] text-[var(--text-muted)]">
                        <Globe size={10} />
                        {org.status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => onSelect(org)}
                        className="flex items-center gap-[5px] px-3 py-[5px] rounded-full border border-[var(--lito-border)] bg-transparent text-[var(--text-muted)] text-[11px] font-medium cursor-pointer font-body transition-all duration-150 hover:border-[var(--lito-gold)] hover:text-[var(--lito-gold-deep)]"
                      >
                        Switch <ChevronRight size={11} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(org)}
                      title="Edit organization"
                      className="flex items-center justify-center w-[30px] h-[30px] rounded-md border border-[var(--lito-border)] bg-transparent text-[var(--text-muted)] cursor-pointer transition-all duration-150 hover:bg-[var(--lito-cream-alt)] hover:text-[var(--text-primary)]"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(org)}
                      title={isConfirm ? 'Click again to confirm delete' : 'Delete organization'}
                      className={`flex items-center justify-center h-[30px] rounded-md cursor-pointer transition-all duration-150 text-[10px] font-semibold gap-[3px] whitespace-nowrap ${
                        isConfirm
                          ? 'border border-[rgba(163,48,40,0.5)] bg-[var(--cms-danger-bg)] text-[var(--cms-danger)] px-2'
                          : 'border border-[var(--lito-border)] bg-transparent text-[var(--text-muted)] w-[30px] hover:border-[rgba(163,48,40,0.5)] hover:text-[var(--cms-danger)]'
                      }`}
                      onMouseLeave={() => { if (!isConfirm) setDeleteConfirm(null) }}
                    >
                      <Trash2 size={12} />
                      {isConfirm && <span>Confirm?</span>}
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
        <p className="font-body text-[11px] text-[var(--text-faint)] mt-4 text-center">
          Switch organizations using the workspace switcher in the sidebar, or click "Switch" above.
        </p>
      )}
    </div>
  )
}
