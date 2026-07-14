import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FileText, BookOpen, Image, Film, MapPin,
  Megaphone, Globe, Settings, Users, BarChart2, Search,
  LogOut, Tag, Hash, Palette, Sliders,
  Package, Layers, MessageSquare, HelpCircle, Puzzle,
  Briefcase, Quote, DollarSign, Tv2, MessageCircle,
  ShoppingBag, Mail, Inbox, Bot, Link2, Rocket, FileSpreadsheet,
  Building2, Languages, Truck, Scale,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { WorkspaceSwitcher } from '@litostudio/ui-cms'

interface NavItem { label: string; icon: React.ElementType; to: string }
interface NavSection { section: string; items: NavItem[] }

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
      { label: 'Collections', icon: Layers,        to: '/collections' },
      { label: 'Orders',      icon: ShoppingBag,   to: '/orders' },
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
      { label: 'Campaigns', icon: Megaphone, to: '/campaigns' },
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
        {NAV.map(({ section, items }) => (
          <div key={section} className="mb-1">
            {/* Section label */}
            <div className="px-5 pt-[10px] pb-1 text-[10px] font-medium uppercase tracking-[0.10em] text-[var(--cms-sidebar-label)] font-body">
              {section}
            </div>

            {items.map(({ label, icon: Icon, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `cms-nav-item flex ${isActive ? 'active' : ''}`}
              >
                <Icon size={15} className="shrink-0 opacity-85" />
                <span className="leading-none truncate">{label}</span>
              </NavLink>
            ))}

            <div className="h-px mx-4 mt-1.5 bg-[var(--cms-sidebar-div)]" />
          </div>
        ))}
      </nav>

      {/* User widget */}
      <UserWidget />
    </aside>
  )
}
