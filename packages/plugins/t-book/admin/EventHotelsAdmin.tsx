"use client"
/* eslint-disable react-hooks/set-state-in-effect -- admin panels fetch lists on mount */

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@wse/core/components/ui/button"
import {
  tBookAdminApi,
  formatHuf,
  TBOOK_STATUS_LABELS,
  type AdminEvent,
  type AdminHotel,
} from "./t-book-api"
import type { TBookHotelPricing } from "../lib/pricing-types"
import { TBOOK_DEFAULT_VAT_PERCENT } from "../lib/vat"
import type { TBookPriceBasis } from "../lib/vat"
import { normalizeHotelPricing } from "../lib/hotel-pricing"
import {
  TBookField,
  TBookInput,
  TBookLoading,
  TBookPageHeader,
  TBookPrimaryButton,
  TBookSelect,
  TBookStatusBadge,
} from "./t-book-admin-ui"
import { TBookWizard } from "./TBookWizard"
import { TBookRichTextField } from "./TBookRichTextField"
import { TBookGalleryField } from "./TBookMediaField"
import { TBookNetPriceField } from "./TBookNetPriceField"
import { RoomTypesEditor } from "./RoomTypesEditor"
import { AddonGroupsEditor } from "./AddonGroupsEditor"
import { HotelComplexitySummary } from "./HotelComplexitySummary"
import { PricingPreview } from "./PricingPreview"

const HOTEL_STEPS = [
  { id: "info", title: "Szállás adatai" },
  { id: "rooms", title: "Szobatípusok" },
  { id: "addons", title: "Felár-csoportok" },
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
  roomTypes: [
    { key: "standard", label: "Standard szoba", baseRateHuf: 0, sortOrder: 0 },
  ],
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

function HotelEditor({
  event,
  hotel,
  onBack,
  onSaved,
}: {
  event: AdminEvent
  hotel: AdminHotel | null
  onBack: () => void
  onSaved: () => void
}) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<HotelDraft>(() => hotelToDraft(hotel))
  const [saving, setSaving] = useState(false)

  const patch = (partial: Partial<HotelDraft>) => setDraft((d) => ({ ...d, ...partial }))
  const patchPricing = (partial: Partial<TBookHotelPricing>) =>
    setDraft((d) => ({ ...d, pricing: { ...d.pricing, ...partial } }))

  const priceBasisLabel = draft.pricing.priceBasis === "net" ? "nettó" : "bruttó"
  const roomTypeKeys = useMemo(
    () => draft.pricing.roomTypes.map((r) => r.key).filter(Boolean),
    [draft.pricing.roomTypes]
  )

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
        ...draft,
        distanceFromVenueKm: draft.distanceFromVenueKm
          ? Number(draft.distanceFromVenueKm)
          : null,
        eventId: event.id,
      }
      if (hotel) {
        await tBookAdminApi(`hotels/${hotel.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        toast.success("Szállás mentve")
      } else {
        await tBookAdminApi(`events/${event.id}/hotels`, {
          method: "POST",
          body: JSON.stringify(payload),
        })
        toast.success("Szállás létrehozva")
      }
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TBookPageHeader
        title={hotel ? `Szállás: ${hotel.name}` : "Új szállás"}
        description={`Esemény: ${event.name} — szállás → szobatípus → felár-csoportok`}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 border-white/10 text-white"
              onClick={onBack}
            >
              ← Vissza
            </Button>
            {step === HOTEL_STEPS.length - 1 ? (
              <TBookPrimaryButton disabled={saving} onClick={() => void save()}>
                {saving ? "Mentés…" : "Mentés"}
              </TBookPrimaryButton>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <TBookWizard
            steps={HOTEL_STEPS}
            currentStep={step}
            onStepChange={setStep}
            onSubmit={step === HOTEL_STEPS.length - 1 ? () => void save() : undefined}
            submitting={saving}
            submitLabel="Szállás mentése"
          >
            {step === 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TBookField label="Szállás neve">
                    <TBookInput
                      value={draft.name}
                      onChange={(e) => patch({ name: e.target.value })}
                      placeholder="Hotel Panoráma"
                    />
                  </TBookField>
                  <TBookField label="Státusz">
                    <TBookSelect
                      value={draft.status}
                      onChange={(e) => patch({ status: e.target.value as HotelDraft["status"] })}
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
                roomTypeKeys={roomTypeKeys}
              />
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <HotelComplexitySummary pricing={draft.pricing} />
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm space-y-2">
                  <p>
                    <strong className="text-white">{draft.name || "—"}</strong>
                    {draft.distanceFromVenueKm
                      ? ` · ${draft.distanceFromVenueKm} km a helyszíntől`
                      : ""}
                  </p>
                  <p className="text-neutral-400 text-xs">{draft.address || "Nincs cím"}</p>
                  <p className="text-neutral-300 text-xs">
                    {draft.pricing.roomTypes.length} szobatípus ·{" "}
                    {draft.pricing.addonGroups.length} felár-csoport
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

        <div className="xl:sticky xl:top-6 h-fit space-y-4">
          <HotelComplexitySummary pricing={draft.pricing} />
          <PricingPreview
            ticketFeeHuf={event.ticketFeeHuf}
            ticketFeeMode={event.ticketFeeMode}
            ticketPriceBasis={event.ticketPriceBasis}
            ticketVatPercent={event.ticketVatPercent}
            defaultNights={eventNightsOf(event)}
            pricing={draft.pricing}
          />
        </div>
      </div>
    </div>
  )
}

export function EventHotelsAdmin({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [hotels, setHotels] = useState<AdminHotel[]>([])
  const [loading, setLoading] = useState(true)
  const [editorHotel, setEditorHotel] = useState<AdminHotel | null | "new">(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      tBookAdminApi<{ event: AdminEvent }>(`events/${eventId}`),
      tBookAdminApi<{ hotels: AdminHotel[] }>(`events/${eventId}/hotels`),
    ])
      .then(([e, h]) => {
        setEvent(e.event)
        setHotels(
          h.hotels.map((hotel) => ({
            ...hotel,
            pricing: normalizeHotelPricing(hotel.pricing),
          }))
        )
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [eventId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (event?.groupId) {
      router.replace(`/admin/plugins/t-book/groups/${event.groupId}/hotels`)
    }
  }, [event, router])

  const remove = async (hotel: AdminHotel) => {
    if (!window.confirm(`Biztosan törlöd: ${hotel.name}?`)) return
    try {
      await tBookAdminApi(`hotels/${hotel.id}`, { method: "DELETE" })
      toast.success("Szállás törölve")
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    }
  }

  if (loading || !event) return <TBookLoading />

  if (editorHotel !== null) {
    return (
      <HotelEditor
        event={event}
        hotel={editorHotel === "new" ? null : editorHotel}
        onBack={() => setEditorHotel(null)}
        onSaved={() => {
          setEditorHotel(null)
          load()
        }}
      />
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TBookPageHeader
        title={`Szállások — ${event.name}`}
        description="Minden szálláshoz szobatípusok (alapár) és csoportosított felárok tartoznak."
        actions={
          <>
            <Link
              href="/admin/plugins/t-book/events"
              className="inline-flex items-center h-10 px-4 border border-white/10 rounded-lg text-white text-sm"
            >
              ← Események
            </Link>
            <TBookPrimaryButton onClick={() => setEditorHotel("new")}>
              + Új szállás
            </TBookPrimaryButton>
          </>
        }
      />

      {hotels.length > 0 ? (
        <HotelComplexitySummary
          hotels={hotels.map((h) => ({ name: h.name, pricing: h.pricing }))}
        />
      ) : null}

      {hotels.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          Még nincs szállás ehhez az eseményhez. A szállás opcionális — enélkül csak jegyet lehet
          foglalni.
        </p>
      ) : (
        <ul className="space-y-3">
          {hotels.map((hotel) => {
            const pricing = normalizeHotelPricing(hotel.pricing)
            const addonCount = pricing.addonGroups.reduce(
              (sum, g) => sum + g.options.length,
              0
            )
            return (
              <li
                key={hotel.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-white/10 rounded-2xl p-5 bg-white/5 hover:border-white/25 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-white truncate">{hotel.name}</p>
                    <TBookStatusBadge status={hotel.status} labels={TBOOK_STATUS_LABELS} />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {hotel.address || "Nincs cím"}
                    {hotel.distanceFromVenueKm != null
                      ? ` · ${hotel.distanceFromVenueKm} km a helyszíntől`
                      : ""}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {pricing.roomTypes.length} szobatípus · {pricing.addonGroups.length}{" "}
                    felár-csoport ({addonCount} mező)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 border-white/10 text-white text-xs font-bold"
                    onClick={() => setEditorHotel(hotel)}
                  >
                    Szerkesztés
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/10"
                    onClick={() => void remove(hotel)}
                  >
                    Törlés
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
