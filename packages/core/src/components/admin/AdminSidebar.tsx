"use client"

import Link from "next/link"
import { useCallback, useMemo } from "react"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  LogOut,
  Puzzle,
  Shield,
  ShoppingCart,
  Users,
} from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback } from "@wse/core/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@wse/core/components/ui/sidebar"
import { AdminPluginNavSection, type PluginNavGroup } from "@wse/core/components/admin/AdminPluginNavSection"
import {
  AdminSidebarNavGroup,
  type AdminSidebarNavItem,
} from "@wse/core/components/admin/AdminSidebarNavGroup"
import type { ContentModeSidebarNav } from "@wse/core/lib/admin-plugin-navigation"
import {
  adminNavGroups,
  adminPrimaryItems,
  filterAdminNavItems,
  isAdminNavItemActive,
  type AdminFeatureKey,
  type AdminNavItem,
} from "@wse/core/lib/admin-nav"
import { isNavItemActive } from "@wse/core/lib/admin-active-nav"

type FeatureKey = AdminFeatureKey

function NavIcon({ icon: Icon }: { icon: AdminNavItem["icon"] }) {
  return <Icon className="size-4 shrink-0" />
}

function getInitials(name?: string | null) {
  if (!name?.trim()) return "A"
  const parts = name.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

export function AdminSidebar({
  brandName = "Generic",
  enabledFeatures,
  shopEnabled = true,
  pluginNavGroups = [],
  contentModeNav,
  multiTenantAdmin = false,
  isSystemAdmin = false,
}: {
  brandName?: string
  enabledFeatures?: Partial<Record<FeatureKey, boolean>>
  shopEnabled?: boolean
  pluginNavGroups?: PluginNavGroup[]
  contentModeNav?: ContentModeSidebarNav
  multiTenantAdmin?: boolean
  isSystemAdmin?: boolean
}) {
  const { data: session } = useSession()
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()

  const onLinkClick = useCallback(() => setOpenMobile(false), [setOpenMobile])

  const primaryItems = useMemo(
    () =>
      filterAdminNavItems(adminPrimaryItems, { enabledFeatures, shopEnabled }).filter((item) => {
        if (shopEnabled) return true
        return item.href !== "/admin" && item.href !== "/admin/stats"
      }),
    [enabledFeatures, shopEnabled]
  )

  const visibleGroups = useMemo(
    () =>
      adminNavGroups
        .map((group) => ({
          ...group,
          items: filterAdminNavItems(group.items, { enabledFeatures, shopEnabled }),
        }))
        .filter((group) => group.items.length > 0),
    [enabledFeatures, shopEnabled]
  )

  const flattenedPluginItems =
    !shopEnabled && contentModeNav?.flattenPluginNav && pluginNavGroups.length === 1
      ? pluginNavGroups[0].items
      : []

  const primaryHrefs = primaryItems.map((i) => i.href)

  const contentModeItems: AdminSidebarNavItem[] = []
  if (!shopEnabled && contentModeNav && flattenedPluginItems.length === 0) {
    contentModeItems.push({
      href: contentModeNav.overviewHref,
      label: contentModeNav.overviewLabel,
      icon: <LayoutDashboard className="size-4" />,
    })
    if (contentModeNav.statsHref) {
      contentModeItems.push({
        href: contentModeNav.statsHref,
        label: contentModeNav.statsLabel,
        icon: <BarChart3 className="size-4" />,
      })
    }
  }

  const showPluginAccordion = pluginNavGroups.length > 0 && flattenedPluginItems.length === 0

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="pb-1">
        <Link
          href="/admin"
          onClick={onLinkClick}
          className="flex items-center gap-2 rounded-md px-2 py-1.5"
        >
          <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
            {brandName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold">{brandName}</p>
            <p className="text-muted-foreground truncate text-xs">Admin</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {multiTenantAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin"}>
                    <Link href="/admin" onClick={onLinkClick}>
                      <LayoutDashboard className="size-4" />
                      <span>Áttekintés</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isSystemAdmin ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith("/admin/system")}>
                      <Link href="/admin/system" onClick={onLinkClick}>
                        <Shield className="size-4" />
                        <span>Rendszer</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/admin/org")}>
                    <Link href="/admin/org/members" onClick={onLinkClick}>
                      <Users className="size-4" />
                      <span>Szervezet</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin/org/select"}>
                    <Link href="/admin/org/select" onClick={onLinkClick}>
                      <Building2 className="size-4" />
                      <span>Szervezet váltás</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {contentModeItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Modul</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {contentModeItems.map((item) => {
                  const hrefs = contentModeItems.map((i) => i.href)
                  const active = isNavItemActive(pathname, item.href, hrefs)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link href={item.href} onClick={onLinkClick}>
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {flattenedPluginItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Plugin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {flattenedPluginItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isAdminNavItemActive(pathname, item.href)}>
                      <Link href={item.href} onClick={onLinkClick}>
                        <Puzzle className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {primaryItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Ma</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {primaryItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isNavItemActive(pathname, item.href, primaryHrefs)}
                      tooltip={item.label}
                    >
                      <Link href={item.href} onClick={onLinkClick}>
                        <NavIcon icon={item.icon} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {visibleGroups.map((group) => (
          <AdminSidebarNavGroup
            key={group.id}
            label={group.label}
            items={group.items.map((item) => ({
              href: item.href,
              label: item.label,
              icon: <NavIcon icon={item.icon} />,
            }))}
            onLinkClick={onLinkClick}
          />
        ))}

        {showPluginAccordion ? (
          <AdminPluginNavSection groups={pluginNavGroups} onAction={onLinkClick} />
        ) : null}
      </SidebarContent>

      <SidebarFooter className="pt-1">
        <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-8">
            <AvatarFallback className="bg-muted text-xs font-medium">
              {getInitials(session?.user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">{session?.user?.name ?? "Admin"}</p>
            <p className="text-muted-foreground truncate text-xs">{session?.user?.email}</p>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Vissza a honlapra">
              <Link href="/" onClick={onLinkClick}>
                <ShoppingCart className="size-4" />
                <span>{shopEnabled ? "Vissza a boltba" : "Vissza a honlapra"}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Kijelentkezés" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="size-4" />
              <span>Kijelentkezés</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
