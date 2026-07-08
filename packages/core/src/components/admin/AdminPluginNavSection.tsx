"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Puzzle } from "lucide-react"
import { useState } from "react"
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
  const [open, setOpen] = useState(true)

  if (groups.length === 0) return null

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  const isSectionActive = groups.some((g) =>
    g.items.some((item) => isItemActive(item.href))
  )

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 rounded-none text-sm font-black uppercase tracking-widest transition-all duration-300",
          isSectionActive
            ? "bg-white/15 text-white"
            : "text-neutral-500 hover:text-white hover:bg-white/5"
        )}
      >
        <Puzzle className={cn("w-5 h-5", isSectionActive ? "text-white" : "text-neutral-400")} />
        <span className="flex-1 text-left">Pluginok</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "")} />
      </button>

      {open && (
        <div className="ml-5 space-y-3 border-l border-white/10 pl-4">
          {groups.map((group) => (
            <div key={group.pluginId} className="space-y-1">
              <p className="px-4 py-1 text-[10px] font-black uppercase tracking-widest text-neutral-600">
                {group.pluginName}
              </p>
              {group.items.map((item) => {
                const active = isItemActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onAction}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-none text-xs font-black uppercase tracking-widest transition-all duration-300",
                      active
                        ? "bg-white/15 text-white shadow-lg shadow-black/20"
                        : "text-neutral-500 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
