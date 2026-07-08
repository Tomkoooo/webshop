"use client"

import Link from "next/link"
import { cn } from "@wse/core/lib/utils"

/** Default atelier category row when `commerceSlots.CategoryPill` is omitted (same props as the slot). */
export function AtelierCategoryPill({
  label,
  active,
  href,
}: {
  label: string
  active?: boolean
  href?: string
}) {
  const className = cn(
    "inline-flex max-w-[14rem] shrink-0 items-center justify-center truncate border-2 border-double px-3 py-2 text-center font-serif text-[11px] font-medium uppercase tracking-[0.16em] transition-colors",
    active
      ? "border-primary-foreground/35 bg-primary/8 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
      : "border-border/70 text-muted-foreground hover:border-primary-foreground/35 hover:text-foreground"
  )
  if (href) {
    return (
      <Link href={href} className={className} scroll={false}>
        {label}
      </Link>
    )
  }
  return <span className={className}>{label}</span>
}
