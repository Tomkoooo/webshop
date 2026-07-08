"use client"

import type { ComponentType, ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Button } from "@wse/core/components/ui/button"

export const campAdminInputClass =
  "bg-black border-white/10 h-11 text-white rounded-none focus-visible:ring-primary"

export const campAdminSelectClass =
  "w-full h-11 bg-black border border-white/10 px-3 text-sm text-white rounded-none focus:outline-none focus:border-primary/50"

export function CampAdminLoading({ label = "Betöltés…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-neutral-400">
      <LoadingSpinner size="lg" />
      <p className="text-sm font-medium italic">{label}</p>
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
    <div className={cn("space-y-2", className)}>
      <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
        {label}
      </Label>
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
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 admin-icon-well rounded-xl group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 admin-icon-accent" />
        </div>
      </div>
      <div>
        <h3 className="text-white/40 text-sm font-medium mb-1 uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle ? <p className="mt-2 text-xs font-bold text-neutral-500">{subtitle}</p> : null}
      </div>
    </div>
  )
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
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight uppercase italic text-white">
          {title}
        </h1>
        {description ? (
          <p className="text-white/40 font-medium italic mt-2 max-w-2xl">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 shrink-0">{actions}</div> : null}
    </div>
  )
}

export function CampAdminPrimaryButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="krausz"
      className="h-11 px-6 uppercase tracking-widest text-[10px] font-black"
      {...props}
    >
      {children}
    </Button>
  )
}
