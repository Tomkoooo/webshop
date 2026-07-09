"use client"

import type { ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Button } from "@wse/core/components/ui/button"
import { AdminBackLink } from "@wse/core/components/admin/AdminBackLink"
import { AdminKpiCard } from "@wse/core/components/admin/AdminKpiCard"
import { AdminPanel } from "@wse/core/components/admin/AdminPanel"
import {
  pluginAdminFieldLabel,
  pluginAdminInputClass,
  pluginAdminPageDescription,
  pluginAdminPageHeader,
  pluginAdminPageTitle,
  pluginAdminSelectClass,
} from "@wse/core/lib/plugin-admin-ui"

export const orderLabInputClass = pluginAdminInputClass
export const orderLabSelectClass = pluginAdminSelectClass

export function OrderLabLoading({ label = "Betöltés…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
      <LoadingSpinner size="lg" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export function OrderLabPageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = "Vissza",
}: {
  title: string
  description?: string
  actions?: ReactNode
  backHref?: string
  backLabel?: string
}) {
  return (
    <div className="space-y-4">
      {backHref ? <AdminBackLink href={backHref}>{backLabel}</AdminBackLink> : null}
      <header className={pluginAdminPageHeader}>
        <div className="min-w-0 space-y-1">
          <h1 className={pluginAdminPageTitle}>{title}</h1>
          {description ? <p className={pluginAdminPageDescription}>{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
    </div>
  )
}

export function OrderLabField({
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

export function OrderLabInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn(orderLabInputClass, props.className)} />
}

export function OrderLabPanel({
  title,
  description,
  children,
  className,
}: {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <AdminPanel title={title} description={description} className={className}>
      {children}
    </AdminPanel>
  )
}

export function OrderLabPrimaryButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button type="button" className="h-10 px-5 font-semibold" {...props}>
      {children}
    </Button>
  )
}

export { AdminKpiCard as OrderLabKpiCard }
