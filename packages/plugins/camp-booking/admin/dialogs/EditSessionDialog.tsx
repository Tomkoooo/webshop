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

export type SessionEditInitial = {
  id: string
  label: string
  startDate: string | Date
  endDate: string | Date
  capacity: number
  soldCount: number
  reservedCount: number
  isPublished: boolean
  imageUrl?: string
}

function toDateInputValue(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

type Props = {
  sessionId: string
  /** When omitted, loads from API on open */
  initial?: SessionEditInitial
  children: React.ReactNode
  onSaved: () => void
}

export function EditSessionDialog({ sessionId, initial, children, onSaved }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<SessionEditInitial | null>(null)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setSession({
        ...initial,
        imageUrl: initial.imageUrl ?? "",
      })
      return
    }
    setLoading(true)
    setError(null)
    campAdminApi<{ session: SessionEditInitial }>(`sessions/${sessionId}`)
      .then((d) =>
        setSession({
          ...d.session,
          imageUrl: d.session.imageUrl ?? "",
        })
      )
      .catch((e) => setError(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [open, sessionId, initial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    const start = new Date(session.startDate)
    const end = new Date(session.endDate)
    if (end < start) {
      setError("A vég dátuma nem lehet korábbi, mint a kezdés.")
      return
    }
    const minCapacity = session.soldCount + session.reservedCount
    if (session.capacity < minCapacity) {
      setError(
        `A kapacitás nem lehet kisebb, mint a már foglalt helyek (${minCapacity} fő).`
      )
      return
    }
    setSaving(true)
    setError(null)
    try {
      await campAdminApi(`sessions/${sessionId}`, {
        method: "PUT",
        body: JSON.stringify({
          label: session.label.trim(),
          startDate: toDateInputValue(session.startDate),
          endDate: toDateInputValue(session.endDate),
          capacity: session.capacity,
          isPublished: session.isPublished,
          imageUrl: session.imageUrl?.trim() || null,
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
      <DialogContent className="bg-black border-white/10 text-white rounded-none sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-black uppercase italic tracking-wider text-white">
            Turnus szerkesztése
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-neutral-400 text-sm py-8">Betöltés…</p>
        ) : session ? (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 py-4">
            <CampAdminField label="Turnus neve">
              <CampAdminInput
                required
                value={session.label}
                onChange={(e) => setSession({ ...session, label: e.target.value })}
              />
            </CampAdminField>
            <div className="grid gap-6 sm:grid-cols-2">
              <CampAdminField label="Kezdés">
                <CampAdminInput
                  type="date"
                  required
                  value={toDateInputValue(session.startDate)}
                  onChange={(e) => setSession({ ...session, startDate: e.target.value })}
                />
              </CampAdminField>
              <CampAdminField label="Vég">
                <CampAdminInput
                  type="date"
                  required
                  value={toDateInputValue(session.endDate)}
                  onChange={(e) => setSession({ ...session, endDate: e.target.value })}
                />
              </CampAdminField>
            </div>
            <CampAdminField label="Kapacitás (fő)">
              <CampAdminInput
                type="number"
                min={session.soldCount + session.reservedCount}
                required
                value={session.capacity}
                onChange={(e) => setSession({ ...session, capacity: Number(e.target.value) })}
              />
            </CampAdminField>
            <p className="text-xs text-neutral-500 -mt-4">
              Foglalt: {session.soldCount + session.reservedCount} / {session.capacity} fő
            </p>
            <CampAdminImageField
              label="Turnus kép"
              value={session.imageUrl ?? ""}
              onChange={(imageUrl) => setSession({ ...session, imageUrl })}
            />
            <label className="flex items-center gap-3 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={session.isPublished}
                onChange={(e) => setSession({ ...session, isPublished: e.target.checked })}
                className="size-4 accent-primary"
              />
              Közzétéve
            </label>
            {error ? <p className="text-red-400 text-sm">{error}</p> : null}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                variant="krausz"
                disabled={saving}
                className="flex-1 h-11 uppercase tracking-widest text-[10px] font-black"
              >
                {saving ? "Mentés…" : "Mentés"}
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
        ) : error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
