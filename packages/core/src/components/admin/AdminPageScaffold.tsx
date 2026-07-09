import type { ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"
import {
  adminPage,
  adminPageActions,
  adminPageDescription,
  adminPageHeader,
  adminPageTitle,
} from "@wse/core/lib/admin-ui"
import type { AdminPageScaffoldProps } from "@wse/core/lib/admin-nav"
import { AdminBackLink } from "@wse/core/components/admin/AdminBackLink"

export function AdminPageScaffold({
  title,
  description,
  actions,
  backHref,
  backLabel,
  children,
  className,
}: AdminPageScaffoldProps) {
  return (
    <div className={cn(adminPage, className)}>
      {backHref ? <AdminBackLink href={backHref}>{backLabel ?? "Vissza"}</AdminBackLink> : null}
      <header className={adminPageHeader}>
        <div className="min-w-0 space-y-1">
          <h1 className={adminPageTitle}>{title}</h1>
          {description ? (
            <div className={adminPageDescription}>{description}</div>
          ) : null}
        </div>
        {actions ? <div className={adminPageActions}>{actions}</div> : null}
      </header>
      {children}
    </div>
  )
}

export function AdminSection({
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
    <section className={cn("flex flex-col gap-4", className)}>
      {title ? (
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
