import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronLeft, Search, Building2, Globe, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useOrgStore, useWebsiteStore } from '@litostudio/ui-cms'
import { orgService } from '@/services/org.service'
import type { Organization, Site } from '@litostudio/ui-cms'

type Step = 'org' | 'site'

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('org')
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const navigate = useNavigate()
  const { org, setOrg } = useOrgStore()
  const { activeSite, setActiveSite } = useWebsiteStore()

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
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setStep('org'); setSearch('') }}
        className="w-full flex items-center gap-2.5 px-4 py-[14px] bg-transparent border-none border-b border-[var(--cms-sidebar-div)] cursor-pointer text-left"
      >
        {/* Logo mark */}
        <div className="w-8 h-8 rounded-md bg-[var(--lito-gold)] flex items-center justify-center shrink-0">
          <span className="font-display text-[14px] font-normal text-[#111] leading-none">L</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-[15px] font-normal text-[var(--lito-cream)] leading-[1.2] truncate">
            {displayName}
          </div>
          {displayDomain && (
            <div className="font-body text-[11px] text-[var(--cms-sidebar-label)] mt-0.5 truncate">
              {displayDomain}
            </div>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-[var(--cms-sidebar-label)] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-2 right-2 bg-[#1C1A17] border border-[rgba(247,244,238,0.08)] rounded-lg z-[100] overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
          {/* Step header */}
          <div className="flex items-center gap-2 px-3 pt-[10px] pb-1.5 border-b border-[rgba(247,244,238,0.06)]">
            {step === 'site' && (
              <button
                type="button"
                onClick={handleBack}
                className="bg-transparent border-none p-0.5 cursor-pointer text-[var(--cms-sidebar-label)] flex"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--cms-sidebar-label)]">
              {step === 'org' ? 'Organizations' : org?.name}
            </span>
          </div>

          {/* Search */}
          <div className="px-[10px] pt-2 pb-1 border-b border-[rgba(247,244,238,0.06)]">
            <div className="relative flex items-center">
              <Search size={12} className="absolute left-2 text-[var(--cms-sidebar-label)] pointer-events-none" />
              <input
                autoFocus
                type="text"
                placeholder={step === 'org' ? 'Search organizations…' : 'Search websites…'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full py-[5px] pr-2 pl-[26px] bg-[rgba(247,244,238,0.05)] border border-[rgba(247,244,238,0.08)] rounded text-xs text-[var(--lito-cream)] outline-none font-body"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-[220px] overflow-y-auto cms-scroll">
            {step === 'org' ? (
              filteredOrgs.length === 0 ? (
                <div className="px-3.5 py-4 text-xs text-[var(--cms-sidebar-label)] text-center">No organizations</div>
              ) : filteredOrgs.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => handleSelectOrg(o)}
                  className="ws-item w-full border-none bg-transparent text-left cursor-pointer"
                >
                  <div className="w-[26px] h-[26px] rounded bg-[rgba(212,168,83,0.15)] flex items-center justify-center shrink-0">
                    <Building2 size={12} className="text-[var(--lito-gold)]" />
                  </div>
                  <span className="text-[13px] text-[rgba(247,244,238,0.8)] font-body">{o.name}</span>
                  {org?.id === o.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--lito-gold)] shrink-0" />
                  )}
                </button>
              ))
            ) : (
              filteredSites.length === 0 ? (
                <div className="px-3.5 py-4 text-xs text-[var(--cms-sidebar-label)] text-center">No websites</div>
              ) : filteredSites.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSite(s)}
                  className="ws-item w-full border-none bg-transparent text-left cursor-pointer"
                >
                  <div className="w-[26px] h-[26px] rounded bg-[rgba(26,74,90,0.2)] flex items-center justify-center shrink-0">
                    <Globe size={12} className="text-[var(--lito-teal)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[rgba(247,244,238,0.8)] font-body truncate">
                      {s.domain ?? s.name ?? s.id}
                    </div>
                    {s.domain && s.name && (
                      <div className="text-[11px] text-[var(--cms-sidebar-label)] truncate">{s.name}</div>
                    )}
                  </div>
                  {activeSite?.id === s.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--lito-gold)] shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[rgba(247,244,238,0.06)] px-2 py-1.5">
            <button
              type="button"
              onClick={() => {
                if (step === 'org') { setOpen(false); navigate('/organizations') }
              }}
              className="flex items-center gap-1.5 w-full px-2 py-[7px] bg-transparent border-none cursor-pointer text-[11px] text-[var(--cms-sidebar-label)] font-body rounded hover:bg-[rgba(247,244,238,0.04)]"
            >
              <Plus size={11} />
              {step === 'org' ? 'Create organization' : 'Create website'}
            </button>
            {step === 'org' && (
              <button
                type="button"
                onClick={() => { setOpen(false); navigate('/organizations') }}
                className="flex items-center gap-1.5 w-full px-2 py-[7px] bg-transparent border-none cursor-pointer text-[11px] text-[var(--lito-gold)] font-body rounded hover:bg-[rgba(212,168,83,0.08)]"
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
