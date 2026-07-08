"use client"

import * as React from "react"
import dynamicIconImports from "lucide-react/dynamicIconImports"
import type { LucideProps } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@wse/core/components/ui/dropdown-menu"

type IconName = keyof typeof dynamicIconImports
const ICON_NAMES = Object.keys(dynamicIconImports) as IconName[]

function toKebabCase(value: string) {
  return value
    .replace(/\s+/g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_+/g, "-")
    .toLowerCase()
}

function resolveIconName(value?: string): IconName {
  const fallback = "star" as IconName
  if (!value) return fallback

  const candidates = [
    value,
    value.trim(),
    value.toLowerCase(),
    toKebabCase(value),
    toKebabCase(value.trim()),
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    if (candidate in dynamicIconImports) {
      return candidate as IconName
    }
  }

  return fallback
}

export function DynamicLucideIcon({
  name,
  className,
}: {
  name?: string
  className?: string
}) {
  const [Icon, setIcon] = React.useState<React.ComponentType<LucideProps> | null>(null)

  React.useEffect(() => {
    const normalized = resolveIconName(name)
    const loader = dynamicIconImports[normalized]
    if (typeof loader !== "function") {
      const safeLoader = dynamicIconImports.star
      safeLoader().then((mod) => setIcon(() => mod.default))
      return
    }
    loader().then((mod) => setIcon(() => mod.default))
  }, [name])

  if (!Icon) return <span className={className} />
  return <Icon className={className} />
}

export function IconPicker({
  value,
  onChange,
  open,
  onOpenChange,
  triggerLabel,
}: {
  value?: string
  onChange: (iconName: string) => void
  open?: boolean
  onOpenChange?: (next: boolean) => void
  triggerLabel?: string
}) {
  const [query, setQuery] = React.useState("")
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ICON_NAMES.slice(0, 120)
    return ICON_NAMES.filter((name) => name.toLowerCase().includes(q)).slice(0, 120)
  }, [query])

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="justify-start gap-2">
          <DynamicLucideIcon name={value || "Star"} className="w-4 h-4" />
          {triggerLabel || "Ikon"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[340px] p-2 bg-surface border-border text-foreground shadow-xl opacity-100" align="start">
        <div className="space-y-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ikon keresés (pl. star, wrench, truck)"
            className="h-8"
          />
          <div className="max-h-64 overflow-auto grid grid-cols-3 gap-1">
            {filtered.map((name) => (
              <Button
                key={name}
                type="button"
                variant="ghost"
                size="sm"
                className="h-12 flex-col gap-1 px-1"
                onClick={() => {
                  onChange(name)
                  onOpenChange?.(false)
                }}
              >
                <DynamicLucideIcon name={name} className="w-4 h-4" />
                <span className="text-[10px] leading-none truncate w-full">{name}</span>
              </Button>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
