"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { tBookAdminApi, type AdminGroup } from "./t-book-api"
import { AttendeeFieldsEditor } from "./AttendeeFieldsEditor"
import { TBookSingleMediaField } from "./TBookMediaField"
import { TBookPrimaryButton, tBookPanelClass } from "./t-book-admin-ui"
import type { TBookAttendeeFieldDef } from "../lib/attendee-fields"

type DefaultsDraft = {
  defaultAttendeeFieldSchema: TBookAttendeeFieldDef[]
  defaultHeroImage: string
  voucherHeaderImage: string
}

export function GroupDefaultsPanel({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<DefaultsDraft>({
    defaultAttendeeFieldSchema: [],
    defaultHeroImage: "",
    voucherHeaderImage: "",
  })

  useEffect(() => {
    tBookAdminApi<{ group: AdminGroup }>(`groups/${groupId}`)
      .then((res) => {
        setDraft({
          defaultAttendeeFieldSchema: res.group.defaultAttendeeFieldSchema ?? [],
          defaultHeroImage: res.group.defaultHeroImage ?? "",
          voucherHeaderImage: res.group.voucherHeaderImage ?? "",
        })
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [groupId])

  const save = async () => {
    setSaving(true)
    try {
      await tBookAdminApi(`groups/${groupId}`, {
        method: "PUT",
        body: JSON.stringify({
          defaultAttendeeFieldSchema: draft.defaultAttendeeFieldSchema,
          defaultHeroImage: draft.defaultHeroImage.trim(),
          voucherHeaderImage: draft.voucherHeaderImage.trim(),
        }),
      })
      toast.success("Csoport alapbeállítások mentve")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Alapbeállítások betöltése…</p>
  }

  return (
    <section className={`${tBookPanelClass} space-y-8`}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Alap foglalási adatok</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Minden esemény ezeket örökli alapból. Az esemény szerkesztésénél kiegészíthető vagy
          felülírható.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Résztvevői mezők (csoport alap)</h3>
        <AttendeeFieldsEditor
          fields={draft.defaultAttendeeFieldSchema}
          onChange={(defaultAttendeeFieldSchema) =>
            setDraft((d) => ({ ...d, defaultAttendeeFieldSchema }))
          }
        />
      </div>

      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-foreground">Képek & belépőjegyek (csoport alap)</h3>
        <p className="text-xs text-muted-foreground">
          Alapértelmezett borítókép és jegy PDF fejléc — az eseményen feltöltött kép felülírja.
        </p>
        <TBookSingleMediaField
          label="Alapértelmezett esemény borítókép"
          value={draft.defaultHeroImage}
          onChange={(defaultHeroImage) => setDraft((d) => ({ ...d, defaultHeroImage }))}
          aspect={16 / 9}
        />
        <TBookSingleMediaField
          label="Alapértelmezett jegy PDF fejléc"
          value={draft.voucherHeaderImage}
          onChange={(voucherHeaderImage) => setDraft((d) => ({ ...d, voucherHeaderImage }))}
          aspect={3 / 1}
        />
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <TBookPrimaryButton type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Mentés…" : "Alapbeállítások mentése"}
        </TBookPrimaryButton>
      </div>
    </section>
  )
}
