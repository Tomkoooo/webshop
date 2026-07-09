import type { ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"
import { adminPanel } from "@wse/core/lib/admin-ui"

export function AdminPanel({
  title,
  description,
  children,
  className,
  actions,
}: {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
}) {
  return (
    <section className={cn(adminPanel, className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            {title ? <h2 className="text-lg font-semibold text-foreground">{title}</h2> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  )
}
