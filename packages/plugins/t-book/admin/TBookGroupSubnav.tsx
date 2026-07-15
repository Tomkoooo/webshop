"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@wse/core/lib/utils"
import { pluginAdminLinkAccent } from "@wse/core/lib/plugin-admin-ui"

function tabs(groupId: string) {
  return [
    { label: "Áttekintés", href: `/admin/plugins/t-book/groups/${groupId}` },
    { label: "Események", href: `/admin/plugins/t-book/groups/${groupId}/events` },
    { label: "Szállások", href: `/admin/plugins/t-book/groups/${groupId}/hotels` },
    { label: "Beállítások", href: `/admin/plugins/t-book/groups/${groupId}/edit` },
  ]
}

export function TBookGroupSubnav({
  groupId,
  groupName,
}: {
  groupId: string
  groupName?: string
}) {
  const pathname = usePathname()

  return (
    <div className="space-y-3 border-b border-border/35 pb-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link href="/admin/plugins/t-book/groups" className={cn(pluginAdminLinkAccent, "text-xs")}>
          Csoportok
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{groupName ?? "…"}</span>
      </div>
      <nav className="flex flex-wrap gap-1 rounded-lg bg-muted/40 p-1">
        {tabs(groupId).map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href.endsWith("/hotels") && pathname?.includes(`/groups/${groupId}/hotels`)) ||
            (tab.href.endsWith("/events") && pathname?.includes(`/groups/${groupId}/events`)) ||
            (tab.href.endsWith("/edit") && pathname?.includes(`/groups/${groupId}/edit`))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-muted/55 text-foreground ring-1 ring-inset ring-border/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
