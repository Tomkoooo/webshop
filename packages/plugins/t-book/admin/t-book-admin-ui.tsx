"use client"

import type { ComponentType, ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Button } from "@wse/core/components/ui/button"

export const tBookInputClass =
  "bg-black border-white/10 h-10 text-white rounded-lg focus-visible:ring-primary"

export const tBookSelectClass =
  "w-full h-10 bg-black border border-white/10 px-3 text-sm text-white rounded-lg focus:outline-none focus:border-primary/50"

export function TBookLoading({ label = "Betöltés…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-neutral-400">
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
      <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.15em]">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function TBookInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn(tBookInputClass, props.className)} />
}

/** Date inputs with visible calendar icon on dark admin backgrounds. */
export function TBookDateInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      type="date"
      className={cn(
        tBookInputClass,
        "[color-scheme:dark]",
        "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
        "[&::-webkit-calendar-picker-indicator]:invert",
        "[&::-webkit-calendar-picker-indicator]:opacity-90",
        props.className
      )}
    />
  )
}

export function TBookSelect(props: React.ComponentProps<"select">) {
  return <select {...props} className={cn(tBookSelectClass, props.className)} />
}

export function TBookKpiCard({
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
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">{title}</h1>
        {description ? (
          <p className="text-white/40 font-medium mt-2 max-w-2xl">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 shrink-0">{actions}</div> : null}
    </div>
  )
}

export function TBookPrimaryButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      className="h-10 px-5 font-bold"
      {...props}
    >
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
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : status === "pending" || status === "checkout_started" || status === "draft"
        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
        : status === "cancelled" || status === "expired" || status === "failed"
          ? "bg-red-500/15 text-red-300 border-red-500/30"
          : "bg-white/10 text-neutral-300 border-white/15"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap",
        tone
      )}
    >
      {labels[status] ?? status}
    </span>
  )
}
