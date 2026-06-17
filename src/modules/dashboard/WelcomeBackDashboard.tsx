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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--lito-border)' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
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
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        gap: 8, padding: '16px 18px',
        background: 'var(--cms-card-bg)',
        border: '1px solid var(--lito-border)',
        borderRadius: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        flex: 1, minWidth: 130,
        textAlign: 'left',
        transition: 'border-color 150ms, box-shadow 150ms',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--lito-gold)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'
        }
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--lito-border)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 8,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function WelcomeBackDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { org } = useOrgStore()
  const { activeSite } = useWebsiteStore()

  const firstName = user?.full_name?.split(' ')[0] ?? 'there'
  const hasSite = !!activeSite

  return (
    <div className="cms-page" style={{
      padding: 32, overflowY: 'auto', height: '100%',
      background: 'var(--cms-main-bg)',
    }}>
      {/* ── Welcome header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400,
          color: 'var(--text-primary)', lineHeight: 1.15,
        }}>
          Welcome back, {firstName}.
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
          {hasSite
            ? 'Your workspace is ready. Manage your organization and website below.'
            : 'Your organization is ready. Create a website to start managing content.'}
        </p>
      </div>

      {/* ── Workspace cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 28 }}>

        {/* Current Organization card */}
        <div className="cms-card" style={{ overflow: 'hidden' }}>
          {/* Card header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderBottom: '1px solid var(--lito-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 7,
                background: 'rgba(212,168,83,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Building2 size={15} style={{ color: 'var(--lito-gold)' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                Current Organization
              </span>
            </div>
            <StatusPill status={org?.status ?? 'active'} />
          </div>

          {/* Card body */}
          <div style={{ padding: '16px 18px' }}>
            {org ? (
              <>
                <h2 style={{
                  fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
                  color: 'var(--text-primary)', marginBottom: 14,
                }}>
                  {org.name}
                </h2>
                <div>
                  <InfoRow label="Plan" value={<span style={{ textTransform: 'capitalize' }}>{org.plan ?? 'free'}</span>} />
                  <InfoRow label="Status" value={<StatusPill status={org.status} />} />
                  <InfoRow label="Created" value={formatDate(org.created_at)} />
                  <InfoRow label="Slug" value={<code style={{ fontSize: 11, background: 'var(--cms-surface-3)', padding: '1px 6px', borderRadius: 4 }}>{org.slug}</code>} />
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Building2 size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  No organization yet
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/onboarding')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px', borderRadius: 8,
                    border: 'none', background: 'var(--lito-teal)',
                    color: '#fff', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                  }}
                >
                  <Plus size={14} /> Create organization
                </button>
              </div>
            )}
          </div>

          {/* Card footer actions */}
          {org && (
            <div style={{
              display: 'flex', gap: 8, padding: '10px 18px',
              borderTop: '1px solid var(--lito-border)',
              background: 'var(--cms-surface-3)',
            }}>
              <button
                type="button"
                onClick={() => navigate('/organizations')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 7,
                  border: '1px solid var(--lito-border)',
                  background: 'var(--cms-card-bg)', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: 'var(--text-primary)',
                }}
              >
                <Settings2 size={12} /> Manage
              </button>
              <button
                type="button"
                onClick={() => navigate('/organizations')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 7,
                  border: '1px solid var(--lito-border)',
                  background: 'var(--cms-card-bg)', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                <RefreshCw size={12} /> Switch
              </button>
            </div>
          )}
        </div>

        {/* Current Website card */}
        <div className="cms-card" style={{ overflow: 'hidden' }}>
          {/* Card header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderBottom: '1px solid var(--lito-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 7,
                background: 'rgba(26,74,90,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Globe size={15} style={{ color: 'var(--lito-teal)' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                Current Website
              </span>
            </div>
            {activeSite && <StatusPill status={activeSite.status} />}
          </div>

          {/* Card body */}
          <div style={{ padding: '16px 18px' }}>
            {activeSite ? (
              <>
                <h2 style={{
                  fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
                  color: 'var(--text-primary)', marginBottom: 14,
                }}>
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
                          style={{ color: 'var(--lito-teal)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 12 }}
                        >
                          {activeSite.domain} <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not set</span>
                      )
                    }
                  />
                  <InfoRow label="Status" value={<StatusPill status={activeSite.status} />} />
                  <InfoRow label="Created" value={formatDate(activeSite.created_at)} />
                  <InfoRow label="Slug" value={<code style={{ fontSize: 11, background: 'var(--cms-surface-3)', padding: '1px 6px', borderRadius: 4 }}>{activeSite.slug}</code>} />
                </div>
              </>
            ) : org ? (
              /* Org present but no site */
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Globe size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  No website yet
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/onboarding')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px', borderRadius: 8,
                    border: 'none', background: 'var(--lito-teal)',
                    color: '#fff', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                  }}
                >
                  <Plus size={14} /> Create website
                </button>
              </div>
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
                  Create an organization first
                </p>
              </div>
            )}
          </div>

          {/* Card footer actions */}
          {activeSite && (
            <div style={{
              display: 'flex', gap: 8, padding: '10px 18px',
              borderTop: '1px solid var(--lito-border)',
              background: 'var(--cms-surface-3)',
            }}>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 7,
                  border: '1px solid var(--lito-border)',
                  background: 'var(--cms-card-bg)', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: 'var(--text-primary)',
                }}
              >
                <Settings2 size={12} /> Manage
              </button>
              <button
                type="button"
                onClick={() => navigate('/organizations')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 7,
                  border: '1px solid var(--lito-border)',
                  background: 'var(--cms-card-bg)', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                <RefreshCw size={12} /> Switch
              </button>
              {activeSite.domain && (
                <a
                  href={`https://${activeSite.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 7,
                    border: '1px solid var(--lito-border)',
                    background: 'var(--cms-card-bg)', textDecoration: 'none',
                    fontFamily: 'var(--font-body)', fontSize: 12,
                    color: 'var(--lito-teal)',
                  }}
                >
                  <ExternalLink size={12} /> Open
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.09em',
          color: 'var(--text-muted)', marginBottom: 12,
        }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <QuickAction
            icon={FileText}
            iconBg="rgba(26,74,90,0.10)"
            iconColor="var(--lito-teal)"
            label="Create Story"
            desc="Write & publish a story"
            onClick={() => navigate('/stories/new')}
            disabled={!hasSite}
          />
          <QuickAction
            icon={Package}
            iconBg="rgba(212,168,83,0.12)"
            iconColor="var(--lito-gold)"
            label="Create Product"
            desc="Add a new product"
            onClick={() => navigate('/products/new')}
            disabled={!hasSite}
          />
          <QuickAction
            icon={Image}
            iconBg="rgba(212,168,83,0.08)"
            iconColor="var(--lito-gold-deep)"
            label="Upload Media"
            desc="Add photos & videos"
            onClick={() => navigate('/media')}
            disabled={!hasSite}
          />
          <QuickAction
            icon={BookOpen}
            iconBg="rgba(17,17,17,0.06)"
            iconColor="var(--text-muted)"
            label="SEO Overview"
            desc="Check search performance"
            onClick={() => navigate('/seo')}
            disabled={!hasSite}
          />
          <QuickAction
            icon={Globe}
            iconBg="rgba(26,74,90,0.06)"
            iconColor="var(--lito-teal)"
            label="Open CMS"
            desc="Go to pages editor"
            onClick={() => navigate('/pages')}
            disabled={!hasSite}
          />
        </div>
        {!hasSite && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Quick actions are available after creating a website.
          </p>
        )}
      </div>

      {/* ── Next steps (when no site) ────────────────────────────────────────── */}
      {!hasSite && org && (
        <div className="cms-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                One more step
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
                Create your first website to start building and publishing content.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 8,
                border: 'none', background: 'var(--lito-teal)',
                color: '#fff', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                flexShrink: 0,
              }}
            >
              Create website <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Go to full dashboard (when site exists) ──────────────────────────── */}
      {hasSite && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 7,
              border: '1px solid var(--lito-border)',
              background: 'transparent', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            View full dashboard <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
