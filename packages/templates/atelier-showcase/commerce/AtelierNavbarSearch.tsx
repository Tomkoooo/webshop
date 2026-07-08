"use client"

import type { NavbarSearchSlotProps } from "@wse/sdk/templates/types"
import { cn } from "@wse/core/lib/utils"
import { LiveSearch } from "@wse/core/components/layout/LiveSearch"

/** Editorial chrome: soft pill around the engine live search. */
export function AtelierNavbarSearch({ className, placeholder, inputClassName }: NavbarSearchSlotProps) {
  return (
    <div className={cn("rounded-full border border-border bg-background/95 px-1 py-0.5 shadow-sm", className)}>
      <LiveSearch
        placeholder={placeholder}
        inputClassName={cn("h-9 border-0 bg-transparent shadow-none focus-visible:ring-0", inputClassName)}
      />
    </div>
  )
}
