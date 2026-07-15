"use client"

import type { ComponentType, ReactNode } from "react"
import { Children, isValidElement, useMemo } from "react"
import { Calendar } from "lucide-react"
import { cn } from "@wse/core/lib/utils"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Button } from "@wse/core/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wse/core/components/ui/select"
import {
  pluginAdminFieldLabel,
  pluginAdminInputClass,
  pluginAdminPageDescription,
  pluginAdminPageHeader,
  pluginAdminPageTitle,
} from "@wse/core/lib/plugin-admin-ui"

export const tBookInputClass = pluginAdminInputClass

/** Radix Select cannot use empty string as item value — map option value="" to this sentinel. */
const TBOOK_SELECT_EMPTY = "__tbook_empty__"

type ParsedOption = {
  value: string
  label: ReactNode
  disabled?: boolean
}

function parseSelectOptions(children: ReactNode): ParsedOption[] {
  const options: ParsedOption[] = []
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ value?: string; disabled?: boolean; children?: ReactNode }>(child)) continue
    if (child.type !== "option") continue
    const rawValue = child.props.value ?? ""
    options.push({
      value: rawValue === "" ? TBOOK_SELECT_EMPTY : String(rawValue),
      label: child.props.children ?? rawValue,
      disabled: child.props.disabled,
    })
  }
  return options
}

function toSelectValue(value: string | number | readonly string[] | undefined): string {
  if (value == null || value === "") return TBOOK_SELECT_EMPTY
  return String(value)
}

function fromSelectValue(value: string): string {
  return value === TBOOK_SELECT_EMPTY ? "" : value
}

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

export function TBookDateInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Input
        {...props}
        type="date"
        className={cn(
          tBookInputClass,
          "pr-10",
          "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
          className
        )}
      />
      <Calendar
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  )
}

export function TBookSelect({
  value,
  onChange,
  children,
  className,
  disabled,
  id,
  required: _required,
  name: _name,
  autoFocus: _autoFocus,
  ..._rest
}: React.ComponentProps<"select">) {
  const options = useMemo(() => parseSelectOptions(children), [children])
  const selectValue = toSelectValue(value)

  return (
    <Select
      value={selectValue}
      onValueChange={(next) => {
        onChange?.({
          target: { value: fromSelectValue(next) },
        } as React.ChangeEvent<HTMLSelectElement>)
      }}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        className={cn("h-10 w-full bg-background shadow-sm ring-1 ring-border/60", className)}
      >
        <SelectValue placeholder="Válassz…" />
      </SelectTrigger>
      <SelectContent className="z-[300]" position="popper">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
