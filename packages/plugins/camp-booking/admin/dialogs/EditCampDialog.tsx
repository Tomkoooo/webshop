"use client"

import { useEffect, useState } from "react"
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
import { CampAdminImageField } from "../CampAdminImageField"

type CampDetail = {
  id: string
  title: string
  slug: string
  description?: string
  heroImage?: string
  sortOrder: number
  isPublished: boolean
}

type Props = {
  campId: string
  children: React.ReactNode
  onSaved: () => void
}

export function EditCampDialog({ campId, children, onSaved }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [camp, setCamp] = useState<CampDetail | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    campAdminApi<{ camp: CampDetail }>(`camps/${campId}`)
      .then((d) =>
        setCamp({
          ...d.camp,
          heroImage: d.camp.heroImage ?? "",
          description: d.camp.description ?? "",
        })
      )
      .catch((e) => setError(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [open, campId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!camp) return
    setSaving(true)
    setError(null)
    try {
      await campAdminApi(`camps/${campId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: camp.title.trim(),
          slug: camp.slug.trim().toLowerCase().replace(/\s+/g, "-"),
          description: camp.description?.trim() || undefined,
          heroImage: camp.heroImage?.trim() || undefined,
          sortOrder: camp.sortOrder,
          isPublished: camp.isPublished,
        }),
      })
      setOpen(false)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className=" sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Tábor szerkesztése
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-neutral-400 text-sm py-8">Betöltés…</p>
        ) : camp ? (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 py-4">
            <CampAdminField label="Cím">
              <CampAdminInput
                required
                value={camp.title}
                onChange={(e) => setCamp({ ...camp, title: e.target.value })}
              />
            </CampAdminField>
            <CampAdminField label="Slug (URL)">
              <CampAdminInput
                required
                value={camp.slug}
                onChange={(e) => setCamp({ ...camp, slug: e.target.value })}
              />
            </CampAdminField>
            <CampAdminField label="Leírás (opcionális)">
              <CampAdminInput
                value={camp.description}
                onChange={(e) => setCamp({ ...camp, description: e.target.value })}
              />
            </CampAdminField>
            <CampAdminImageField
              label="Borítókép"
              value={camp.heroImage ?? ""}
              onChange={(heroImage) => setCamp({ ...camp, heroImage })}
            />
            <CampAdminField label="Sorrend">
              <CampAdminInput
                type="number"
                min={0}
                value={camp.sortOrder}
                onChange={(e) => setCamp({ ...camp, sortOrder: Number(e.target.value) })}
              />
            </CampAdminField>
            <label className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={camp.isPublished}
                onChange={(e) => setCamp({ ...camp, isPublished: e.target.checked })}
                className="size-4 accent-primary"
              />
              Közzétéve
            </label>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                variant="default"
                disabled={saving}
                className="flex-1 h-11 font-semibold"
              >
                {saving ? "Mentés…" : "Mentés"}
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
        ) : error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
