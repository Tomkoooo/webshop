import type { ComponentType } from "react"
import {
  BarChart3,
  BookOpen,
  CreditCard,
  FileEdit,
  FolderTree,
  Globe2,
  Layout as LayoutIcon,
  LayoutDashboard,
  ListOrdered,
  Mail,
  MessageSquare,
  Package,
  Send,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Truck,
  Users,
} from "lucide-react"

export type AdminFeatureKey = "newsletter" | "glsParcelPicker" | "stripePayments"

export type AdminNavItem = {
  icon: ComponentType<{ className?: string }>
  label: string
  href: string
  featureKey?: AdminFeatureKey
  requiresShop?: boolean
}

export type AdminNavGroupId =
  | "daily"
  | "catalog"
  | "content"
  | "shopOps"
  | "marketing"
  | "system"

export type AdminNavGroup = {
  id: AdminNavGroupId
  label: string
  items: AdminNavItem[]
}

/** Primary destinations — always visible at the top of the sidebar. */
export const adminPrimaryItems: AdminNavItem[] = [
  { icon: LayoutDashboard, label: "Áttekintés", href: "/admin" },
  { icon: ShoppingCart, label: "Rendelések", href: "/admin/orders", requiresShop: true },
  { icon: Mail, label: "Kapcsolat", href: "/admin/contact" },
]

/** Grouped destinations — task-oriented, not a flat dump of every route. */
export const adminNavGroups: AdminNavGroup[] = [
  {
    id: "catalog",
    label: "Katalógus",
    items: [
      { icon: Package, label: "Termékek", href: "/admin/products", requiresShop: true },
      { icon: FolderTree, label: "Kategóriák", href: "/admin/categories", requiresShop: true },
      { icon: MessageSquare, label: "Vélemények", href: "/admin/reviews", requiresShop: true },
    ],
  },
  {
    id: "content",
    label: "Tartalom és megjelenés",
    items: [
      { icon: FileEdit, label: "CMS", href: "/admin/cms" },
      { icon: LayoutIcon, label: "Sablonok", href: "/admin/templates" },
      { icon: Mail, label: "E-mail sablonok", href: "/admin/emails" },
    ],
  },
  {
    id: "shopOps",
    label: "Bolt működés",
    items: [
      { icon: Truck, label: "Szállítás", href: "/admin/shipping", requiresShop: true },
      { icon: CreditCard, label: "Fizetés", href: "/admin/payment" },
      { icon: Tag, label: "Kuponok", href: "/admin/coupons" },
      { icon: ListOrdered, label: "Kiemelt termékek", href: "/admin/shop/featured", requiresShop: true },
      { icon: Globe2, label: "Ország / kereskedés", href: "/admin/shop/trading", requiresShop: true },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    items: [
      { icon: Send, label: "Hírlevelek", href: "/admin/newsletters", featureKey: "newsletter" },
      {
        icon: Sparkles,
        label: "Termék javaslatok",
        href: "/admin/shop/product-suggestions",
        requiresShop: true,
      },
    ],
  },
  {
    id: "system",
    label: "Rendszer",
    items: [
      { icon: Users, label: "Felhasználók", href: "/admin/users" },
      { icon: BarChart3, label: "Statisztikák", href: "/admin/stats", requiresShop: true },
      { icon: Settings, label: "Rendszerbeállítások", href: "/admin/info" },
      { icon: BookOpen, label: "Súgó", href: "/admin/sugo" },
    ],
  },
]

/** @deprecated Use adminPrimaryItems */
export const adminTopLevelItems = adminPrimaryItems

export function isAdminNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function filterAdminNavItems(
  items: AdminNavItem[],
  options: {
    enabledFeatures?: Partial<Record<AdminFeatureKey, boolean>>
    shopEnabled?: boolean
  }
): AdminNavItem[] {
  const { enabledFeatures, shopEnabled = true } = options
  return items.filter((item) => {
    if (item.requiresShop && !shopEnabled) return false
    if (item.featureKey && !enabledFeatures?.[item.featureKey]) return false
    return true
  })
}

export type AdminPageScaffoldProps = {
  title: string
  description?: import("react").ReactNode
  actions?: import("react").ReactNode
  backHref?: string
  backLabel?: string
  children: import("react").ReactNode
  className?: string
}
