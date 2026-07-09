"use client"

import type { ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"

/**
 * On-canvas list item shell: subtle edit ring + toolbar slot.
 * Keeps storefront typography inside; admin controls live in the toolbar/footer slots.
 */
export function CmsEditableCard({
  children,
  toolbar,
  footer,
  className,
  editing = true,
}: {
  children: ReactNode
  toolbar?: ReactNode
  footer?: ReactNode
  className?: string
  editing?: boolean
}) {
  return (
    <div
      className={cn(
        "cms-editable-card relative",
        editing && "rounded-lg ring-2 ring-primary/30 ring-offset-2 ring-offset-transparent",
        className
      )}
    >
      {toolbar ? (
        <div className="cms-admin-control absolute right-2 top-2 z-20 flex flex-wrap justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [.cms-editable-card:hover_&]:opacity-100">
          {toolbar}
        </div>
      ) : null}
      {children}
      {footer ? <div className="cms-admin-control mt-3 space-y-2 border-t border-border/30 pt-3">{footer}</div> : null}
    </div>
  )
}
