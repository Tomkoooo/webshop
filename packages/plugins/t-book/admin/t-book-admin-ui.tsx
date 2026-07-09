"use client"

import type { ComponentType, ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Button } from "@wse/core/components/ui/button"
import {
  pluginAdminFieldLabel,
  pluginAdminInputClass,
  pluginAdminPageDescription,
  pluginAdminPageHeader,
  pluginAdminPageTitle,
  pluginAdminSelectClass,
} from "@wse/core/lib/plugin-admin-ui"

export const tBookInputClass = pluginAdminInputClass

export const tBookSelectClass = pluginAdminSelectClass

export function TBookLoading({ label = "Betöltés…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
      <LoadingSpinner size="lg" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export function TBookField({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className={pluginAdminFieldLabel}>{label}</Label>
      {children}
    </div>
  )
}

export function TBookInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn(tBookInputClass, props.className)} />
}

export function TBookDateInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} type="date" className={cn(tBookInputClass, props.className)} />
}

export function TBookSelect(props: React.ComponentProps<"select">) {
  return <select {...props} className={cn(tBookSelectClass, props.className)} />
}

export function TBookPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className={pluginAdminPageHeader}>
      <div className="min-w-0 space-y-1">
        <h1 className={pluginAdminPageTitle}>{title}</h1>
        {description ? <p className={pluginAdminPageDescription}>{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function TBookPrimaryButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button type="button" className="h-10 px-5 font-semibold" {...props}>
      {children}
    </Button>
  )
}

export function TBookStatusBadge({
  status,
  labels,
}: {
  status: string
  labels: Record<string, string>
}) {
  const tone =
    status === "paid" || status === "confirmed" || status === "issued" || status === "active"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800"
      : status === "pending" || status === "checkout_started" || status === "draft"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-900"
        : status === "cancelled" || status === "expired" || status === "failed"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-800"
          : "border-border bg-muted text-muted-foreground"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tone
      )}
    >
      {labels[status] ?? status}
    </span>
  )
}
