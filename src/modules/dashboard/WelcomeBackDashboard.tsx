/**
 * WelcomeBackDashboard
 *
 * Shown on /dashboard when the user already has an organization and/or site.
 * Replaces the onboarding wizard entirely — "Let's get you set up" NEVER
 * appears here.
 *
 * Layout:
 *   ┌──────────────────── Welcome header ────────────────────┐
 *   │  Current Organization card  │  Current Website card    │
 *   └──────────────────────────────────────────────────────── ┘
 *   Quick Actions row
 *   (empty state if no site yet — invite user to create one)
 */

import { useNavigate } from 'react-router-dom'
import {
  Building2, Globe, Plus, ArrowRight, Settings2,
  FileText, Image, Package, BookOpen, ExternalLink,
  ChevronRight, RefreshCw,
} from 'lucide-react'
import { useOrgStore } from '@/stores/org.store'
import { useWebsiteStore } from '@/stores/website.store'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/lib/utils'

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active:    { label: 'Active',    color: 'var(--s-pub-fg)',   bg: 'var(--s-pub-bg)' },
    published: { label: 'Published', color: 'var(--s-pub-fg)',   bg: 'var(--s-pub-bg)' },
    draft:     { label: 'Draft',     color: 'var(--s-draft-fg)', bg: 'var(--s-draft-bg)' },
    inactive:  { label: 'Inactive',  color: 'var(--s-arch-fg)',  bg: 'var(--s-arch-bg)' },
    archived:  { label: 'Archived',  color: 'var(--s-arch-fg)',  bg: 'var(--s-arch-bg)' },
  }
  const cfg = map[status?.toLowerCase()] ?? map.draft
  return (
    <span className="status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      <span className="status-badge__dot" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}

// ── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-[7px] border-b border-[var(--lito-border)]">
      <span className="font-body text-[11px] text-[var(--text-muted)]">{label}</span>
      <span className="font-body text-xs text-[var(--text-primary)] font-medium">{value}</span>
    </div>
  )
}

// ── Quick Action button ───────────────────────────────────────────────────────

function QuickAction({
  icon: Icon, iconBg, iconColor, label, desc, onClick, disabled,
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  label: string
  desc: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-start gap-2 px-[18px] py-4 bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-xl text-left flex-1 min-w-[130px] transition-[border-color,box-shadow] duration-150 ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:border-[var(--lito-gold)] hover:shadow-[var(--shadow-md)]'
      }`}
    >
      <div
        className="w-[34px] h-[34px] rounded-lg flex items-center justify-center"
        style={{ background: iconBg }}
      >
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div>
        <div className="font-body text-[13px] font-medium text-[var(--text-muted)]">{label}</div>
        <div className="font-body text-[11px] text-[var(--text-muted)] mt-0.5">{desc}</div>
      </div>
    </button>
  )
}

// ── Shared footer-button class ────────────────────────────────────────────────

const cardFooterBtnClass = 'flex items-center gap-[5px] px-3 py-1.5 rounded-[7px] border border-[var(--lito-border)] bg-[var(--cms-card-bg)] cursor-pointer font-body text-xs'

// ── Main component ────────────────────────────────────────────────────────────

export function WelcomeBackDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { org } = useOrgStore()
  const { activeSite } = useWebsiteStore()

  const firstName = user?.full_name?.split(' ')[0] ?? 'there'
  const hasSite = !!activeSite

  return (
    <div className="cms-page p-8 overflow-y-auto h-full bg-[var(--cms-main-bg)]">

      {/* ── Welcome header ──────────────────────────────────────────────────── */}
      <div className="mb-7">
        <h1 className="font-display text-[34px] font-normal text-[var(--text-primary)] leading-[1.15]">
          Welcome back, {firstName}.
        </h1>
        <p className="font-body text-[13px] text-[var(--text-muted)] mt-1.5">
          {hasSite
            ? 'Your workspace is ready. Manage your organization and website below.'
            : 'Your organization is ready. Create a website to start managing content.'}
        </p>
      </div>

      {/* ── Workspace cards ─────────────────────────────────────────────────── */}
      <div className="grid gap-5 mb-7" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>

        {/* Current Organization card */}
        <div className="cms-card overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[var(--lito-border)]">
            <div className="flex items-center gap-2">
              <div className="w-[30px] h-[30px] rounded-[7px] bg-[rgba(212,168,83,0.12)] flex items-center justify-center">
                <Building2 size={15} className="text-[var(--lito-gold)]" />
              </div>
              <span className="font-body text-[13px] font-medium text-[var(--text-muted)]">
                Current Organization
              </span>
            </div>
            <StatusPill status={org?.status ?? 'active'} />
          </div>

          <div className="px-[18px] py-4">
            {org ? (
              <>
                <h2 className="font-display text-[22px] font-normal text-[var(--text-primary)] mb-3.5">
                  {org.name}
                </h2>
                <div>
                  <InfoRow label="Plan" value={<span className="capitalize">{org.plan ?? 'free'}</span>} />
                  <InfoRow label="Status" value={<StatusPill status={org.status} />} />
                  <InfoRow label="Created" value={formatDate(org.created_at)} />
                  <InfoRow label="Slug" value={<code className="text-[11px] bg-[var(--cms-surface-3)] px-1.5 py-px rounded">{org.slug}</code>} />
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Building2 size={32} className="text-[var(--text-muted)] mb-2 mx-auto" />
                <p className="font-body text-[13px] text-[var(--text-muted)] mb-4">No organization yet</p>
                <button
                  type="button"
                  onClick={() => navigate('/onboarding')}
                  className="inline-flex items-center gap-1.5 px-[18px] py-2 rounded-lg border-none bg-[var(--lito-teal)] text-white cursor-pointer font-body text-[13px] font-medium"
                >
                  <Plus size={14} /> Create organization
                </button>
              </div>
            )}
          </div>

          {org && (
            <div className="flex gap-2 px-[18px] py-2.5 border-t border-[var(--lito-border)] bg-[var(--cms-surface-3)]">
              <button
                type="button"
                onClick={() => navigate('/organizations')}
                className={`${cardFooterBtnClass} text-[var(--text-primary)]`}
              >
                <Settings2 size={12} /> Manage
              </button>
              <button
                type="button"
                onClick={() => navigate('/organizations')}
                className={`${cardFooterBtnClass} text-[var(--text-muted)]`}
              >
                <RefreshCw size={12} /> Switch
              </button>
            </div>
          )}
        </div>

        {/* Current Website card */}
        <div className="cms-card overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[var(--lito-border)]">
            <div className="flex items-center gap-2">
              <div className="w-[30px] h-[30px] rounded-[7px] bg-[rgba(26,74,90,0.10)] flex items-center justify-center">
                <Globe size={15} className="text-[var(--lito-teal)]" />
              </div>
              <span className="font-body text-[13px] font-medium text-[var(--text-muted)]">
                Current Website
              </span>
            </div>
            {activeSite && <StatusPill status={activeSite.status} />}
          </div>

          <div className="px-[18px] py-4">
            {activeSite ? (
              <>
                <h2 className="font-display text-[22px] font-normal text-[var(--text-primary)] mb-3.5">
                  {activeSite.name}
                </h2>
                <div>
                  <InfoRow
                    label="Domain"
                    value={
                      activeSite.domain ? (
                        <a
                          href={`https://${activeSite.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--lito-teal)] flex items-center gap-[3px] text-xs no-underline"
                        >
                          {activeSite.domain} <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-[var(--text-muted)] text-xs">Not set</span>
                      )
                    }
                  />
                  <InfoRow label="Status" value={<StatusPill status={activeSite.status} />} />
                  <InfoRow label="Created" value={formatDate(activeSite.created_at)} />
                  <InfoRow label="Slug" value={<code className="text-[11px] bg-[var(--cms-surface-3)] px-1.5 py-px rounded">{activeSite.slug}</code>} />
                </div>
              </>
            ) : org ? (
              <div className="text-center py-6">
                <Globe size={32} className="text-[var(--text-muted)] mb-2 mx-auto" />
                <p className="font-body text-[13px] text-[var(--text-muted)] mb-4">No website yet</p>
                <button
                  type="button"
                  onClick={() => navigate('/onboarding')}
                  className="inline-flex items-center gap-1.5 px-[18px] py-2 rounded-lg border-none bg-[var(--lito-teal)] text-white cursor-pointer font-body text-[13px] font-medium"
                >
                  <Plus size={14} /> Create website
                </button>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="font-body text-[13px] text-[var(--text-muted)]">Create an organization first</p>
              </div>
            )}
          </div>

          {activeSite && (
            <div className="flex gap-2 px-[18px] py-2.5 border-t border-[var(--lito-border)] bg-[var(--cms-surface-3)]">
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className={`${cardFooterBtnClass} text-[var(--text-primary)]`}
              >
                <Settings2 size={12} /> Manage
              </button>
              <button
                type="button"
                onClick={() => navigate('/organizations')}
                className={`${cardFooterBtnClass} text-[var(--text-muted)]`}
              >
                <RefreshCw size={12} /> Switch
              </button>
              {activeSite.domain && (
                <a
                  href={`https://${activeSite.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cardFooterBtnClass} text-[var(--lito-teal)] no-underline`}
                >
                  <ExternalLink size={12} /> Open
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <div className="mb-7">
        <h2 className="font-body text-[11px] font-medium uppercase tracking-[0.09em] text-[var(--text-muted)] mb-3">
          Quick Actions
        </h2>
        <div className="flex gap-3.5 flex-wrap">
          <QuickAction icon={FileText} iconBg="rgba(26,74,90,0.10)"   iconColor="var(--lito-teal)"      label="Create Story"   desc="Write & publish a story"  onClick={() => navigate('/stories/new')}  disabled={!hasSite} />
          <QuickAction icon={Package}  iconBg="rgba(212,168,83,0.12)" iconColor="var(--lito-gold)"      label="Create Product" desc="Add a new product"          onClick={() => navigate('/products/new')} disabled={!hasSite} />
          <QuickAction icon={Image}    iconBg="rgba(212,168,83,0.08)" iconColor="var(--lito-gold-deep)" label="Upload Media"   desc="Add photos & videos"       onClick={() => navigate('/media')}        disabled={!hasSite} />
          <QuickAction icon={BookOpen} iconBg="rgba(17,17,17,0.06)"   iconColor="var(--text-muted)"     label="SEO Overview"   desc="Check search performance"  onClick={() => navigate('/seo')}          disabled={!hasSite} />
          <QuickAction icon={Globe}    iconBg="rgba(26,74,90,0.06)"   iconColor="var(--lito-teal)"      label="Open CMS"       desc="Go to pages editor"        onClick={() => navigate('/pages')}        disabled={!hasSite} />
        </div>
        {!hasSite && (
          <p className="font-body text-xs text-[var(--text-muted)] mt-2">
            Quick actions are available after creating a website.
          </p>
        )}
      </div>

      {/* ── Next steps (when no site) ────────────────────────────────────────── */}
      {!hasSite && org && (
        <div className="cms-card px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-body text-sm font-semibold text-[var(--text-primary)] mb-1">One more step</h3>
              <p className="font-body text-[13px] text-[var(--text-muted)]">
                Create your first website to start building and publishing content.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              className="flex items-center gap-1.5 px-5 py-[9px] rounded-lg border-none bg-[var(--lito-teal)] text-white cursor-pointer font-body text-[13px] font-semibold shrink-0"
            >
              Create website <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Go to full dashboard (when site exists) ──────────────────────────── */}
      {hasSite && (
        <div className="flex justify-end mt-1">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-[5px] px-3.5 py-1.5 rounded-[7px] border border-[var(--lito-border)] bg-transparent cursor-pointer font-body text-xs text-[var(--text-muted)]"
          >
            View full dashboard <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
