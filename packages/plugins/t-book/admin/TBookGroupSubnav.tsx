"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@wse/core/lib/utils"

function tabs(groupId: string) {
  return [
    { label: "Áttekintés", href: `/admin/plugins/t-book/groups/${groupId}` },
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
    <div className="space-y-3 border-b border-white/10 pb-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        <Link href="/admin/plugins/t-book/groups" className="hover:text-white transition-colors">
          Csoportok
        </Link>
        <span>/</span>
        <span className="text-neutral-300 font-medium">{groupName ?? "…"}</span>
      </div>
      <nav className="flex flex-wrap gap-2">
        {tabs(groupId).map((tab) => {
          const overviewHref = `/admin/plugins/t-book/groups/${groupId}`
          const active =
            pathname === tab.href ||
            (tab.href === overviewHref &&
              (pathname?.startsWith(`${overviewHref}/events`) ?? false)) ||
            (tab.href.endsWith("/hotels") && pathname?.includes(`/groups/${groupId}/hotels`)) ||
            (tab.href.endsWith("/edit") && pathname?.includes(`/groups/${groupId}/edit`))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors",
                active
                  ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
                  : "border-white/10 text-neutral-400 hover:border-white/25 hover:text-white"
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
