"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@wse/core/components/ui/dialog"
import { Button } from "@wse/core/components/ui/button"
import { campAdminApi } from "../camp-api"
import { CampAdminField, CampAdminInput } from "../camp-admin-ui"

type Props = {
  campId: string
  children: React.ReactNode
  onCreated: () => void
}

export function CreateSessionDialog({ campId, children, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const label = String(fd.get("label") ?? "").trim()
    const startDate = String(fd.get("startDate") ?? "")
    const endDate = String(fd.get("endDate") ?? "")
    const capacity = Number(fd.get("capacity") ?? 0)
    const isPublished = fd.get("isPublished") === "on"

    try {
      await campAdminApi(`camps/${campId}/sessions`, {
        method: "POST",
        body: JSON.stringify({
          label,
          startDate,
          endDate,
          capacity,
          isPublished,
        }),
      })
      setOpen(false)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-black border-white/10 text-white rounded-none sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-black uppercase italic tracking-wider text-white">
            Új turnus
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 py-4">
          <CampAdminField label="Turnus neve">
            <CampAdminInput name="label" required placeholder="1. hét — Budapest" />
          </CampAdminField>
          <div className="grid gap-6 sm:grid-cols-2">
            <CampAdminField label="Kezdés">
              <CampAdminInput name="startDate" type="date" required />
            </CampAdminField>
            <CampAdminField label="Vég">
              <CampAdminInput name="endDate" type="date" required />
            </CampAdminField>
          </div>
          <CampAdminField label="Kapacitás (fő)">
            <CampAdminInput name="capacity" type="number" min={1} required defaultValue={20} />
          </CampAdminField>
          <label className="flex items-center gap-3 text-sm text-neutral-300">
            <input type="checkbox" name="isPublished" className="size-4 accent-primary" />
            Közzététel azonnal
          </label>
          {error ? <p className="text-red-400 text-sm">{error}</p> : null}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="krausz"
              disabled={saving}
              className="flex-1 h-11 uppercase tracking-widest text-[10px] font-black"
            >
              {saving ? "Mentés…" : "Turnus létrehozása"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-11 border-white/10 text-white rounded-none"
            >
              Mégse
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
