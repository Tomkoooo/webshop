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
  children: React.ReactNode
  onCreated: () => void
}

export function CreateCampDialog({ children, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const title = String(fd.get("title") ?? "").trim()
    const slug = String(fd.get("slug") ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
    const description = String(fd.get("description") ?? "").trim()
    const heroImage = String(fd.get("heroImage") ?? "").trim()
    const isPublished = fd.get("isPublished") === "on"
    const sortOrder = Number(fd.get("sortOrder") ?? 0)

    try {
      await campAdminApi("camps", {
        method: "POST",
        body: JSON.stringify({
          title,
          slug,
          description: description || undefined,
          heroImage: heroImage || undefined,
          isPublished,
          sortOrder,
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
      <DialogContent className=" sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            Új tábor
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 py-4">
          <CampAdminField label="Cím">
            <CampAdminInput name="title" required placeholder="Minecraft nyári tábor" />
          </CampAdminField>
          <CampAdminField label="Slug (URL)">
            <CampAdminInput name="slug" required placeholder="minecraft-nyar" />
          </CampAdminField>
          <CampAdminField label="Leírás (opcionális)">
            <CampAdminInput name="description" placeholder="Rövid összefoglaló" />
          </CampAdminField>
          <CampAdminField label="Borítókép URL (opcionális)">
            <CampAdminInput
              name="heroImage"
              placeholder="/api/media/… or upload in CMS"
            />
          </CampAdminField>
          <CampAdminField label="Sorrend">
            <CampAdminInput name="sortOrder" type="number" defaultValue={0} min={0} />
          </CampAdminField>
          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              name="isPublished"
              className="size-4 accent-primary"
            />
            Közzététel azonnal
          </label>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="default"
              disabled={saving}
              className="flex-1 h-11 font-semibold"
            >
              {saving ? "Mentés…" : "Tábor létrehozása"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-11"
            >
              Mégse
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
