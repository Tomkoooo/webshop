"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@wse/core/components/ui/dialog"
import { Button } from "@wse/core/components/ui/button"
import { emptyTBookLocation, type TBookLocation } from "../lib/location"
import { TBOOK_DEFAULT_VAT_PERCENT } from "../lib/vat"
import type { TBookPriceBasis } from "../lib/vat"
import { tBookAdminApi, type AdminEvent, type AdminGroup } from "./t-book-api"
import {
  TBookDateInput,
  TBookField,
  TBookInput,
  TBookSelect,
} from "./t-book-admin-ui"
import { TBookWizard } from "./TBookWizard"
import { TBookRichTextField } from "./TBookRichTextField"
import { TBookLocationField } from "./TBookLocationField"
import { TBookSingleMediaField } from "./TBookMediaField"
import { TBookNetPriceField } from "./TBookNetPriceField"

function toDateInputValue(value?: string): string {
  if (!value) return ""
  return new Date(value).toISOString().slice(0, 10)
}

const STEPS = [
  { id: "basics", title: "Alapadatok" },
  { id: "schedule", title: "Időpont & hely" },
  { id: "pricing", title: "Jegyár" },
  { id: "content", title: "Tartalom" },
]

type EventDraft = {
  groupId: string
  name: string
  description: string
  status: AdminEvent["status"]
  location: TBookLocation
  startDate: string
  endDate: string
  ticketFeeHuf: number
  ticketFeeMode: AdminEvent["ticketFeeMode"]
  ticketPriceBasis: TBookPriceBasis
  ticketVatPercent: number
  capacity: string
  heroImage: string
}

function draftFromEvent(event: AdminEvent | null, defaultGroupId?: string): EventDraft {
  return {
    groupId: event?.groupId ?? defaultGroupId ?? "",
    name: event?.name ?? "",
    description: event?.description ?? "",
    status: event?.status ?? "draft",
    location: event?.location ?? emptyTBookLocation(),
    startDate: toDateInputValue(event?.startDate),
    endDate: toDateInputValue(event?.endDate),
    ticketFeeHuf: event?.ticketFeeHuf ?? 0,
    ticketFeeMode: event?.ticketFeeMode ?? "per_person",
    ticketPriceBasis: event?.ticketPriceBasis ?? "net",
    ticketVatPercent: event?.ticketVatPercent ?? TBOOK_DEFAULT_VAT_PERCENT,
    capacity: event?.capacity != null ? String(event.capacity) : "",
    heroImage: event?.heroImage ?? "",
  }
}

export function EventFormDialog({
  event,
  groups,
  defaultGroupId,
  open,
  onOpenChange,
  onSaved,
}: {
  event: AdminEvent | null
  groups: AdminGroup[]
  defaultGroupId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<EventDraft>(() => draftFromEvent(event, defaultGroupId))

  useEffect(() => {
    if (open) {
      setStep(0)
      setDraft(draftFromEvent(event, defaultGroupId))
    }
  }, [open, event, defaultGroupId])

  const patch = (partial: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...partial }))

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("Az esemény neve kötelező.")
      setStep(0)
      return
    }
    if (!draft.startDate || !draft.endDate) {
      toast.error("A kezdő és záró dátum kötelező.")
      setStep(1)
      return
    }
    setSaving(true)
    const payload = {
      groupId: draft.groupId || null,
      name: draft.name.trim(),
      description: draft.description,
      location: draft.location,
      startDate: draft.startDate,
      endDate: draft.endDate,
      ticketFeeHuf: draft.ticketFeeHuf,
      ticketFeeMode: draft.ticketFeeMode,
      ticketPriceBasis: draft.ticketPriceBasis,
      ticketVatPercent: draft.ticketVatPercent,
      capacity: draft.capacity ? Number(draft.capacity) : null,
      heroImage: draft.heroImage,
      status: draft.status,
    }
    try {
      if (event) {
        await tBookAdminApi(`events/${event.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        toast.success("Esemény mentve")
      } else {
        await tBookAdminApi("events", { method: "POST", body: JSON.stringify(payload) })
        toast.success("Esemény létrehozva")
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Esemény szerkesztése" : "Új esemény"}</DialogTitle>
        </DialogHeader>
        <TBookWizard
          steps={STEPS}
          currentStep={step}
          onStepChange={setStep}
          onSubmit={() => void save()}
          submitting={saving}
          submitLabel={event ? "Mentés" : "Létrehozás"}
        >
          {step === 0 ? (
            <div className="space-y-4">
              <TBookField label="Név">
                <TBookInput
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="Sakkfesztivál 2026"
                  required
                />
              </TBookField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TBookField label="Eseménycsoport">
                  <TBookSelect
                    value={draft.groupId}
                    onChange={(e) => patch({ groupId: e.target.value })}
                    disabled={Boolean(defaultGroupId && !event)}
                  >
                    <option value="">— önálló esemény —</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </TBookSelect>
                </TBookField>
                <TBookField label="Státusz">
                  <TBookSelect
                    value={draft.status}
                    onChange={(e) => patch({ status: e.target.value as EventDraft["status"] })}
                  >
                    <option value="draft">Vázlat</option>
                    <option value="active">Aktív</option>
                    <option value="archived">Archivált</option>
                  </TBookSelect>
                </TBookField>
              </div>
            </div>
          ) : null}
          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TBookField label="Kezdő dátum">
                  <TBookDateInput
                    required
                    value={draft.startDate}
                    onChange={(e) => patch({ startDate: e.target.value })}
                  />
                </TBookField>
                <TBookField label="Záró dátum">
                  <TBookDateInput
                    required
                    value={draft.endDate}
                    onChange={(e) => patch({ endDate: e.target.value })}
                  />
                </TBookField>
              </div>
              <TBookLocationField
                value={draft.location}
                onChange={(location) => patch({ location })}
              />
            </div>
          ) : null}
          {step === 2 ? (
            <div className="space-y-4">
              <TBookNetPriceField
                label="Jegyár (Ft)"
                amount={draft.ticketFeeHuf}
                priceBasis={draft.ticketPriceBasis}
                vatPercent={draft.ticketVatPercent}
                onAmountChange={(ticketFeeHuf) => patch({ ticketFeeHuf })}
                onPriceBasisChange={(ticketPriceBasis) => patch({ ticketPriceBasis })}
                onVatPercentChange={(ticketVatPercent) => patch({ ticketVatPercent })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TBookField label="Jegyár módja">
                  <TBookSelect
                    value={draft.ticketFeeMode}
                    onChange={(e) =>
                      patch({ ticketFeeMode: e.target.value as EventDraft["ticketFeeMode"] })
                    }
                  >
                    <option value="per_person">Fő / jegy</option>
                    <option value="per_booking">Foglalásonként</option>
                  </TBookSelect>
                </TBookField>
                <TBookField label="Kapacitás (fő, üres = korlátlan)">
                  <TBookInput
                    type="number"
                    min={0}
                    value={draft.capacity}
                    onChange={(e) => patch({ capacity: e.target.value })}
                  />
                </TBookField>
              </div>
            </div>
          ) : null}
          {step === 3 ? (
            <div className="space-y-4">
              <TBookRichTextField
                label="Leírás"
                value={draft.description}
                onChange={(description) => patch({ description })}
              />
              <TBookSingleMediaField
                label="Borítókép"
                value={draft.heroImage}
                onChange={(heroImage) => patch({ heroImage })}
                aspect={16 / 9}
              />
            </div>
          ) : null}
        </TBookWizard>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full h-10 mt-2"
        >
          Mégse
        </Button>
      </DialogContent>
    </Dialog>
  )
}
