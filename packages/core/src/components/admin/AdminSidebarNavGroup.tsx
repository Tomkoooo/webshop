"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDownIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@wse/core/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@wse/core/components/ui/sidebar"
import { isNavItemActive, resolveActiveNavHref } from "@wse/core/lib/admin-active-nav"
import { cn } from "@wse/core/lib/utils"

export type AdminSidebarNavItem = {
  href: string
  label: string
  icon: React.ReactNode
}

export function AdminSidebarNavGroup({
  label,
  items,
  defaultOpen = false,
  onLinkClick,
}: {
  label: string
  items: AdminSidebarNavItem[]
  defaultOpen?: boolean
  onLinkClick?: () => void
}) {
  const pathname = usePathname()
  const hrefs = items.map((item) => item.href)
  const isActiveGroup = resolveActiveNavHref(pathname, hrefs) !== null

  if (items.length === 0) return null

  return (
    <Collapsible defaultOpen={defaultOpen || isActiveGroup} className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="hover:bg-sidebar-accent flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium">
            {label}
            <ChevronDownIcon
              className={cn(
                "size-4 shrink-0 transition-transform",
                "group-data-[state=open]/collapsible:rotate-180"
              )}
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuSub>
                  {items.map((item) => {
                    const active = isNavItemActive(pathname, item.href, hrefs)
                    return (
                      <SidebarMenuSubItem key={item.href}>
                        <SidebarMenuSubButton asChild isActive={active}>
                          <Link href={item.href} onClick={onLinkClick}>
                            {item.icon}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}
