"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ComponentType } from "react"
import { 
  BarChart3, 
  LayoutDashboard, 
  Settings, 
  Package, 
  ShoppingCart, 
  Users, 
  MessageSquare, 
  FileEdit,
  LogOut,
  Mail,
  Send,
  Truck,
  CreditCard,
  Tag,
  ChevronDown,
  FolderTree,
  Puzzle,
  Store,
  Layout as LayoutIcon,
  Sparkles,
  ListOrdered,
  Globe2,
  BookOpen,
} from "lucide-react"
import { cn } from "@wse/core/lib/utils"
import { useSession, signOut } from "next-auth/react"
import {
  AdminPluginNavSection,
  type PluginNavGroup,
} from "@wse/core/components/admin/AdminPluginNavSection"
import type { ContentModeSidebarNav } from "@wse/core/lib/admin-plugin-navigation"

type FeatureKey = "newsletter" | "glsParcelPicker" | "stripePayments"

type MenuItem = {
  icon: ComponentType<{ className?: string }>
  label: string
  href: string
  featureKey?: FeatureKey
  requiresShop?: boolean
}

const topLevelMenuItems: MenuItem[] = [
  { icon: BookOpen, label: "Súgó", href: "/admin/sugo" },
  { icon: LayoutDashboard, label: "Áttekintés", href: "/admin" },
  { icon: ShoppingCart, label: "Rendelések", href: "/admin/orders", requiresShop: true },
  { icon: Mail, label: "Kapcsolat", href: "/admin/contact" },
  { icon: Users, label: "Felhasználók", href: "/admin/users" },
  { icon: BarChart3, label: "Statisztikák", href: "/admin/stats", requiresShop: true },
  { icon: MessageSquare, label: "Vélemények", href: "/admin/reviews", requiresShop: true },
  { icon: Settings, label: "Beállítások", href: "/admin/info" },
]

const menuGroups: Array<{
  id: "productManager" | "webshopSettings"
  label: string
  icon: ComponentType<{ className?: string }>
  items: MenuItem[]
}> = [
  {
    id: "productManager",
    label: "Termék kezelés",
    icon: FolderTree,
    items: [
      { icon: Package, label: "Termékek", href: "/admin/products", requiresShop: true },
      { icon: Package, label: "Kategóriák", href: "/admin/categories", requiresShop: true },
    ],
  },
  {
    id: "webshopSettings",
    label: "Webshop beállítások",
    icon: Store,
    items: [
      { icon: LayoutIcon, label: "Sablonok", href: "/admin/templates" },
      { icon: FileEdit, label: "CMS", href: "/admin/cms" },
      { icon: Mail, label: "Emailek", href: "/admin/emails" },
      { icon: Send, label: "Hírlevelek", href: "/admin/newsletters", featureKey: "newsletter" },
      { icon: CreditCard, label: "Fizetés", href: "/admin/payment" },
      { icon: Tag, label: "Kuponok", href: "/admin/coupons" },
      { icon: Truck, label: "Szállítás", href: "/admin/shipping", requiresShop: true },
      { icon: Sparkles, label: "Termék javaslatok", href: "/admin/shop/product-suggestions", requiresShop: true },
      { icon: Globe2, label: "Ország / kereskedés", href: "/admin/shop/trading", requiresShop: true },
      { icon: ListOrdered, label: "Kiemelt termékek", href: "/admin/shop/featured", requiresShop: true },
    ],
  },
]

export function AdminSidebar({
  className,
  onAction,
  brandName = "Generic",
  enabledFeatures,
  shopEnabled = true,
  pluginNavGroups = [],
  contentModeNav,
}: {
  className?: string
  onAction?: () => void
  brandName?: string
  enabledFeatures?: Partial<Record<FeatureKey, boolean>>
  shopEnabled?: boolean
  pluginNavGroups?: PluginNavGroup[]
  contentModeNav?: ContentModeSidebarNav
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const sidebarName = brandName.trim() || "Generic"
  const isVisibleByFeature = (item: MenuItem) => {
    if (!item.featureKey) return true
    return Boolean(enabledFeatures?.[item.featureKey])
  }
  const isVisibleForShopFlag = (item: MenuItem) => {
    if (item.requiresShop && !shopEnabled) return false
    return true
  }
  const visibleTopLevelItems = topLevelMenuItems
    .filter(isVisibleByFeature)
    .filter(isVisibleForShopFlag)
    .filter((item) => {
      if (shopEnabled) return true
      if (item.href === "/admin" || item.href === "/admin/stats") return false
      return true
    })

  const flattenedPluginItems: Array<{ label: string; href: string }> =
    !shopEnabled && contentModeNav?.flattenPluginNav && pluginNavGroups.length === 1
      ? pluginNavGroups[0].items
      : []

  const contentModePrimaryItems: MenuItem[] = []
  if (!shopEnabled && contentModeNav && flattenedPluginItems.length === 0) {
    contentModePrimaryItems.push({
      icon: LayoutDashboard,
      label: contentModeNav.overviewLabel,
      href: contentModeNav.overviewHref,
    })
    if (contentModeNav.statsHref) {
      contentModePrimaryItems.push({
        icon: BarChart3,
        label: contentModeNav.statsLabel,
        href: contentModeNav.statsHref,
      })
    }
  }

  const showPluginAccordion = pluginNavGroups.length > 0 && flattenedPluginItems.length === 0

  const visibleMenuGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(isVisibleByFeature).filter(isVisibleForShopFlag),
    }))
    .filter((group) => group.items.length > 0)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    productManager: true,
    webshopSettings: true,
  })
  const isItemActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const renderNavLink = (
    item: { icon: MenuItem["icon"]; label: string; href: string },
    size: "sm" | "md" = "md"
  ) => {
    const isActive = isItemActive(item.href)
    const py = size === "sm" ? "py-2.5" : "py-3"
    const text = size === "sm" ? "text-xs" : "text-sm"
    const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5"
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onAction}
        className={cn(
          `flex items-center gap-3 px-4 ${py} rounded-none ${text} font-black uppercase tracking-widest transition-all duration-300`,
          isActive
            ? "bg-white/15 text-white shadow-lg shadow-black/20"
            : "text-neutral-500 hover:text-white hover:bg-white/5"
        )}
      >
        <item.icon className={cn(iconSize, isActive ? "text-white" : "text-neutral-400")} />
        {item.label}
      </Link>
    )
  }

  return (
    <div className={cn("admin-shell h-full flex flex-col bg-[#0A0A0B]", className)}>
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 group" onClick={onAction}>

          <span className="text-2xl font-heading font-black tracking-tight text-white uppercase italic">
            {sidebarName} <span className="admin-headline-accent admin-headline-accent-tight">Admin</span>
          </span>
        </Link>
        
        {session?.user && (
          <div className="mt-8 px-2">
            <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-1">Üdvözöljük,</p>
            <p className="text-sm font-bold text-white truncate italic">Szia, {session.user.name}!</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {contentModePrimaryItems.map((item) => renderNavLink(item))}

        {flattenedPluginItems.map((item) =>
          renderNavLink({ icon: Puzzle, label: item.label, href: item.href }, "sm")
        )}

        {!shopEnabled && contentModePrimaryItems.length > 0 ? (
          <div className="my-2 border-t border-white/10" />
        ) : null}

        {visibleTopLevelItems[0]
          ? renderNavLink(visibleTopLevelItems[0])
          : null}

        {shopEnabled
          ? visibleTopLevelItems.slice(1, 3).map((item) => renderNavLink(item))
          : null}

        {visibleMenuGroups.map((group) => {
          const isGroupActive = group.items.some((item) => isItemActive(item.href))
          const isOpen = openGroups[group.id] ?? true

          return (
            <div key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() =>
                  setOpenGroups((prev) => ({ ...prev, [group.id]: !(prev[group.id] ?? true) }))
                }
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 rounded-none text-sm font-black uppercase tracking-widest transition-all duration-300",
                  isGroupActive
                    ? "bg-white/15 text-white"
                    : "text-neutral-500 hover:text-white hover:bg-white/5"
                )}
              >
                <group.icon className={cn("w-5 h-5", isGroupActive ? "text-white" : "text-neutral-400")} />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")} />
              </button>

              {isOpen && (
                <div className="ml-5 space-y-1 border-l border-white/10 pl-4">
                  {group.items.map((item) => {
                    const isActive = isItemActive(item.href)

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onAction}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-none text-xs font-black uppercase tracking-widest transition-all duration-300",
                          isActive
                            ? "bg-white/15 text-white shadow-lg shadow-black/20"
                            : "text-neutral-500 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-neutral-400")} />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {showPluginAccordion ? (
          <AdminPluginNavSection groups={pluginNavGroups} onAction={onAction} />
        ) : null}

        {(shopEnabled ? visibleTopLevelItems.slice(3) : visibleTopLevelItems.slice(1)).map(
          (item) => renderNavLink(item)
        )}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 w-full px-4 py-3 rounded-none text-xs font-black uppercase tracking-widest text-neutral-500 hover:text-white hover:bg-white/5 transition-all duration-300"
        >
          <ShoppingCart className="w-5 h-5" />
          {shopEnabled ? "Vissza a boltba" : "Vissza a honlapra"}
        </Link>
        
        <button 
          onClick={() => {
            if (onAction) onAction();
            signOut({ callbackUrl: "/" });
          }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-none text-xs font-black uppercase tracking-widest text-neutral-500 hover:text-rose-500 hover:bg-rose-500/5 transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          Kijelentkezés
        </button>
      </div>
    </div>
  )
}

