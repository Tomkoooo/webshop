"use client"

import type { ReactNode } from "react"
import { Button } from "@wse/core/components/ui/button"

export function CmsReviewOverlay({
  title,
  description,
  onClose,
  closeLabel = "Vissza a szerkesztőhöz",
  children,
}: {
  title: ReactNode
  description?: ReactNode
  onClose: () => void
  closeLabel?: string
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-200 overflow-y-auto bg-background">
      <div className="sticky top-0 z-210 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>
          {closeLabel}
        </Button>
      </div>
      {children}
    </div>
  )
}
