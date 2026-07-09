"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@wse/core/components/ui/button"
import { toast } from "sonner"

type Props = {
  templateId: string
  isActive: boolean
  /** This template matches the storefront preview cookie (admin-only). */
  isPreviewTarget?: boolean
}

export function TemplatePreviewControls({
  templateId,
  isActive,
  isPreviewTarget = false,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showActivateConfirm, setShowActivateConfirm] = useState(false)

  const setPreview = async () => {
    const res = await fetch("/api/admin/templates/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ templateId }),
    })
    if (!res.ok) {
      toast.error("Nem sikerült beállítani az előnézetet.")
      return
    }
    toast.success(
      "Előnézet beállítva — csak admin session; max 1 h. másik sablon előnézete felülírja."
    )
    startTransition(() => router.refresh())
  }

  const clearPreview = async () => {
    const res = await fetch("/api/admin/templates/preview", { method: "DELETE" })
    if (!res.ok) {
      toast.error("Nem sikerült törölni az előnézetet.")
      return
    }
    toast.success("Előnézet kikapcsolva.")
    startTransition(() => router.refresh())
  }

  const activate = async () => {
    const res = await fetch("/api/admin/templates/activate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ templateId }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      toast.error(body?.error || "Aktiválás sikertelen.")
      return
    }
    toast.success("Sablon aktiválva. A publikus oldalak frissültek.")
    setShowActivateConfirm(false)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-2 pt-2">
      {isPreviewTarget ? (
        <p className="text-xs text-amber-900/95">
          Ez a sablon az admin előnézetben — lásd felül a részletes státuszsort és az „End preview”
          gombot is.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={isPreviewTarget ? "default" : "outline"}
        className={
          isPreviewTarget
            ? "bg-amber-600 hover:bg-amber-600/90 text-foreground border-none"
            : undefined
        }
        onClick={setPreview}
        disabled={pending}
      >
        {isPreviewTarget ? "Előnézet (aktuális)" : "Előnézet"}
      </Button>
      {isPreviewTarget ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={clearPreview}
          disabled={pending}
        >
          Előnézet kikapcsolása
        </Button>
      ) : null}
      {isActive ? (
        <span className="ml-auto text-xs font-medium text-green-600">
          Aktív sablon
        </span>
      ) : showActivateConfirm ? (
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={activate} disabled={pending}>
            Megerősítés
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowActivateConfirm(false)}
            disabled={pending}
          >
            Mégse
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          className="ml-auto"
          onClick={() => setShowActivateConfirm(true)}
          disabled={pending}
        >
          Aktiválás
        </Button>
      )}
      </div>
    </div>
  )
}
