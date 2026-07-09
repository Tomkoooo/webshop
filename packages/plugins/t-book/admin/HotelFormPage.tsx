"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@wse/core/components/ui/button"
import type { TBookHotelPricing } from "../lib/pricing-types"
import { TBOOK_DEFAULT_VAT_PERCENT } from "../lib/vat"
import type { TBookPriceBasis } from "../lib/vat"
import { assignPricingKeys, normalizeHotelPricing } from "../lib/hotel-pricing"
import {
  tBookAdminApi,
  formatHuf,
  type AdminEvent,
  type AdminHotel,
} from "./t-book-api"
import {
  TBookField,
  TBookInput,
  TBookLoading,
  TBookPageHeader,
  TBookSelect,
} from "./t-book-admin-ui"
import { TBookWizard } from "./TBookWizard"
import { TBookRichTextField } from "./TBookRichTextField"
import { TBookGalleryField } from "./TBookMediaField"
import { TBookNetPriceField } from "./TBookNetPriceField"
import { RoomTypesEditor } from "./RoomTypesEditor"
import { AddonGroupsEditor } from "./AddonGroupsEditor"
import { HotelComplexitySummary } from "./HotelComplexitySummary"
import { PricingPreview } from "./PricingPreview"
import { TBookGroupSubnav } from "./TBookGroupSubnav"

const HOTEL_STEPS = [
  { id: "info", title: "Szállás adatai" },
  { id: "rooms", title: "Szobatípusok" },
  { id: "addons", title: "Extrák és felárak" },
  { id: "review", title: "Összegzés" },
]

type HotelDraft = {
  name: string
  description: string
  address: string
  distanceFromVenueKm: string
  contactEmail: string
  contactPhone: string
  gallery: string[]
  status: "draft" | "active" | "archived"
  pricing: TBookHotelPricing
}

const emptyPricing = (): TBookHotelPricing => ({
  priceBasis: "net",
  vatPercent: TBOOK_DEFAULT_VAT_PERCENT,
  roomTypes: [{ key: "standard", label: "Standard szoba", baseRateHuf: 0, sortOrder: 0 }],
  addonGroups: [],
})

function hotelToDraft(hotel: AdminHotel | null): HotelDraft {
  if (!hotel) {
    return {
      name: "",
      description: "",
      address: "",
      distanceFromVenueKm: "",
      contactEmail: "",
      contactPhone: "",
      gallery: [],
      status: "draft",
      pricing: emptyPricing(),
    }
  }
  return {
    name: hotel.name,
    description: hotel.description,
    address: hotel.address,
    distanceFromVenueKm:
      hotel.distanceFromVenueKm != null ? String(hotel.distanceFromVenueKm) : "",
    contactEmail: hotel.contactEmail,
    contactPhone: hotel.contactPhone,
    gallery: hotel.gallery,
    status: hotel.status,
    pricing: normalizeHotelPricing(hotel.pricing),
  }
}

function eventNightsOf(event: AdminEvent): number {
  const ms = new Date(event.endDate).getTime() - new Date(event.startDate).getTime()
  return Math.max(1, Math.round(ms / 86_400_000))
}

export function HotelFormPage({
  groupId,
  hotelId,
}: {
  groupId: string
  hotelId?: string
}) {
  const router = useRouter()
  const isEdit = Boolean(hotelId)
  const [loading, setLoading] = useState(true)
  const [groupName, setGroupName] = useState("")
  const [previewEvent, setPreviewEvent] = useState<AdminEvent | null>(null)
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<HotelDraft>(() => hotelToDraft(null))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loads: Promise<void>[] = [
      tBookAdminApi<{ group: { name: string } }>(`groups/${groupId}`).then((g) => {
        setGroupName(g.group.name)
      }),
      tBookAdminApi<{ events: AdminEvent[] }>(`events?groupId=${groupId}`).then((e) => {
        setPreviewEvent(e.events[0] ?? null)
      }),
    ]
    if (hotelId) {
      loads.push(
        tBookAdminApi<{ hotel: AdminHotel }>(`hotels/${hotelId}`).then((res) => {
          setDraft(hotelToDraft(res.hotel))
        })
      )
    }
    Promise.all(loads)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [groupId, hotelId])

  const patch = (partial: Partial<HotelDraft>) => setDraft((d) => ({ ...d, ...partial }))
  const patchPricing = (partial: Partial<TBookHotelPricing>) =>
    setDraft((d) => ({
      ...d,
      pricing: assignPricingKeys({ ...d.pricing, ...partial }),
    }))

  const previewPricing = useMemo(() => assignPricingKeys(draft.pricing), [draft.pricing])
  const roomTypes = previewPricing.roomTypes
  const priceBasisLabel = draft.pricing.priceBasis === "net" ? "nettó" : "bruttó"

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("A szállás neve kötelező.")
      setStep(0)
      return
    }
    if (draft.pricing.roomTypes.length === 0) {
      toast.error("Legalább egy szobatípus szükséges.")
      setStep(1)
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description,
        address: draft.address,
        distanceFromVenueKm: draft.distanceFromVenueKm
          ? Number(draft.distanceFromVenueKm)
          : null,
        contactEmail: draft.contactEmail,
        contactPhone: draft.contactPhone,
        gallery: draft.gallery,
        status: draft.status,
        pricing: draft.pricing,
      }
      if (isEdit && hotelId) {
        await tBookAdminApi(`hotels/${hotelId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        toast.success("Szállás mentve")
      } else {
        await tBookAdminApi(`groups/${groupId}/hotels`, {
          method: "POST",
          body: JSON.stringify(payload),
        })
        toast.success("Szállás létrehozva")
      }
      router.push(`/admin/plugins/t-book/groups/${groupId}/hotels`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <TBookLoading />

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TBookGroupSubnav groupId={groupId} groupName={groupName} />
      <TBookPageHeader
        title={isEdit ? `Szállás: ${draft.name || "…"}` : "Új szállás"}
        description="Szállás → szobatípusok (alapár) → foglalási szakaszok (extrák, étkezés, stb.)"
        actions={
          <Link
            href={`/admin/plugins/t-book/groups/${groupId}/hotels`}
            className="inline-flex h-10 items-center px-4 border border-border rounded-lg text-foreground text-sm"
          >
            ← Vissza a szállásokhoz
          </Link>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <div className="rounded-2xl bg-card shadow-sm p-6 md:p-8">
            <TBookWizard
              steps={HOTEL_STEPS}
              currentStep={step}
              onStepChange={setStep}
              onSubmit={() => void save()}
              submitting={saving}
              submitLabel={isEdit ? "Szállás mentése" : "Szállás létrehozása"}
            >
              {step === 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TBookField label="Szállás neve">
                      <TBookInput
                        value={draft.name}
                        onChange={(e) => patch({ name: e.target.value })}
                        placeholder="Hotel Panoráma"
                        autoFocus
                      />
                    </TBookField>
                    <TBookField label="Státusz">
                      <TBookSelect
                        value={draft.status}
                        onChange={(e) =>
                          patch({ status: e.target.value as HotelDraft["status"] })
                        }
                      >
                        <option value="draft">Vázlat</option>
                        <option value="active">Aktív</option>
                        <option value="archived">Archivált</option>
                      </TBookSelect>
                    </TBookField>
                  </div>
                  <TBookField label="Cím">
                    <TBookInput
                      value={draft.address}
                      onChange={(e) => patch({ address: e.target.value })}
                      placeholder="8600 Siófok, Petőfi sétány 1."
                    />
                  </TBookField>
                  <TBookField label="Távolság a helyszíntől (km)">
                    <TBookInput
                      type="number"
                      min={0}
                      step="0.1"
                      value={draft.distanceFromVenueKm}
                      onChange={(e) => patch({ distanceFromVenueKm: e.target.value })}
                      placeholder="pl. 2.5"
                    />
                  </TBookField>
                  <TBookRichTextField
                    label="Leírás"
                    value={draft.description}
                    onChange={(description) => patch({ description })}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TBookField label="Kapcsolat e-mail">
                      <TBookInput
                        value={draft.contactEmail}
                        onChange={(e) => patch({ contactEmail: e.target.value })}
                      />
                    </TBookField>
                    <TBookField label="Kapcsolat telefon">
                      <TBookInput
                        value={draft.contactPhone}
                        onChange={(e) => patch({ contactPhone: e.target.value })}
                      />
                    </TBookField>
                  </div>
                  <TBookGalleryField
                    label="Galéria"
                    value={draft.gallery}
                    onChange={(gallery) => patch({ gallery })}
                  />
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-4">
                  <TBookNetPriceField
                    label="Szobatípusok ÁFA beállítása"
                    amount={0}
                    priceBasis={(draft.pricing.priceBasis ?? "net") as TBookPriceBasis}
                    vatPercent={draft.pricing.vatPercent ?? TBOOK_DEFAULT_VAT_PERCENT}
                    onAmountChange={() => {}}
                    onPriceBasisChange={(priceBasis) => patchPricing({ priceBasis })}
                    onVatPercentChange={(vatPercent) => patchPricing({ vatPercent })}
                  />
                  <RoomTypesEditor
                    roomTypes={draft.pricing.roomTypes}
                    onChange={(roomTypes) => patchPricing({ roomTypes })}
                    priceBasisLabel={priceBasisLabel}
                  />
                </div>
              ) : null}

              {step === 2 ? (
                <AddonGroupsEditor
                  groups={draft.pricing.addonGroups}
                  onChange={(addonGroups) => patchPricing({ addonGroups })}
                  roomTypes={roomTypes}
                />
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <HotelComplexitySummary pricing={draft.pricing} />
                  <div className="rounded-xl bg-card shadow-sm p-4 text-sm space-y-2">
                    <p>
                      <strong className="text-foreground">{draft.name || "—"}</strong>
                      {draft.distanceFromVenueKm
                        ? ` · ${draft.distanceFromVenueKm} km a helyszíntől`
                        : ""}
                    </p>
                    <p className="text-neutral-400 text-xs">{draft.address || "Nincs cím"}</p>
                    <p className="text-neutral-300 text-xs">
                      {draft.pricing.roomTypes.length} szobatípus ·{" "}
                      {draft.pricing.addonGroups.length} foglalási szakasz
                    </p>
                    <ul className="text-xs text-neutral-500 space-y-1">
                      {draft.pricing.roomTypes.map((room) => (
                        <li key={room.key}>
                          {room.label}: {formatHuf(room.baseRateHuf)} / fő / éj ({priceBasisLabel})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </TBookWizard>
          </div>
        </div>

        <div className="xl:sticky xl:top-6 h-fit space-y-4">
          <HotelComplexitySummary pricing={previewPricing} />
          {previewEvent ? (
            <PricingPreview
              ticketFeeHuf={previewEvent.ticketFeeHuf}
              ticketFeeMode={previewEvent.ticketFeeMode}
              ticketPriceBasis={previewEvent.ticketPriceBasis}
              ticketVatPercent={previewEvent.ticketVatPercent}
              defaultNights={eventNightsOf(previewEvent)}
              pricing={previewPricing}
            />
          ) : (
            <p className="text-xs text-neutral-500 rounded-xl border border-border p-4">
              Ár-előnézethez hozz létre legalább egy eseményt a csoportban.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
