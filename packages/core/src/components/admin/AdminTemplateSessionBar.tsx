"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@wse/core/components/ui/button"
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
    <div className="mb-6 rounded-lg border border-white/15 bg-white/4 px-4 py-3 text-sm text-neutral-300">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>
            <span className="text-neutral-500">Active in database (public default):</span>{" "}
            <span className="font-semibold text-white">{dbActiveName}</span>
          </p>
          {previewTemplateId ? (
            <p>
              <span className="text-amber-200/90">Admin storefront preview:</span>{" "}
              <span className="font-semibold text-amber-100">
                {previewTemplateName ?? previewTemplateId}
              </span>
              <span className="text-neutral-500">
                {" "}
                — only your admin session; max 1 h. While previewing another template, saved theme
                overrides are hidden on the storefront. End preview to see your shop colors.
              </span>
            </p>
          ) : (
            <p className="text-xs text-neutral-500">
              No preview session — the storefront uses the database active template (for you too).
            </p>
          )}
        </div>
        {previewTemplateId ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-500/40 text-amber-100 hover:bg-amber-500/10"
            disabled={pending}
            onClick={endPreview}
          >
            End preview
          </Button>
        ) : null}
      </div>
      {clearError ? (
        <p className="mt-2 text-xs text-red-400">Try again or open /admin/templates and use “Előnézet kikapcsolása”.</p>
      ) : null}
    </div>
  )
}
