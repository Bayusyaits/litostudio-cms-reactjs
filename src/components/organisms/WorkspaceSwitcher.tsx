import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronLeft, Search, Building2, Globe, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useOrgStore } from '@/stores/org.store'
import { useWebsiteStore } from '@/stores/website.store'
import { orgService } from '@/services/org.service'
import type { Organization } from '@/types/auth.types'
import type { Site } from '@/types/auth.types'

type Step = 'org' | 'site'

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('org')
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const navigate = useNavigate()
  const { org, setOrg } = useOrgStore()
  const { activeSite, setActiveSite } = useWebsiteStore()

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
        setStep('org')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Eagerly fetch orgs so the list is ready when the dropdown opens.
  // `gcTime: 0` prevents stale orgs from appearing after an org is created.
  const { data: orgsData } = useQuery({
    queryKey: ['orgs'],
    queryFn: orgService.getOrgs,
    staleTime: 2 * 60 * 1000,
    enabled: true,
  })

  const { data: sitesData } = useQuery({
    queryKey: ['sites', org?.id],
    queryFn: () => orgService.getSitesByOrg(org!.id),
    staleTime: 2 * 60 * 1000,
    enabled: !!org,
  })

  const orgs: Organization[] = orgsData?.data ?? []
  const sites: Site[] = sitesData?.data ?? []

  const filteredOrgs = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredSites = sites.filter(s =>
    (s.domain ?? s.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function handleSelectOrg(o: Organization) {
    setOrg(o)
    setSearch('')
    setStep('site')
  }

  function handleSelectSite(s: Site) {
    setActiveSite(s)
    setOpen(false)
    setSearch('')
    setStep('org')
  }

  function handleBack() {
    setStep('org')
    setSearch('')
  }

  const displayName = org?.name ?? 'Select workspace'
  const displayDomain = activeSite?.domain ?? activeSite?.name ?? null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setStep('org'); setSearch('') }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--cms-sidebar-div)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Logo mark */}
        <div style={{
          width: 32, height: 32, borderRadius: 6,
          background: 'var(--lito-gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 400, color: '#111', lineHeight: 1 }}>L</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            fontWeight: 400,
            color: 'var(--lito-cream)',
            lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </div>
          {displayDomain && (
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: 'var(--cms-sidebar-label)',
              marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {displayDomain}
            </div>
          )}
        </div>
        <ChevronDown
          size={14}
          style={{ color: 'var(--cms-sidebar-label)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 8,
          right: 8,
          background: '#1C1A17',
          border: '1px solid rgba(247,244,238,0.08)',
          borderRadius: 8,
          zIndex: 100,
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        }}>
          {/* Step header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px 6px',
            borderBottom: '1px solid rgba(247,244,238,0.06)',
          }}>
            {step === 'site' && (
              <button
                type="button"
                onClick={handleBack}
                style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--cms-sidebar-label)', display: 'flex' }}
              >
                <ChevronLeft size={14} />
              </button>
            )}
            <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cms-sidebar-label)' }}>
              {step === 'org' ? 'Organizations' : org?.name}
            </span>
          </div>

          {/* Search */}
          <div style={{ padding: '8px 10px 4px', borderBottom: '1px solid rgba(247,244,238,0.06)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={12} style={{ position: 'absolute', left: 8, color: 'var(--cms-sidebar-label)', pointerEvents: 'none' }} />
              <input
                autoFocus
                type="text"
                placeholder={step === 'org' ? 'Search organizations…' : 'Search websites…'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px 5px 26px',
                  background: 'rgba(247,244,238,0.05)',
                  border: '1px solid rgba(247,244,238,0.08)',
                  borderRadius: 4,
                  fontSize: 12,
                  color: 'var(--lito-cream)',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }} className="cms-scroll">
            {step === 'org' ? (
              filteredOrgs.length === 0 ? (
                <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--cms-sidebar-label)', textAlign: 'center' }}>No organizations</div>
              ) : filteredOrgs.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => handleSelectOrg(o)}
                  className="ws-item"
                  style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: 4,
                    background: 'rgba(212,168,83,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Building2 size={12} style={{ color: 'var(--lito-gold)' }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(247,244,238,0.8)', fontFamily: 'var(--font-body)' }}>{o.name}</span>
                  {org?.id === o.id && (
                    <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--lito-gold)', flexShrink: 0 }} />
                  )}
                </button>
              ))
            ) : (
              filteredSites.length === 0 ? (
                <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--cms-sidebar-label)', textAlign: 'center' }}>No websites</div>
              ) : filteredSites.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSite(s)}
                  className="ws-item"
                  style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: 4,
                    background: 'rgba(26,74,90,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Globe size={12} style={{ color: 'var(--lito-teal)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'rgba(247,244,238,0.8)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.domain ?? s.name ?? s.id}
                    </div>
                    {s.domain && s.name && (
                      <div style={{ fontSize: 11, color: 'var(--cms-sidebar-label)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    )}
                  </div>
                  {activeSite?.id === s.id && (
                    <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--lito-gold)', flexShrink: 0 }} />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid rgba(247,244,238,0.06)', padding: '6px 8px' }}>
            <button
              type="button"
              onClick={() => {
                if (step === 'org') { setOpen(false); navigate('/organizations') }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                width: '100%', padding: '7px 8px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: 'var(--cms-sidebar-label)',
                fontFamily: 'var(--font-body)',
                borderRadius: 4,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(247,244,238,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <Plus size={11} />
              {step === 'org' ? 'Create organization' : 'Create website'}
            </button>
            {step === 'org' && (
              <button
                type="button"
                onClick={() => { setOpen(false); navigate('/organizations') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  width: '100%', padding: '7px 8px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: 'var(--lito-gold)',
                  fontFamily: 'var(--font-body)',
                  borderRadius: 4,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,83,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <Building2 size={11} />
                Manage organizations
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
