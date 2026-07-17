import { NavLink, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, FileText, BookOpen, Image, Film, MapPin,
  Megaphone, Globe, Settings, Users, BarChart2, Search,
  LogOut, Tag, Hash, Palette, Sliders,
  Package, Layers, MessageSquare, HelpCircle, Puzzle,
  Briefcase, Quote, DollarSign, Tv2, MessageCircle,
  ShoppingBag, Mail, Inbox, Bot, Link2, Rocket, FileSpreadsheet,
  Building2, Languages, Truck, Scale, Percent, Award, Settings2, Upload,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { addonService } from '@/services/addon.service'
import { WorkspaceSwitcher } from '@litostudio/ui-cms'

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
  // Plans-Addons project (2026-07-15): if set, this item only renders when
  // the org has this addon slug enabled right now (live state, not a static
  // list) — resolves the gap the user flagged from the sidebar screenshot:
  // Promotions/Campaigns/Loyalty were always visible regardless of whether
  // the org's plan actually includes them or a superadmin had disabled them.
  addonSlug?: string
}
interface NavSection { section: string; items: NavItem[] }

// Bug fix (2026-07): react-router's NavLink does prefix matching by default
// (no `end` prop here), so a parent route whose path is a literal prefix of
// a sibling nav item's path lights up alongside it — e.g. on
// /settings/localization, both "Settings" (to="/settings") and "Labels"
// (to="/settings/localization") matched as active. The same collision
// exists for "Products" (/products) vs "Catalog Import"
// (/products/mass-upload). Adding `end` to just the parent items would fix
// those two but silently break the still-desired case where "Products"
// should stay highlighted on /products/:id/edit (no separate nav entry for
// product-edit). Instead: compute the single most-specific (longest) nav
// path that matches the current pathname across ALL nav items, and treat
// only that one path as active. This naturally resolves both prefix
// collisions above while preserving sub-route highlighting for routes that
// have no sibling nav item claiming a more specific path.
function useActiveNavPath(): string | null {
  const { pathname } = useLocation()
  const allPaths = NAV.flatMap((s) => s.items.map((i) => i.to))
  const matches = allPaths.filter((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (matches.length === 0) return null
  return matches.reduce((longest, p) => (p.length > longest.length ? p : longest))
}

const NAV: NavSection[] = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
      { label: 'Analytics',  icon: BarChart2,       to: '/analytics' },
    ],
  },
  {
    section: 'Content',
    items: [
      { label: 'Stories',      icon: FileText, to: '/stories' },
      { label: 'Journal',      icon: BookOpen, to: '/journal' },
      { label: 'Gallery',      icon: Image,    to: '/gallery' },
      { label: 'Media',        icon: Film,     to: '/media' },
      { label: 'Destinations', icon: MapPin,   to: '/destinations' },
      { label: 'Brands',       icon: Building2, to: '/brands' },
      { label: 'Categories',   icon: Tag,      to: '/categories' },
      { label: 'Tags',         icon: Hash,     to: '/tags' },
    ],
  },
  {
    section: 'Commerce',
    items: [
      { label: 'Products',    icon: Package,       to: '/products' },
      { label: 'Catalog Import', icon: Upload,     to: '/products/mass-upload' },
      { label: 'Collections', icon: Layers,        to: '/collections' },
      { label: 'Orders',      icon: ShoppingBag,   to: '/orders' },
      { label: 'Promotions',  icon: Percent,       to: '/promotions', addonSlug: 'promotions' },
      { label: 'Loyalty',     icon: Award,         to: '/loyalty/accounts', addonSlug: 'loyalty_points' },
      { label: 'Loyalty Settings', icon: Settings2, to: '/loyalty/settings', addonSlug: 'loyalty_points' },
      { label: 'Shipping Origins', icon: Truck,    to: '/shipping-origins' },
      { label: 'Reviews',     icon: MessageSquare, to: '/reviews' },
    ],
  },
  {
    section: 'Services',
    items: [
      { label: 'Services',      icon: Briefcase,    to: '/services' },
      { label: 'Testimonials',  icon: Quote,        to: '/testimonials' },
      { label: 'Pricing',       icon: DollarSign,   to: '/pricing' },
    ],
  },
  {
    section: 'Engagement',
    items: [
      { label: 'Messages',    icon: Inbox,         to: '/messages' },
      { label: 'Newsletter',  icon: Mail,          to: '/newsletter' },
      { label: 'FAQs',        icon: HelpCircle,    to: '/faqs' },
      { label: 'Comments',    icon: MessageCircle, to: '/comments' },
    ],
  },
  {
    section: 'Marketing',
    items: [
      { label: 'Campaigns', icon: Megaphone, to: '/campaigns', addonSlug: 'campaigns' },
      { label: 'SEO',       icon: Search,    to: '/seo' },
    ],
  },
  {
    section: 'Website',
    items: [
      { label: 'Hero Slides', icon: Tv2,     to: '/hero' },
      { label: 'Pages',       icon: Globe,   to: '/pages' },
      { label: 'Themes',        icon: Palette,  to: '/themes' },
      { label: 'Site Content',  icon: Sliders,  to: '/site-content' },
      { label: 'Legal Center',  icon: Scale,    to: '/legal' },
      { label: 'Add-Ons',       icon: Puzzle,   to: '/addons' },
    ],
  },
  {
    section: 'Administration',
    items: [
      { label: 'Team',          icon: Users,          to: '/team' },
      { label: 'Organizations', icon: Building2,       to: '/organizations' },
      { label: 'Domains',       icon: Link2,           to: '/domains' },
      { label: 'Deployments',   icon: Rocket,          to: '/deployments' },
      { label: 'CSV Import',    icon: FileSpreadsheet, to: '/csv' },
      { label: 'AI Assistant',  icon: Bot,             to: '/ai-assistant' },
    ],
  },
  {
    section: 'Settings',
    items: [
      { label: 'Settings',     icon: Settings,   to: '/settings' },
      { label: 'Labels',       icon: Languages,  to: '/settings/localization' },
    ],
  },
]

function UserWidget() {
  const { user, logout } = useAuthStore()
  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="border-t border-[var(--cms-sidebar-div)] px-4 py-3 flex items-center gap-[10px]">
      {/* Avatar */}
      {user?.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.full_name ?? 'User'}
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[rgba(212,168,83,0.15)] flex items-center justify-center shrink-0 font-body text-xs font-medium text-[var(--lito-gold)]">
          {initials}
        </div>
      )}

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <div className="font-body text-xs font-medium text-[rgba(247,244,238,0.80)] truncate">
          {user?.full_name ?? user?.email ?? 'User'}
        </div>
        <div className="font-body text-[10px] text-[var(--cms-sidebar-label)] capitalize">
          {user?.role ?? 'Member'}
        </div>
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={logout}
        title="Log out"
        aria-label="Log out"
        className="bg-transparent border-none p-1.5 cursor-pointer text-[var(--cms-sidebar-label)] flex rounded transition-[color,background] duration-150 shrink-0 hover:text-[#A33028] hover:bg-[rgba(163,48,40,0.1)]"
      >
        <LogOut size={14} />
      </button>
    </div>
  )
}

export function AppSidebar() {
  const { sidebarOpen } = useThemeStore()
  const { user } = useAuthStore()
  const activeNavPath = useActiveNavPath()

  // Plans-Addons project (2026-07-15) — live addon state, not the static nav
  // array. 5 min staleTime matches the addon system's own cache TTL
  // (addons.routes.ts CACHE_TTL); real-time disable still reaches this menu
  // within that window without polling on every render.
  const orgAddonsQuery = useQuery({
    queryKey: ['cms', 'organization', user?.org_id, 'addons'],
    queryFn: () => addonService.listOrgAddons(user!.org_id!),
    enabled: !!user?.org_id,
    staleTime: 5 * 60 * 1000,
  })
  const enabledAddonSlugs = new Set(
    (orgAddonsQuery.data ?? []).filter((oa) => oa.enabled).map((oa) => oa.addons?.slug).filter(Boolean),
  )
  // Fail open while loading/erroring — an addon-gated nav item briefly
  // showing before the check resolves (or on a fetch failure) is a much
  // smaller problem than every gated CMS section vanishing during a
  // transient network hiccup. The backend routes remain the real
  // enforcement point regardless of what this menu shows.
  const isNavItemVisible = (item: NavItem): boolean => {
    if (!item.addonSlug) return true
    if (orgAddonsQuery.isLoading || orgAddonsQuery.isError) return true
    return enabledAddonSlugs.has(item.addonSlug)
  }

  if (!sidebarOpen) return null

  return (
    <aside className="w-[var(--cms-sidebar-w)] shrink-0 h-screen bg-[var(--cms-sidebar-bg)] flex flex-col border-r border-[rgba(247,244,238,0.04)] overflow-hidden">
      {/* Logo */}
      <div className="px-5 pt-4 pb-3 border-b border-[rgba(247,244,238,0.06)] shrink-0">
        <img
          src="/logo/logo-horizontal-white.png"
          alt="Lito Studio"
          className="h-[22px] object-contain object-left"
        />
      </div>

      {/* Workspace switcher */}
      <WorkspaceSwitcher />

      {/* Nav */}
      <nav className="cms-scroll flex-1 py-2">
        {NAV.map(({ section, items }) => {
          const visibleItems = items.filter(isNavItemVisible)
          if (visibleItems.length === 0) return null
          return (
            <div key={section} className="mb-1">
              {/* Section label */}
              <div className="px-5 pt-[10px] pb-1 text-[10px] font-medium uppercase tracking-[0.10em] text-[var(--cms-sidebar-label)] font-body">
                {section}
              </div>

              {visibleItems.map(({ label, icon: Icon, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  // Bug fix (2026-07): must pass className as a FUNCTION here.
                  // When className is a plain string, react-router's NavLink
                  // (v6.30, see node_modules/react-router-dom/dist/
                  // react-router-dom.development.js ~line 889-897) auto-appends
                  // its OWN "active" class computed from ITS OWN prefix-match
                  // isActive — completely ignoring/on top of whatever string we
                  // pass. That's why passing a plain template string here still
                  // produced "active" on "Settings" while on
                  // /settings/localization (NavLink's own prefix match: "/settings"
                  // is a prefix of "/settings/localization"), regardless of our
                  // activeNavPath computation. Passing a function opts out of
                  // that auto-append entirely — NavLink then uses exactly what
                  // this function returns.
                  className={() => `cms-nav-item flex ${to === activeNavPath ? 'active' : ''}`}
                >
                  <Icon size={15} className="shrink-0 opacity-85" />
                  <span className="leading-none truncate">{label}</span>
                </NavLink>
              ))}

              <div className="h-px mx-4 mt-1.5 bg-[var(--cms-sidebar-div)]" />
            </div>
          )
        })}
      </nav>

      {/* User widget */}
      <UserWidget />
    </aside>
  )
}
