"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { emptyTBookLocation, type TBookLocation } from "../lib/location"
import { TBOOK_DEFAULT_VAT_PERCENT } from "../lib/vat"
import type { TBookPriceBasis } from "../lib/vat"
import { tBookAdminApi, type AdminEvent } from "./t-book-api"
import {
  TBookDateInput,
  TBookField,
  TBookInput,
  TBookLoading,
  TBookPageHeader,
  TBookSelect,
} from "./t-book-admin-ui"
import { TBookWizard } from "./TBookWizard"
import { TBookRichTextField } from "./TBookRichTextField"
import { TBookLocationField } from "./TBookLocationField"
import { TBookSingleMediaField } from "./TBookMediaField"
import { TBookNetPriceField } from "./TBookNetPriceField"
import { AttendeeFieldsEditor } from "./AttendeeFieldsEditor"
import { TBookGroupSubnav } from "./TBookGroupSubnav"
import type { TBookAttendeeFieldDef } from "../lib/attendee-fields"

function toDateInputValue(value?: string): string {
  if (!value) return ""
  return new Date(value).toISOString().slice(0, 10)
}

const STEPS = [
  { id: "basics", title: "Alapadatok" },
  { id: "schedule", title: "Időpont & hely" },
  { id: "pricing", title: "Jegyár" },
  { id: "attendees", title: "Résztvevői adatok" },
  { id: "content", title: "Tartalom" },
]

type EventDraft = {
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
  attendeeFieldSchema: TBookAttendeeFieldDef[]
}

export function EventFormPage({
  groupId,
  eventId,
}: {
  groupId: string
  eventId?: string
}) {
  const router = useRouter()
  const isEdit = Boolean(eventId)
  const [loading, setLoading] = useState(isEdit)
  const [groupName, setGroupName] = useState("")
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<EventDraft>({
    name: "",
    description: "",
    status: "draft",
    location: emptyTBookLocation(),
    startDate: "",
    endDate: "",
    ticketFeeHuf: 0,
    ticketFeeMode: "per_person",
    ticketPriceBasis: "net",
    ticketVatPercent: TBOOK_DEFAULT_VAT_PERCENT,
    capacity: "",
    heroImage: "",
    attendeeFieldSchema: [],
  })

  useEffect(() => {
    const loads: Promise<void>[] = [
      tBookAdminApi<{ group: { name: string } }>(`groups/${groupId}`).then((g) => {
        setGroupName(g.group.name)
      }),
    ]
    if (eventId) {
      loads.push(
        tBookAdminApi<{ event: AdminEvent }>(`events/${eventId}`).then((res) => {
          const e = res.event
          setDraft({
            name: e.name,
            description: e.description,
            status: e.status,
            location: e.location ?? emptyTBookLocation(),
            startDate: toDateInputValue(e.startDate),
            endDate: toDateInputValue(e.endDate),
            ticketFeeHuf: e.ticketFeeHuf,
            ticketFeeMode: e.ticketFeeMode,
            ticketPriceBasis: e.ticketPriceBasis ?? "net",
            ticketVatPercent: e.ticketVatPercent ?? TBOOK_DEFAULT_VAT_PERCENT,
            capacity: e.capacity != null ? String(e.capacity) : "",
            heroImage: e.heroImage,
            attendeeFieldSchema: e.attendeeFieldSchema ?? [],
          })
        })
      )
    }
    Promise.all(loads)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [groupId, eventId])

  const patch = (partial: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...partial }))

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("Az esemény neve kötelező.")
      setStep(0)
      return
    }
    setSaving(true)
    const payload = {
      groupId,
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
      attendeeFieldSchema: draft.attendeeFieldSchema,
      status: draft.status,
    }
    try {
      if (isEdit && eventId) {
        await tBookAdminApi(`events/${eventId}`, { method: "PUT", body: JSON.stringify(payload) })
        toast.success("Esemény mentve")
      } else {
        await tBookAdminApi("events", { method: "POST", body: JSON.stringify(payload) })
        toast.success("Esemény létrehozva")
      }
      router.push(`/admin/plugins/t-book/groups/${groupId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <TBookLoading />

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <TBookGroupSubnav groupId={groupId} groupName={groupName} />
      <TBookPageHeader
        title={isEdit ? "Esemény szerkesztése" : "Új esemény"}
        description={`Csoport: ${groupName}`}
        actions={
          <Link
            href={`/admin/plugins/t-book/groups/${groupId}`}
            className="inline-flex h-10 items-center px-4 border border-border rounded-lg text-foreground text-sm"
          >
            Mégse
          </Link>
        }
      />
      <div className="rounded-2xl bg-card shadow-sm p-6 md:p-8">
        <TBookWizard
          steps={STEPS}
          currentStep={step}
          onStepChange={setStep}
          onSubmit={() => void save()}
          submitting={saving}
          submitLabel={isEdit ? "Mentés" : "Esemény létrehozása"}
        >
          {step === 0 ? (
            <div className="space-y-4">
              <TBookField label="Esemény neve">
                <TBookInput
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="Sakkfesztivál 2026"
                />
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
                <TBookField label="Kapacitás (üres = korlátlan)">
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
            <AttendeeFieldsEditor
              fields={draft.attendeeFieldSchema}
              onChange={(attendeeFieldSchema) => patch({ attendeeFieldSchema })}
            />
          ) : null}
          {step === 4 ? (
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
      </div>
    </div>
  )
}
