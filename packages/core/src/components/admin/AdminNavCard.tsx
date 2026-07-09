import Link from "next/link"
import type { ComponentType, ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@wse/core/lib/utils"
import { adminNavCard, adminNavCardGrid } from "@wse/core/lib/admin-ui"

export type AdminNavCardAccent = "default" | "marketing" | "settings"

const accentIconClass: Record<AdminNavCardAccent, string> = {
  default: "bg-muted text-muted-foreground",
  marketing: "bg-amber-100 text-amber-800",
  settings: "bg-primary/10 text-primary",
}

const accentHoverClass: Record<AdminNavCardAccent, string> = {
  default: "hover:bg-accent/30",
  marketing: "hover:bg-amber-50/80",
  settings: "hover:bg-primary/5",
}

type AdminNavCardProps = {
  href: string
  title: string
  description?: string
  meta?: string
  icon?: ComponentType<{ className?: string }>
  accent?: AdminNavCardAccent
  className?: string
  children?: ReactNode
}

export function AdminNavCard({
  href,
  title,
  description,
  meta,
  icon: Icon,
  accent = "default",
  className,
  children,
}: AdminNavCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        adminNavCard,
        accentHoverClass[accent],
        "group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <ArrowRight
        className="text-muted-foreground absolute right-5 top-5 size-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
        aria-hidden
      />
      {Icon ? (
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            accentIconClass[accent]
          )}
        >
          <Icon className="size-5" aria-hidden />
        </div>
      ) : null}
      <div className="space-y-1.5 pr-6">
        <h3 className="text-base font-semibold leading-snug text-foreground">{title}</h3>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
        {children}
      </div>
    </Link>
  )
}

export function AdminNavCardGrid({
  children,
  className,
  columns = "responsive",
}: {
  children: ReactNode
  className?: string
  columns?: "responsive" | "two" | "three"
}) {
  return (
    <div
      className={cn(
        adminNavCardGrid,
        columns === "two" && "sm:grid-cols-2",
        columns === "three" && "sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  )
}
