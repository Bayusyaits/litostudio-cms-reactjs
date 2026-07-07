/**
 * blockIcons.tsx — shared Lucide icon resolver for CMS block types.
 *
 * 2026-07 icon cleanup: extracted out of EditorLeftSidebar.tsx so
 * EditorListView.tsx (which used to hand-maintain its own, DIFFERENT emoji
 * per block type in a separate BLOCK_META map) can resolve the exact same
 * icon blockLibrary.ts already assigns per block type — one icon per block
 * type, not two independently-maintained ones that could drift apart.
 *
 * ICON_MAP keys must match the `icon` string in every BLOCK_LIBRARY entry
 * (apps/cms/src/modules/editor/blocks/blockLibrary.ts).
 */
import {
  Heading, AlignLeft, MousePointerClick, Minus, ArrowUpDown, Code2,
  Image, LayoutGrid, Play, Star, Megaphone, Layers, DollarSign, Quote,
  HelpCircle, Users, BarChart3, MapPin, Package, Archive, BookOpen,
  Mail, Send, Share2, FileText, Sparkles,
  Globe, Compass, Aperture, Camera, CalendarDays, Layers2,
  // Pattern-library icons (2026-07 icon cleanup)
  Palette, PenLine, Settings, MessageCircle, ShoppingBag, Shirt, Flower,
  Target, Sparkle,
  // Onboarding icons (2026-07 icon cleanup)
  Clapperboard, Plane, Briefcase,
  // AI panel tone icons (2026-07 icon cleanup)
  Smile, Feather,
  type LucideIcon,
} from 'lucide-react'

export const ICON_MAP: Record<string, LucideIcon> = {
  Heading, AlignLeft, MousePointerClick, Minus, ArrowUpDown, Code2,
  Image, LayoutGrid, Play, Star, Megaphone, Layers, DollarSign, Quote,
  HelpCircle, Users, BarChart3, MapPin, Package, Archive, BookOpen,
  Mail, Send, Share2, FileText, Sparkles,
  // Template-specific block icons
  Globe, Compass, Aperture, Camera, CalendarDays,
  Layers2,
  // Pattern-library icons
  Palette, PenLine, Settings, MessageCircle, ShoppingBag, Shirt, Flower,
  Target, Sparkle,
  // Onboarding icons
  Clapperboard, Plane, Briefcase,
  // AI panel tone icons
  Smile, Feather,
}

/** Renders the Lucide icon for a given icon name (from BLOCK_LIBRARY's `icon` field). */
export function BlockIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name]
  if (!Icon) return <span className="text-[10px]">{name[0]}</span>
  return <Icon size={size} />
}
