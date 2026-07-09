"use client"

import type { ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"

/** Light strip below the CMS toolbar for page-specific controls (SEO, toggles, etc.). */
export function CmsEditorSubtoolbar({
  title,
  description,
  children,
  className,
}: {
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("cms-editor-subtoolbar border-b border-border/40 bg-muted/30 px-4 py-3 space-y-3", className)}>
      {title ? <p className="text-sm font-medium text-foreground">{title}</p> : null}
      {description ? <p className="text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
      {children}
    </div>
  )
}
