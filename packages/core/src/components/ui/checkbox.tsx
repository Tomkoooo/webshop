"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@wse/core/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-admin-border-strong bg-admin-surface-raised shadow-xs transition-shadow outline-none focus-visible:border-admin-accent focus-visible:ring-2 focus-visible:ring-admin-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-admin-accent data-[state=checked]:bg-admin-accent data-[state=checked]:text-admin-error-foreground",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <CheckIcon className="size-3.5 text-admin-background" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
