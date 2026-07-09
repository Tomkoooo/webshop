"use client"

import type { ComponentType, ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Button } from "@wse/core/components/ui/button"
import { AdminKpiCard } from "@wse/core/components/admin/AdminKpiCard"
import {
  pluginAdminFieldLabel,
  pluginAdminInputClass,
  pluginAdminPageDescription,
  pluginAdminPageHeader,
  pluginAdminPageTitle,
  pluginAdminSelectClass,
} from "@wse/core/lib/plugin-admin-ui"

export const campAdminInputClass = pluginAdminInputClass
export const campAdminSelectClass = pluginAdminSelectClass

export function CampAdminLoading({ label = "Betöltés…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
      <LoadingSpinner size="lg" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export function CampAdminField({
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

export function CampAdminInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn(campAdminInputClass, props.className)} />
}

export function CampKpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string
  value: string
  subtitle?: string
  icon: ComponentType<{ className?: string }>
}) {
  return <AdminKpiCard title={title} value={value} subtitle={subtitle} icon={Icon} />
}

export function CampAdminPageHeader({
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

export function CampAdminPrimaryButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button type="button" className="h-10 px-5 font-semibold" {...props}>
      {children}
    </Button>
  )
}
