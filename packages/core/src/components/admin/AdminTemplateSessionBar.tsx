"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@wse/core/components/ui/button"
import { adminAlertWarning, adminSurface } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"
import { toast } from "sonner"

type Props = {
  /** Template id persisted in Mongo (what non-admins see). */
  dbActiveName: string
  /** If set, admins see this template on the storefront instead of the DB active one. */
  previewTemplateId: string | null
  previewTemplateName: string | null
}

/** Shown on CMS and template admin pages: DB active template vs admin preview session. */
export function AdminTemplateSessionBar({
  dbActiveName,
  previewTemplateId,
  previewTemplateName,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [clearError, setClearError] = useState(false)

  const endPreview = async () => {
    setClearError(false)
    const res = await fetch("/api/admin/templates/preview", { method: "DELETE" })
    if (!res.ok) {
      setClearError(true)
      toast.error("Could not end preview session.")
      return
    }
    toast.success("Preview ended — storefront matches database active template.")
    startTransition(() => router.refresh())
  }

  return (
    <div className={cn("mb-6 px-4 py-3 text-sm", previewTemplateId ? adminAlertWarning : adminSurface)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>
            <span className="text-muted-foreground">Active in database (public default):</span>{" "}
            <span className="font-semibold text-foreground">{dbActiveName}</span>
          </p>
          {previewTemplateId ? (
            <p>
              <span className="font-medium text-amber-900">Admin storefront preview:</span>{" "}
              <span className="font-semibold text-amber-900">
                {previewTemplateName ?? previewTemplateId}
              </span>
              <span className="text-muted-foreground">
                {" "}
                — only your admin session; max 1 h. While previewing another template, saved theme
                overrides are hidden on the storefront. End preview to see your shop colors.
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              No preview session — the storefront uses the database active template (for you too).
            </p>
          )}
        </div>
        {previewTemplateId ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-500/40 text-amber-900 hover:bg-amber-500/10"
            disabled={pending}
            onClick={endPreview}
          >
            End preview
          </Button>
        ) : null}
      </div>
      {clearError ? (
        <p className="mt-2 text-xs text-destructive">Try again or open /admin/templates and use “Előnézet kikapcsolása”.</p>
      ) : null}
    </div>
  )
}
