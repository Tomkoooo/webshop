"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"

/** Non-fatal CMS editor failure — keeps the admin shell usable. */
export function CmsEditorErrorState({
  title,
  description,
  backHref = "/admin/cms",
  backLabel = "Vissza a CMS áttekintéshez",
}: {
  title: string
  description: string
  backHref?: string
  backLabel?: string
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center shadow-sm">
      <AlertTriangle className="mx-auto mb-4 size-10 text-destructive" aria-hidden />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  )
}
