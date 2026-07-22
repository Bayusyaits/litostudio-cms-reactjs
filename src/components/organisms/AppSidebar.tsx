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
import { menuService, type MenuNode } from '@/services/menu.service'
import { WorkspaceSwitcher, useWebsiteStore } from '@litostudio/ui-cms'

interface NavItem { label: string; icon: React.ElementType; to: string }
interface NavSection { section: string; items: NavItem[] }

// 2026-07-21 (admin-menu role/addon/flag/plan gating): the sidebar is now
// data-driven from GET /api/v1/cms/sites/:siteId/menu (visibility already
// resolved server-side — see cms-menu.routes.ts). This name->component map
// resolves the icon column (a lucide-react name string in cms_menu_items,
// maintained via the cms-superadmin "Admin Menu" page) back to the same
// components this file already imported for the old static array.
const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, FileText, BookOpen, Image, Film, MapPin,
  Megaphone, Globe, Settings, Users, BarChart2, Search,
  Tag, Hash, Palette, Sliders,
  Package, Layers, MessageSquare, HelpCircle, Puzzle,
  Briefcase, Quote, DollarSign, Tv2, MessageCircle,
  ShoppingBag, Mail, Inbox, Bot, Link2, Rocket, FileSpreadsheet,
  Building2, Languages, Truck, Scale, Percent, Award, Settings2, Upload,
}

// Fail-open fallback — used only while the menu tree is loading/erroring, or
// before a site is selected (the endpoint needs a siteId). Mirrors the old
// static NAV array's shape exactly, so a transient API hiccup shows the same
// baseline menu instead of an empty sidebar. Server-resolved gating (the
// addon/role/flag/plan checks) simply isn't applied during this fallback
// window — same trade-off the old addonSlug fail-open comment already
// accepted here, just widened from one gate to all of them.
const FALLBACK_NAV: NavSection[] = [
  { section: 'Overview', items: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Analytics', icon: BarChart2, to: '/analytics' },
  ] },
  { section: 'Content', items: [
    { label: 'Stories', icon: FileText, to: '/stories' },
    { label: 'Journal', icon: BookOpen, to: '/journal' },
    { label: 'Gallery', icon: Image, to: '/gallery' },
    { label: 'Media', icon: Film, to: '/media' },
    { label: 'Pages', icon: Globe, to: '/pages' },
  ] },
  { section: 'Settings', items: [
    { label: 'Settings', icon: Settings, to: '/settings' },
  ] },
]

function treeToSections(tree: MenuNode[]): NavSection[] {
  return tree
    .filter((node) => node.children.length > 0)
    .map((node) => ({
      section: node.label,
      items: node.children.map((c) => ({
        label: c.label,
        icon: ICONS[c.icon] ?? Package,
        to: c.path,
      })),
    }))
}

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
function useActiveNavPath(sections: NavSection[]): string | null {
  const { pathname } = useLocation()
  const allPaths = sections.flatMap((s) => s.items.map((i) => i.to))
  const matches = allPaths.filter((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (matches.length === 0) return null
  return matches.reduce((longest, p) => (p.length > longest.length ? p : longest))
}

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
  const { activeSite } = useWebsiteStore()

  // 2026-07-21 (admin-menu role/addon/flag/plan gating): visibility is now
  // resolved server-side (role rank + org add-ons + site feature flags +
  // org plan) — see menu.service.ts / cms-menu.routes.ts. 5 min staleTime
  // matches the addon system's own cache TTL (addons.routes.ts CACHE_TTL);
  // a superadmin toggle still reaches this menu within that window without
  // polling on every render.
  const menuQuery = useQuery({
    queryKey: ['cms', 'menu', activeSite?.id],
    queryFn: () => menuService.getTree(activeSite!.id),
    enabled: !!activeSite?.id,
    staleTime: 5 * 60 * 1000,
  })
  // Fail open (no site selected yet, still loading, or the fetch errored):
  // fall back to a small baseline menu rather than an empty sidebar — same
  // trade-off the old addonSlug fail-open comment already accepted here,
  // just widened from one gate to all of them. The backend routes remain
  // the real enforcement point regardless of what this menu shows.
  const sections: NavSection[] = menuQuery.data ? treeToSections(menuQuery.data) : FALLBACK_NAV
  const activeNavPath = useActiveNavPath(sections)

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
        {sections.map(({ section, items: visibleItems }) => {
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
