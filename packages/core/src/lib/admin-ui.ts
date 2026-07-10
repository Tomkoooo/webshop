/**
 * Semantic class helpers for the admin shell (tCrm / shadcn sidebar pattern).
 * Surfaces are border-light: shadow + whitespace, not boxed outlines.
 */

import { cn } from "@wse/core/lib/utils"

export const adminShell = "admin-shell"

export const adminPage = "flex flex-col gap-6"

export const adminPageHeader =
  "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4"

export const adminPageTitle = "text-3xl font-bold tracking-tight text-foreground"

export const adminPageDescription = "text-sm text-muted-foreground max-w-2xl"

export const adminPageActions = "flex shrink-0 flex-wrap items-center gap-2"

export const adminSection = "flex flex-col gap-4"

export const adminSectionTitle = "text-lg font-semibold text-foreground"

/** Soft elevated surface — no hard border */
export const adminSurface = "rounded-xl bg-card text-card-foreground shadow-sm"

export const adminCard = adminSurface

export const adminCardPadding = "p-6"

export const adminPanel =
  "flex flex-col gap-4 rounded-xl bg-card p-6 text-card-foreground shadow-sm"

export const adminKpiCard =
  "rounded-xl bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"

export const adminNavCard =
  "flex h-full flex-col gap-4 rounded-xl bg-card p-5 text-card-foreground shadow-sm transition-all hover:shadow-md"

export const adminNavCardGrid = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"

export const adminFieldLabel = "text-sm font-medium leading-none text-foreground"

export const adminFieldHint = "text-xs text-muted-foreground"

export const adminTableHead = "text-xs font-medium text-muted-foreground"

export const adminLinkAccent = "text-primary font-medium hover:underline underline-offset-4"

/** Table container — shadow only, no outer border */
export const adminTableWrap = "overflow-hidden rounded-xl bg-card shadow-sm"

export const adminFilterBar =
  "grid grid-cols-1 items-end gap-3 rounded-xl bg-muted/40 p-4 md:grid-cols-2 lg:grid-cols-4"

export const adminFilterInput =
  "h-10 w-full rounded-md border-0 bg-background px-3 text-sm text-foreground shadow-sm ring-1 ring-border/60 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"

export const adminMetricsRowClass =
  "grid grid-cols-2 gap-4 items-end sm:grid-cols-3 xl:grid-cols-4"

export const ADMIN_METRICS_ROW_CLASS = adminMetricsRowClass

/** @deprecated */
export const adminHeadlineAccent = "font-semibold text-foreground"
export const adminHeadlineAccentTight = ""
export const adminTextAccent = "text-foreground"
export const adminValue = "tabular-nums text-foreground"
export const adminIconAccent = "text-primary"
export const adminIconWell = "rounded-lg bg-muted p-2.5"
export const adminSectionMarker = "bg-primary"
export const adminNavActive = "bg-sidebar-accent text-sidebar-accent-foreground"
export const adminNavItem =
  "w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted text-muted-foreground"
export const adminNavItemActive =
  "w-full rounded-lg bg-muted px-3 py-2.5 text-left font-medium text-foreground"
export const adminNavGroupLabel = ""
export const adminInputClass =
  "flex h-9 w-full rounded-md border-0 bg-background px-3 py-1 text-sm shadow-sm ring-1 ring-border/60 transition-colors focus-visible:ring-2 focus-visible:ring-ring/50"

/** Inline CMS fields on storefront preview (works on light and dark hero backgrounds). */
export const cmsInlineFieldClass =
  "w-full rounded-md border-0 bg-background/90 px-2 py-1 text-sm text-foreground shadow-sm ring-1 ring-dashed ring-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export const cmsInlineTextareaClass = cn(cmsInlineFieldClass, "min-h-[96px] resize-y")

export function adminOrderStatusClass(status: string): string {
  switch (status) {
    case "pending":
      return "bg-amber-500/12 text-amber-900"
    case "processing":
      return "bg-blue-500/12 text-blue-900"
    case "shipped":
      return "bg-purple-500/12 text-purple-900"
    case "delivered":
    case "paid":
    case "confirmed":
    case "issued":
    case "active":
      return "bg-emerald-500/12 text-emerald-900"
    case "cancelled":
    case "expired":
    case "failed":
      return "bg-rose-500/12 text-rose-900"
    case "read":
    case "replied":
      return "bg-muted text-muted-foreground"
    case "unread":
      return "bg-primary/10 text-primary"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export const adminAlertInfo =
  "rounded-lg bg-primary/10 px-4 py-3 text-sm text-foreground"
export const adminAlertWarning =
  "rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-900"
export const adminAlertDanger =
  "rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-900"
