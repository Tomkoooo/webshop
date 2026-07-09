import * as React from "react"

import { cn } from "@wse/core/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-admin-md border border-admin-border bg-admin-surface-raised px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-subtle transition-[color,box-shadow] outline-none focus-visible:border-admin-accent focus-visible:ring-2 focus-visible:ring-admin-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
