"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Puzzle } from "lucide-react"
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

export type PluginNavGroup = {
  pluginId: string
  pluginName: string
  items: Array<{ label: string; href: string }>
}

export function AdminPluginNavSection({
  groups,
  onAction,
}: {
  groups: PluginNavGroup[]
  onAction?: () => void
}) {
  const pathname = usePathname()
  const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href))
  const isSectionActive = resolveActiveNavHref(pathname, allHrefs) !== null

  if (groups.length === 0) return null

  return (
    <Collapsible defaultOpen={isSectionActive} className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="hover:bg-sidebar-accent flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium">
            <span className="flex items-center gap-2">
              <Puzzle className="size-4" />
              Pluginok
            </span>
            <ChevronDown
              className={cn("size-4 transition-transform", "group-data-[state=open]/collapsible:rotate-180")}
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            {groups.map((group) => (
              <div key={group.pluginId} className="mb-2">
                <p className="text-muted-foreground px-2 py-1 text-xs font-medium">{group.pluginName}</p>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuSub>
                      {group.items.map((item) => {
                        const active = isNavItemActive(pathname, item.href, allHrefs)
                        return (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton asChild isActive={active}>
                              <Link href={item.href} onClick={onAction}>
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            ))}
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}
